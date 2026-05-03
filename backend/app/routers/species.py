from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.species import Species

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