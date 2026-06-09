import httpx
import logging
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Optional
import numpy as np
from sklearn.cluster import DBSCAN
from fastapi import HTTPException
from app.services.meteo_service import get_sst

logger = logging.getLogger(__name__)


class OBISService:
    BASE_URL = "https://api.obis.org/v3/occurrence"

    SPECIES_CONFIG = {
        "thunnus-thynnus": {
            "name": "Thunnus thynnus",
            "radius": 200,
            "region": "POLYGON((-5 30, 36 30, 36 46, -5 46, -5 30))"
        },
        "xiphias-gladius": {
            "name": "Xiphias gladius",
            "radius": 200,
            "region": "POLYGON((-5 30, 36 30, 36 46, -5 46, -5 30))"
        },
        "gadus-morhua": {
            "name": "Gadus morhua",
            "radius": 150,
            "region": "POLYGON((-20 45, 20 45, 20 70, -20 70, -20 45))"
        },
        "sardina-pilchardus": {
            "name": "Sardina pilchardus",
            "radius": 100,
            "region": "POLYGON((-15 35, 10 35, 10 60, -15 60, -15 35))"
        }
    }

    def __init__(self):
        # In-Memory Cache: Dict[species_id, Dict[month, zone_data]]
        self._zone_cache: Dict[str, Dict[int, Dict]] = {}
        self.max_retries = 3
        self.initial_backoff = 1.0  # seconds
        self._is_ready = False  # Flag to indicate if the cache is warmed up

    async def fetch_occurrences(
            self,
            scientific_name: str,
            start_date: Optional[str] = None,
            end_date: Optional[str] = None,
            geometry: Optional[str] = None,
            size: int = 5000
    ) -> List[Dict]:
        raw_params = {
            "scientificname": scientific_name,
            "startdate": start_date,
            "enddate": end_date,
            "geometry": geometry,
            "size": size
        }

        params = {name: value for name, value in raw_params.items() if value is not None}

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get(self.BASE_URL, params=params)

                    # Error 429: Too Many Requests
                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 60))
                        logger.warning(
                            f"OBIS Rate-Limited (429) for {scientific_name}. Retry-After: {retry_after}s. Attempt {attempt + 1}/{self.max_retries}")
                        if attempt < self.max_retries - 1:
                            await asyncio.sleep(min(retry_after, 120))
                            continue
                        return []

                    response.raise_for_status()

                    if not response.content:
                        logger.warning(f"OBIS Empty Body Response for {scientific_name}")
                        return []

                    data = response.json()

                    if not isinstance(data, dict):
                        logger.error(
                            f"OBIS Invalid Response Type for {scientific_name}: Expected dict, got {type(data)}")
                        return []

                    results = data.get("results")

                    if not results:
                        logger.warning(f"OBIS Empty Results for {scientific_name}: API returned no sightings")
                        return []

                    if not isinstance(results, list):
                        logger.error(
                            f"OBIS Invalid Results Type for {scientific_name}: Expected list, got {type(results)}")
                        return []

                    parsed_occurrences = []
                    for item in results:
                        try:
                            if not isinstance(item, dict):
                                continue

                            lat = item.get("decimalLatitude")
                            lng = item.get("decimalLongitude")

                            if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
                                continue

                            date = item.get("eventDate")
                            parsed_occurrences.append({
                                "decimalLatitude": lat,
                                "decimalLongitude": lng,
                                "eventDate": date
                            })
                        except (KeyError, TypeError, ValueError):
                            continue

                    logger.info(f"OBIS Success: Fetched {len(parsed_occurrences)} occurrences for {scientific_name}")
                    return parsed_occurrences

            except httpx.TimeoutException:
                logger.warning(f"OBIS Timeout for {scientific_name}. Attempt {attempt + 1}/{self.max_retries}")
                if attempt < self.max_retries - 1:
                    backoff = self.initial_backoff * (2 ** attempt)
                    await asyncio.sleep(backoff)
                    continue
                return []

            except httpx.ConnectError as e:
                logger.warning(
                    f"OBIS Connection Error for {scientific_name}: Network unreachable. Attempt {attempt + 1}/{self.max_retries}. {str(e)}")
                if attempt < self.max_retries - 1:
                    backoff = self.initial_backoff * (2 ** attempt)
                    await asyncio.sleep(backoff)
                    continue
                return []

            except httpx.NetworkError as e:
                logger.warning(
                    f"OBIS Network Error for {scientific_name}. Attempt {attempt + 1}/{self.max_retries}. {str(e)}")
                if attempt < self.max_retries - 1:
                    backoff = self.initial_backoff * (2 ** attempt)
                    await asyncio.sleep(backoff)
                    continue
                return []

            except httpx.HTTPStatusError as e:
                if e.response.status_code >= 500:
                    logger.warning(
                        f"OBIS Server Error ({e.response.status_code}) for {scientific_name}. Attempt {attempt + 1}/{self.max_retries}")
                    if attempt < self.max_retries - 1:
                        backoff = self.initial_backoff * (2 ** attempt)
                        await asyncio.sleep(backoff)
                        continue
                else:
                    logger.error(f"OBIS HTTP Error ({e.response.status_code}) for {scientific_name}: {str(e)}")
                return []

            except json.JSONDecodeError as e:
                logger.error(f"OBIS JSON Parsing Error for {scientific_name}: Response body is malformed. {str(e)}")
                return []

            except asyncio.TimeoutError:
                logger.warning(f"OBIS Async Timeout for {scientific_name}. Attempt {attempt + 1}/{self.max_retries}")
                if attempt < self.max_retries - 1:
                    backoff = self.initial_backoff * (2 ** attempt)
                    await asyncio.sleep(backoff)
                    continue
                return []

            except Exception as e:
                logger.error(f"OBIS Unexpected Error for {scientific_name}: {type(e).__name__}: {str(e)}")
                return []

        logger.error(f"OBIS All Retries Exhausted for {scientific_name}")
        return []

    async def calculate_zones(self, species_id: str, occurrences: List[Dict]) -> Dict[int, List[Dict]]:
        if not occurrences or not isinstance(occurrences, list):
            logger.warning(f"Invalid occurrences input for {species_id}: Expected list, got {type(occurrences)}")
            return {}
        # Groups sightings by month and calculates the average center point
        monthly_groups = {m: [] for m in range(1, 13)}
        radius = self.SPECIES_CONFIG.get(species_id, {}).get("radius", 200)

        for occ in occurrences:
            try:
                lat, lng = occ.get("decimalLatitude"), occ.get("decimalLongitude")
                date_str = occ.get("eventDate")
                if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)) or not date_str:
                    continue

                date = datetime.fromisoformat(date_str.split('T')[0])
                monthly_groups[date.month].append((lat, lng))
            except (ValueError, AttributeError, TypeError):
                continue

        calculated_zones = {m: [] for m in range(1, 13)}
        for month, coords in monthly_groups.items():
            if len(coords) < 3: # should be minimum 3 points to avoid "noise"
                continue

            # Convert to radians for Haversine metric clustering
            coords_array = np.radians(np.array(coords))
            epsilon = radius / 6371.0

            db = DBSCAN(eps=epsilon, min_samples=3, algorithm='ball_tree', metric='haversine').fit(coords_array)
            unique_labels = set(db.labels_)

            for label in unique_labels:
                if label == -1:  # Skip noise/outliers
                    continue

                cluster_coords = [coords[i] for i in range(len(coords)) if db.labels_[i] == label]
                avg_lat = sum(c[0] for c in cluster_coords) / len(cluster_coords)
                avg_lng = sum(c[1] for c in cluster_coords) / len(cluster_coords)

                # To prevent showing fish on land
                is_water = True
                try:
                    await get_sst(avg_lat, avg_lng)
                except HTTPException as e:
                    if e.status_code == 404:
                        logger.info(f"Discarded land-based cluster for {species_id} at {avg_lat}, {avg_lng}")
                        is_water = False
                    else:
                        logger.warning(f"Meteo API returned {e.status_code}. Keeping cluster as fallback.")
                except Exception as e:
                    logger.warning(
                        f"Meteo check timed out or failed ({type(e).__name__}). Keeping cluster as fallback.")

                if is_water:
                    calculated_zones[month].append({
                        "center": {"lat": avg_lat, "lng": avg_lng},
                        "radius_km": radius,
                        "sighting_count": len(cluster_coords)
                    })

        return calculated_zones

    async def refresh_zones(self, species_id: str):
        # Fetches data, calculates zones, and updates the cache
        try:
            config = self.SPECIES_CONFIG.get(species_id)
            if not config:
                logger.error(f"Invalid species ID: {species_id} not found in SPECIES_CONFIG")
                return

            occurrences = await self.fetch_occurrences(
                scientific_name=config["name"],
                geometry=config["region"]
            )

            if not occurrences:
                return

            try:
                zones = await self.calculate_zones(species_id, occurrences)
                if not zones:
                    return

                self._zone_cache[species_id] = zones

            except Exception as e:
                logger.critical(f"Zone Calculation Crash Prevented for {species_id}: {type(e).__name__}: {str(e)}")
                return

        except asyncio.CancelledError:
            logger.warning(f"Zone refresh for {species_id} was cancelled")
        except Exception as e:
            logger.critical(
                f"Complete Crash Prevention During Zone Refresh for {species_id}: {type(e).__name__}: {str(e)}")

    async def initialize_cache(self):
        logger.info("Starting OBIS cache warmup...")
        tasks = [self.refresh_zones(species_id) for species_id in self.SPECIES_CONFIG.keys()]
        await asyncio.gather(*tasks)
        self._is_ready = True
        logger.info("OBIS cache warmup complete. Service is ready.")

    def get_zones(self, species_id: str) -> Optional[Dict[int, Dict]]:
        if not self._is_ready:
            logger.warning("get_zones called before cache was fully warmed up!")

        return self._zone_cache.get(species_id)


obis_service = OBISService()