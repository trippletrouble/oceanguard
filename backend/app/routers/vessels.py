from fastapi import APIRouter, HTTPException, Query

from app.services.ais_service import ais_service
from app.services.obis_service import obis_service
from app.schemas.vessel import VesselResponse, VesselListResponse

from datetime import datetime

router = APIRouter()

@router.get(
    "",
    response_model=VesselListResponse,
    summary="Schiffe auflisten",
    description="Optional mit bbox-Filter (lat1,lng1,lat2,lng2). **Rolle: Gast.**",
    responses={
        200: {"description": "Schiffsliste"},
        400: {"description": "Ungültige BBox"}
    }
)
async def get_vessels(
    bbox: str | None = Query(None, description="BBox boundaries: min_lat,min_lng,max_lat,max_lng")
):
    vessels = ais_service.get_all_vessels()
    
    if bbox:
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            if len(parts) != 4:
                raise ValueError()
            min_lat, min_lng, max_lat, max_lng = parts
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid bbox format. Use min_lat,min_lng,max_lat,max_lng"
            )
            
        vessels = [
            v for v in vessels
            if v.get("lat") is not None and v.get("lng") is not None and
            min_lat <= v["lat"] <= max_lat and min_lng <= v["lng"] <= max_lng
        ]

    return {
        "vessels": vessels,
        "count": len(vessels)
    }

@router.get(
    "/species/{species_id}",
    summary="Schiffe in Verbreitungszone abrufen",
    description="Gibt alle aktuell getrackten Schiffe innerhalb der Verbreitungszone einer Fischart zurück. **Rolle: Gast.**",
    responses={
        200: {"description": "Liste der Schiffe"},
        404: {"description": "Fischart nicht gefunden"}
    }
)
async def get_species_vessels(species_id: str):
    
    if species_id not in obis_service.SPECIES_CONFIG:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown species: {species_id}"
        )

    vessels = await ais_service.get_vessels_for_species(species_id)

    return {
        "count": len(vessels),
        "vessels": vessels
    }

@router.get(
    "/status",
    summary="AIS-Status abrufen",
    description="Gibt den aktuellen Verbindungsstatus des AIS-Streams zurück. **Rolle: Gast.**",
    responses={
        200: {"description": "AIS-Verbindungsstatus"}
    }
)
async def ais_status():
    return {
        "connected": ais_service.ais_connected,
        "cached_vessels": len(ais_service.vessel_cache),
        "last_message": ais_service.last_ais_message_at
    }

@router.get(
    "/{mmsi}",
    response_model=VesselResponse,
    summary="Einzelnes Schiff abrufen",
    description="Suche nach MMSI-Nummer. **Rolle: Gast.**",
    responses={
        200: {"description": "Schiffsdaten"},
        404: {"description": "Schiff nicht gefunden"}
    }
)
async def get_vessel(mmsi: int):
    vessel = ais_service.get_vessel(mmsi)

    if not vessel:
        raise HTTPException(
            status_code=404,
            detail="Vessel not found"
        )
    
    return vessel

# @router.get("/species/{species_id}/debug")