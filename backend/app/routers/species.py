from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.species import Species
from app.models.user import User
from app.services.obis_service import obis_service
from app.auth.dependencies import get_current_user, require_role
from app.schemas.species import SpeciesCreate, SpeciesPatch

router = APIRouter()


# ─────────────────────────────────────────────
# PUBLIC ENDPOINTS (Guest — kein Login nötig)
# ─────────────────────────────────────────────

@router.get("/", response_model=None, summary="Liste aller aktiven Fischarten")
async def get_all_species(db: AsyncSession = Depends(get_db)):
    """
    Gibt alle Fischarten zurück, die als 'active' markiert sind.
    Öffentlich zugänglich (Guest access).
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
    """
    Gibt die saisonale Migrationszone einer Art für einen bestimmten Monat zurück.
    Öffentlich zugänglich (Guest access).
    """
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
    Gibt die Details einer Fischart anhand der ID zurück.
    Öffentlich zugänglich (Guest access).
    """
    result = await db.execute(select(Species).where(Species.id == species_id))
    species = result.scalar_one_or_none()

    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Species with ID {species_id} not found"
        )

    return species


# ─────────────────────────────────────────────
# ADMIN ENDPOINTS (require_role("admin"))
# ─────────────────────────────────────────────

@router.post("/", response_model=None, status_code=201, summary="Neue Fischart anlegen (Admin)")
async def create_species(
    data: SpeciesCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Legt eine neue Fischart an. Die ID (Slug) wird vom Admin selbst gesetzt,
    z.B. 'thunnus-thynnus'. Nur für Admins.

    - **409** wenn die ID bereits existiert
    - **422** wenn temp_min >= temp_max
    """
    # Existiert die ID schon?
    existing = await db.get(Species, data.id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Species with ID '{data.id}' already exists"
        )

    # Temperatur-Logik prüfen
    if data.temp_min is not None and data.temp_max is not None:
        if data.temp_min >= data.temp_max:
            raise HTTPException(
                status_code=422,
                detail="temp_min must be less than temp_max"
            )

    species = Species(**data.model_dump())
    db.add(species)
    await db.commit()
    await db.refresh(species)
    return species


@router.put("/{species_id}", response_model=None, summary="Fischart vollständig ersetzen (Admin)")
async def update_species(
    species_id: str,
    data: SpeciesCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Ersetzt alle Felder einer Fischart komplett (Full Update).
    Nur für Admins. Gibt 404 zurück wenn die Art nicht existiert.
    """
    species = await db.get(Species, species_id)
    if not species:
        raise HTTPException(status_code=404, detail=f"Species with ID '{species_id}' not found")

    # Alle Felder aus dem Request überschreiben
    for key, value in data.model_dump().items():
        setattr(species, key, value)

    species.updated_at = datetime.now()
    await db.commit()
    await db.refresh(species)
    return species


@router.patch("/{species_id}", response_model=None, summary="Fischart teilweise aktualisieren (Admin)")
async def patch_species(
    species_id: str,
    data: SpeciesPatch,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Aktualisiert nur die Felder die im Request-Body mitgegeben werden (Partial Update).
    Felder die nicht mitgegeben werden bleiben unverändert.
    Nur für Admins.

    Beispiel: Nur temp_mid ändern ohne alle anderen Felder angeben zu müssen.
    """
    species = await db.get(Species, species_id)
    if not species:
        raise HTTPException(status_code=404, detail=f"Species with ID '{species_id}' not found")

    # exclude_unset=True → nur Felder die wirklich im Request stehen werden gesetzt
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(species, key, value)

    species.updated_at = datetime.now()
    await db.commit()
    await db.refresh(species)
    return species


@router.delete("/{species_id}", status_code=204, summary="Fischart deaktivieren (Admin — Soft Delete)")
async def delete_species(
    species_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Deaktiviert eine Fischart (Soft Delete) — die Art bleibt in der Datenbank,
    wird aber auf active=False gesetzt und erscheint nicht mehr in der öffentlichen Liste.

    Warum Soft Delete? Damit historische Reports die auf diese Art verweisen
    nicht kaputt gehen.

    Nur für Admins. Gibt 404 zurück wenn die Art nicht existiert.
    """
    species = await db.get(Species, species_id)
    if not species:
        raise HTTPException(status_code=404, detail=f"Species with ID '{species_id}' not found")

    # Soft Delete — NICHT aus der DB löschen!
    species.active = False
    species.updated_at = datetime.now()
    await db.commit()
    # Kein return bei 204