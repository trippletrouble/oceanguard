from fastapi import APIRouter, HTTPException, Query
from app.services.meteo_service import get_sst
from app.schemas.marine import MarineResponse

router = APIRouter()

@router.get("", response_model=MarineResponse)
async def marine_conditions(
    lat: float = Query(...),
    lng: float = Query(...)
):
    # if lat is None or lng is None:
    #     raise HTTPException(status_code=400, detail="lat (latitude) and lng (longitude) is required")
    
    data = await get_sst(lat, lng)

    return {
        "lat": lat,
        "lng": lng,
        **data
    }
