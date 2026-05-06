import time
import httpx

sst_cache: dict[str, dict] = {}
CACHE_TTL = 60*60*24

#open-meteo fetch function - API call
async def fetch_sst(lat: float, lng: float):
    url = "https://marine-api.open-meteo.com/v1/marine"

    params = {
        "latitude": lat,
        "longitude": lng,
        "hourly": "sea_surface_temperature"
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data=response.json()

    sst = data["hourly"]["sea_surface_temperature"][0]

    return {
        "sea_surface_temperature": sst
    }

async def get_sst(lat: float, lng: float):
    key = f"{round(lat, 1)}_{round(lng, 1)}"

    #check cache
    if key in sst_cache:
        entry = sst_cache[key]
        if time.time() - entry["timestamp"] < CACHE_TTL:
            return entry["data"]
        
    #fetch new data
    data = await fetch_sst(lat, lng)

    sst_cache[key] = {
        "data": data,
        "timestamp": time.time()
    }

    return data