import requests

class OBISService:
    BASE_URL = "https://api.obis.org/v3/occurrence"
    
    # Mediterranean sea for Thunnus thynnus
    MED_POLYGON = "POLYGON((-5 30, 36 30, 36 46, -5 46, -5 30))"

    def fetch_sightings(self, scientific_name: str):
        params = {
            "scientificname": scientific_name,
            "geometry": self.MED_POLYGON,
            "size": 500
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching from OBIS: {e}")
            return []
        