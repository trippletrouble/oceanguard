import httpx
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class OBISService:
    BASE_URL = "https://api.obis.org/v3/occurrence"

    DEFAULT_GEOMETRY = "POLYGON((-5 30, 36 30, 36 46, -5 46, -5 30))"

    async def fetch_occurrences(
            self,
            scientific_name: str,
            start_date: Optional[str] = None,
            end_date: Optional[str] = None,
            geometry: Optional[str] = None,
            size: int = 500
    ) -> List[Dict]:
        # Fetches and parses sighting data from OBIS API
        params = {
            "scientificname": scientific_name,
            "startdate": start_date,
            "enddate": end_date,
            "geometry": geometry or self.DEFAULT_GEOMETRY,
            "size": size
        }

        params = {k: v for k, v in params.items() if v is not None}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.BASE_URL, params=params)

                response.raise_for_status()

                data = response.json()
                results = data.get("results", [])

                parsed_occurrences = []
                for item in results:
                    lat = item.get("decimalLatitude")
                    lng = item.get("decimalLongitude")
                    date = item.get("eventDate")

                    if lat is not None and lng is not None:
                        parsed_occurrences.append({
                            "decimalLatitude": lat,
                            "decimalLongitude": lng,
                            "eventDate": date
                        })

                logger.info(f"Successfully fetched {len(parsed_occurrences)} records for {scientific_name}")
                return parsed_occurrences

        except httpx.TimeoutException:
            logger.error(f"OBIS API request timed out for {scientific_name}")
            return []
        except httpx.HTTPStatusError as e:
            logger.error(f"OBIS API returned error {e.response.status_code}: {e.response.text}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in OBIS service: {str(e)}")
            return []

obis_service = OBISService()
