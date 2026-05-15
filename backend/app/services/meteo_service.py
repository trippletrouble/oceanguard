import time
import httpx
from datetime import datetime, timezone
from fastapi import HTTPException

sst_cache: dict[str, dict] = {}
CACHE_TTL = 60*60*24

#open-meteo fetch function - API call
async def fetch_sst(lat: float, lng: float):
    url = "https://marine-api.open-meteo.com/v1/marine"

    params = {
        "latitude": lat,
        "longitude": lng,
        "hourly": "sea_surface_temperature",
        "timezone": "GMT"
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data=response.json()

    times = data["hourly"]["time"]
    current_hour = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")

    try:
        index = times.index(current_hour)
    except ValueError:
        index = 0

    sst = data["hourly"]["sea_surface_temperature"][index]

    if sst is None:
        raise HTTPException(
            status_code=404,
            detail="No marine data available for these coordinates."
        )

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