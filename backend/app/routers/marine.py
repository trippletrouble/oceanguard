from fastapi import APIRouter, Query
from app.services.meteo_service import get_sst
from app.schemas.marine import MarineResponse

router = APIRouter()

@router.get(
    "",
    response_model=MarineResponse,
    summary="Marine-Bedingungen abrufen",
    description="SST und Wellenhöhe für eine Koordinate. Parameter: lat, lng. **Rolle: Gast.**",
    responses={
        200: {"description": "Marine-Daten"},
        400: {"description": "Fehlende Koordinaten"}
    }
)
async def marine_conditions(
    lat: float = Query(...),
    lng: float = Query(...)
):
    
    data = await get_sst(lat, lng)

    return {
        "lat": lat,
        "lng": lng,
        **data
    }
