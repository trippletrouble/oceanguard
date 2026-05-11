from fastapi import APIRouter, HTTPException, Query

from app.services.ais_service import ais_service
from app.schemas.vessel import VesselResponse, VesselListResponse

router = APIRouter()

@router.post("/switch-species/{species_id}")
async def switch_species(species_id: str):
    await ais_service.restart_stream(species_id)
    
    return {
        "message": f"Switching AIS stream to {species_id}"
    }

@router.get("", response_model=VesselListResponse)
async def get_vessels():
    vessels = ais_service.get_all_vessels()
    return {
        "vessels": vessels,
        "count": len(vessels)
    }

@router.get("/{mmsi}", response_model=VesselResponse)
async def get_vessel(mmsi: int):
    vessel = ais_service.get_vessel(mmsi)

    if not vessel:
        raise HTTPException(
            status_code=404,
            detail="Vessel not found"
        )
    
    return vessel
