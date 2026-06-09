from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.services.overlap_service import compute_overlap, compute_single_score
from app.services.ais_service import ais_service
from app.services.obis_service import obis_service
from app.services.meteo_service import get_sst
from app.models.species import Species

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/overlap", tags=["Overlap Analysis"])


# Computes threat level for all tracked vessels in a given species monitoring zone for a specified month
@router.get(
    "",
    summary="Overlap-Score berechnen",
    description="Berechnet den Overlap-Score für eine Art und einen Monat. Parameter: species (Pflicht), month (Optional, Default=aktueller Monat). **Rolle: Gast.**",
    responses={
        200: {"description": "Overlap-Ergebnis mit Scores und Zone"},
        400: {"description": "Ungültiger Monat"},
        404: {"description": "Art oder Zone nicht gefunden"}
    }
)
async def get_overlaps(
    species_id: str = Query(..., description="The species ID (e.g., 'thunnus-thynnus')"),
    month: int | None = Query(None, ge=1, le=12, description="Month context (1-12). Defaults to current month."),
    db: AsyncSession = Depends(get_db)
):
    if month is None:
        month = datetime.now().month

    try:
        return await compute_overlap(species_id=species_id, month=month, db=db)
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred during threat matrix evaluation: {str(e)}"
        )


# Computes threat assessment score for a single vessel in a specified species monitoring zone for the current month
@router.get(
    "/{mmsi}",
    summary="Overlap-Score für einzelnes Schiff",
    description="Score eines bestimmten Schiffs gegen eine Art. Parameter: species (Pflicht). **Rolle: Gast.**",
    responses={
        200: {"description": "Einzelner Vessel-Score"},
        404: {"description": "Schiff oder Art nicht gefunden"}
    }
)
async def get_overlap_for_vessel(
    mmsi: int,
    species_id: str = Query(..., description="The species ID (e.g., 'thunnus-thynnus')"),
    db: AsyncSession = Depends(get_db)
):
    vessel = ais_service.get_vessel(mmsi)
    if not vessel:
        raise HTTPException(
            status_code=404, 
            detail=f"Vessel with MMSI {mmsi} not found or out of spatial tracking boundaries."
        )

    month = datetime.now().month

    stmt = select(Species).where(Species.id == species_id, Species.active == True)
    result = await db.execute(stmt)
    species_record = result.scalar_one_or_none()
    if not species_record:
        raise HTTPException(status_code=404, detail="Active target species profile not found")

    zones = obis_service.get_zones(species_id)
    if not zones:
        raise HTTPException(status_code=404, detail="No historical tracking profiles registered for this species")

    zone = zones.get(month)
    if not zone:
        raise HTTPException(status_code=404, detail=f"No zone bounds mapped for operational month context: {month}")

    center = zone.get("center", {})
    c_lat = center.get("lat")
    c_lng = center.get("lng")

    if c_lat is None or c_lng is None:
        raise HTTPException(status_code=500, detail="Zone coordinates are malformed")

    sst = None
    try:
        meteo_data = await get_sst(c_lat, c_lng)
        sst = meteo_data.get("sea_surface_temperature")
    except Exception as e:
        logger.warning(f"Unable to retrieve sea surface temperature for vessel {mmsi} at [{c_lat}, {c_lng}]: {e}")

    evaluation = compute_single_score(vessel, zone, sst, species_record)
    if not evaluation:
        raise HTTPException(status_code=400, detail="Vessel spatial data is invalid for calculations.")

    return evaluation