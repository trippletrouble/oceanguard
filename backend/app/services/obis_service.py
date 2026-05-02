import httpx
import logging
from typing import List, Dict, Optional

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

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
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

                return parsed_occurrences

        except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
            logger.error(f"OBIS API Error for {scientific_name}: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in OBIS service: {str(e)}")
            return []

obis_service = OBISService()