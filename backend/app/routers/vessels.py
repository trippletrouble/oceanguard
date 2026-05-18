from fastapi import APIRouter, HTTPException, Query

from app.services.ais_service import ais_service
from app.services.obis_service import obis_service
from app.schemas.vessel import VesselResponse, VesselListResponse

from datetime import datetime

router = APIRouter()

@router.get("", response_model=VesselListResponse)
async def get_vessels():
    vessels = ais_service.get_all_vessels()
    return {
        "vessels": vessels,
        "count": len(vessels)
    }

@router.get("/species/{species_id}")
async def get_species_vessels(species_id: str):
    
    if species_id not in obis_service.SPECIES_CONFIG:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown species: {species_id}"
        )
    
    vessels = ais_service.get_vessels_for_species(species_id)
    
    return {
        "count": len(vessels),
        "vessels": vessels
    }

@router.get("/status")
async def ais_status():
    return {
        "connected": ais_service.ais_connected,
        "cached_vessels": len(ais_service.vessel_cache),
        "last_message": ais_service.last_ais_message_at
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

# @router.get("/species/{species_id}/debug")
# async def debug_species(species_id: str):

#     zones = obis_service.get_zones(species_id)

#     if not zones:
#         return {
#             "species_id": species_id,
#             "error": "Unknown species"
#         }

#     month = datetime.now().month
#     zone = zones.get(month)
#     if not zone:
#         return {
#             "species_id": species_id,
#             "error": f"No zone data for month {month}"
#         }
    
#     center = zone.get("center")

#     vessels = ais_service.get_vessels_for_species(species_id)
    
#     return {
#         "species_id": species_id,
#         "vessel_count": len(vessels),
#         "zone": zone,
#         "center": center,
#         "vessels": vessels
#     }