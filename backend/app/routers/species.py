from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.species import Species
from app.models.user import User
from app.schemas.species import SpeciesCreate, SpeciesPatch
from app.services.obis_service import obis_service

router = APIRouter()

# ─────────────────────────────────────────────
# PUBLIC ENDPOINTS (Guest — kein Login nötig)
# ─────────────────────────────────────────────


@router.get(
    "/",
    response_model=None,
    summary="Alle aktiven Fischarten abrufen",
    description="Gibt alle aktiven Arten mit relativen HATEOAS-Links zurück. **Rolle: Gast.**",
)
async def get_all_species(db: AsyncSession = Depends(get_db)):
    """
    Gibt alle Fischarten zurück, die als 'active' markiert sind.
    Inkludiert HATEOAS Links für jede Art, um das Frontend-Rendering zu versorgen.
    """
    result = await db.execute(select(Species).where(Species.active == True))
    species_list = result.scalars().all()

    current_month = datetime.now().month
    formatted_list = []

    for species in species_list:
        species_dict = {
            "id": species.id,
            "common_name": species.common_name,
            "scientific_name": species.scientific_name,
            "region": species.region,
            "description": species.description,
            "notes": species.notes,
            "radius_km": species.radius_km,
            "temp_min": species.temp_min,
            "temp_mid": species.temp_mid,
            "temp_max": species.temp_max,
            "temp_range": species.temp_range,
            "active": species.active,
            "created_at": species.created_at,
            "updated_at": species.updated_at,
            "links": {
                "self": {"href": f"/species/{species.id}", "method": "GET"},
                "migration": {
                    "href": f"/species/{species.id}/migration?month={current_month}",
                    "method": "GET",
                },
                "vessels": {"href": f"/vessels/species/{species.id}", "method": "GET"},
                "overlap": {
                    "href": f"/overlap?species_id={species.id}",
                    "method": "GET",
                },
                "alerts": {"href": f"/alerts?species={species.id}", "method": "GET"},
            },
        }
        formatted_list.append(species_dict)

    return formatted_list


@router.get(
    "/{species_id}/migration",
    response_model=None,
    summary="Migrationszonen abrufen",
)
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
            detail=f"Species with ID '{species_id}' not found",
        )

    zones_dict = obis_service.get_zones(species_id)
    if zones_dict is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Zone data for '{species_id}' is not yet available.",
        )

    month_zones = zones_dict.get(month)
    if not month_zones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No sighting data available for '{species_id}' in month {month}",
        )

    return {
        "species_id": species_id,
        "month": month,
        "zones": [
            {
                "center": zone.get("center"),
                "radius_km": zone.get("radius_km"),
                "sighting_count": zone.get("sighting_count", 0),
            }
            for zone in month_zones
        ],
    }


@router.get(
    "/{species_id}",
    response_model=None,
    summary="Einzelne Fischart abrufen",
)
async def get_species_by_id(species_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Species).where(Species.id == species_id))
    species = result.scalar_one_or_none()

    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Species with ID {species_id} not found",
        )

    current_month = datetime.now().month

    return {
        "id": species.id,
        "common_name": species.common_name,
        "scientific_name": species.scientific_name,
        "region": species.region,
        "active": species.active,
        "links": {
            "self": {"href": f"/species/{species.id}", "method": "GET"},
            "migration": {
                "href": f"/species/{species.id}/migration?month={current_month}",
                "method": "GET",
            },
            "vessels": {"href": f"/vessels/species/{species.id}", "method": "GET"},
            "overlap": {"href": f"/overlap?species_id={species.id}", "method": "GET"},
        },
    }


# ─────────────────────────────────────────────
# ADMIN ENDPOINTS (require_role("admin"))
# ─────────────────────────────────────────────


@router.post("/")
async def create_species(
    data: SpeciesCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    existing = await db.get(Species, data.id)
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Species with ID '{data.id}' already exists"
        )

    species = Species(**data.model_dump())
    db.add(species)
    await db.commit()
    await db.refresh(species)
    return species


@router.put("/{species_id}")
async def update_species(
    species_id: str,
    data: SpeciesCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    species = await db.get(Species, species_id)
    if not species:
        raise HTTPException(
            status_code=404, detail=f"Species with ID '{species_id}' not found"
        )

    for key, value in data.model_dump().items():
        setattr(species, key, value)

    species.updated_at = datetime.now()
    await db.commit()
    await db.refresh(species)
    return species


@router.patch("/{species_id}")
async def patch_species(
    species_id: str,
    data: SpeciesPatch,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    species = await db.get(Species, species_id)
    if not species:
        raise HTTPException(
            status_code=404, detail=f"Species with ID '{species_id}' not found"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(species, key, value)

    species.updated_at = datetime.now()
    await db.commit()
    await db.refresh(species)
    return species


@router.delete("/{species_id}", status_code=204)
async def delete_species(
    species_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    species = await db.get(Species, species_id)
    if not species:
        raise HTTPException(
            status_code=404, detail=f"Species with ID '{species_id}' not found"
        )

    species.active = False
    species.updated_at = datetime.now()
    await db.commit()
