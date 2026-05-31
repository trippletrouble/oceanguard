from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.schemas.favorite import FavoriteSpeciesCreate, FavoriteSpeciesResponse
from app.models.favorite import FavoriteSpecies
from app.models.species import Species

router = APIRouter()

# Species Favorites

@router.get("/species", response_model=list[FavoriteSpeciesResponse])
async def get_favorite_species(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FavoriteSpecies).where(FavoriteSpecies.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/species", status_code=201, response_model=FavoriteSpeciesResponse)
async def add_favorite_species(
    data: FavoriteSpeciesCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    #Check Species
    species = await db.get(Species, data.species_id)
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    
    #Check if already favorited
    existing = await db.execute(
        select(FavoriteSpecies).where(
            FavoriteSpecies.user_id == current_user.id,
            FavoriteSpecies.species_id == data.species_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Species already in favorites")
    
    fav = FavoriteSpecies(user_id=current_user.id, species_id=data.species_id)
    db.add(fav)
    await db.commit()
    await db.refresh(fav)
    return fav

@router.delete("/species/{species_id}", status_code=204)
async def remove_favorite_species(
    species_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FavoriteSpecies).where(
            FavoriteSpecies.user_id == current_user.id,
            FavoriteSpecies.species_id == species_id
        )
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    await db.delete(fav)
    await db.commit()