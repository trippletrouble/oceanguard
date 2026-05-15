from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.species import Species
from app.models.user import User
from app.services.obis_service import obis_service
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=None, summary="Liste aller aktiven Fischarten")
async def get_all_species(db: AsyncSession = Depends(get_db)):
    """
    Gibt alle Fischarten zurück, die in der Datenbank als 'active' markiert sind.
    Dieser Endpoint ist öffentlich (Guest access).
    """
    result = await db.execute(select(Species).where(Species.active == True))
    species_list = result.scalars().all()
    return species_list


@router.get("/{species_id}/migration", response_model=None, summary="Saisonale Verbreitungszone einer Art")
async def get_migration_zone(
    species_id: str,
    month: int = Query(..., ge=1, le=12, description="Monat (1–12)"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Species).where(Species.id == species_id))
    species = result.scalar_one_or_none()

    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Species with ID '{species_id}' not found"
        )

    zones = obis_service.get_zones(species_id)

    if zones is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Zone data for '{species_id}' is not yet available. Please try again later."
        )

    zone = zones.get(month)

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No sighting data available for '{species_id}' in month {month}"
        )

    return {
        "species_id": species_id,
        "month": month,
        "center": zone["center"],
        "radius_km": zone["radius_km"],
        "sighting_count": zone["sighting_count"]
    }


@router.get("/{species_id}", response_model=None, summary="Details einer bestimmten Fischart")
async def get_species_by_id(species_id: str, db: AsyncSession = Depends(get_db)):
    """
    Gibt die detaillierten Informationen zu einer Fischart anhand der ID zurück.
    """
    result = await db.execute(select(Species).where(Species.id == species_id))
    species = result.scalar_one_or_none()
    
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Species with ID {species_id} not found"
        )
    
    return species