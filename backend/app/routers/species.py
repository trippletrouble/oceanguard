from datetime import datetime
import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.species import Species
from app.models.user import User
from app.services.obis_service import obis_service
from app.auth.dependencies import get_current_user, require_role
from app.schemas.species import SpeciesCreate, SpeciesPatch, SpeciesResponse

router = APIRouter()


# ─────────────────────────────────────────────
# PUBLIC ENDPOINTS (Guest — kein Login nötig)
# ─────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[SpeciesResponse],
    summary="Alle aktiven Fischarten abrufen",
    description="Gibt alle aktiven Arten mit Hypermedia-Links zurück. Unterstützt ETag Caching. **Rolle: Gast (kein Login nötig).**",
    responses={
        200: {"description": "Liste aller aktiven Arten mit Links und Caching-Header"}
    }
)
async def get_all_species(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Gibt alle Fischarten zurück, die als 'active' markiert sind.
    Öffentlich zugänglich (Guest access).
    """
    result = await db.execute(select(Species).where(Species.active == True))
    species_list = result.scalars().all()

    response_data = []
    for s in species_list:
        links = {
            "self": f"/species/{s.id}",
            "migration": f"/species/{s.id}/migration",
            "vessels": f"/vessels",
            "overlap": f"/overlaps?species={s.id}",
            "alerts": f"/alerts?species={s.id}"
        }
        resp = SpeciesResponse.model_validate(s)
        resp.links = links
        response_data.append(resp)

    # 1. Serialize data stably to generate the ETag
    serialized = json.dumps(
        [m.model_dump(by_alias=True, mode="json") for m in response_data],
        sort_keys=True
    )
    etag_value = f'W/"{hashlib.md5(serialized.encode("utf-8")).hexdigest()}"'

    # 2. Validate If-None-Match
    if_none_match = request.headers.get("if-none-match")
    if if_none_match and if_none_match == etag_value:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    # 3. Set Cache headers
    response.headers["ETag"] = etag_value
    response.headers["Cache-Control"] = "public, max-age=86400"

    return response_data


@router.get(
    "/{species_id}/migration",
    response_model=None,
    summary="Migrationszonen abrufen",
    description="Gibt die berechnete Migrationszone für einen Monat zurück. Unterstützt ETag Caching. **Rolle: Gast.**",
    responses={
        200: {"description": "GeoJSON Feature mit Caching-Header"},
        400: {"description": "Ungültiger Monat"},
        404: {"description": "Art nicht gefunden"}
    }
)
async def get_migration_zone(
    species_id: str,
    request: Request,
    response: Response,
    month: int = Query(..., ge=1, le=12, description="Monat (1–12)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Gibt die saisonale Migrationszone(n) einer Art für einen bestimmten Monat zurück.
    Öffentlich zugänglich (Guest access).
    """
    result = await db.execute(select(Species).where(Species.id == species_id))
    species = result.scalar_one_or_none()

    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Species with ID '{species_id}' not found"
        )

    zones_dict = obis_service.get_zones(species_id)
    if zones_dict is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Zone data for '{species_id}' is not yet available. Please try again later."
        )

    month_zones = zones_dict.get(month)
    if not month_zones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No sighting data available for '{species_id}' in month {month}"
        )

    response_data = {
        "species_id": species_id,
        "month": month,
        "zones": [
            {
                "center": zone.get("center"),
                "radius_km": zone.get("radius_km"),
                "sighting_count": zone.get("sighting_count", 0)
            }
            for zone in month_zones
        ]
    }

    # 1. Serialize stably to generate ETag
    serialized = json.dumps(response_data, sort_keys=True)
    etag_value = f'W/"{hashlib.md5(serialized.encode("utf-8")).hexdigest()}"'

    # 2. Validate If-None-Match
    if_none_match = request.headers.get("if-none-match")
    if if_none_match and if_none_match == etag_value:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    # 3. Set Cache headers
    response.headers["ETag"] = etag_value
    response.headers["Cache-Control"] = "public, max-age=86400"

    return response_data


@router.get(
    "/{species_id}",
    response_model=SpeciesResponse,
    summary="Einzelne Fischart abrufen",
    description="Gibt Details einer Art mit Hypermedia-Links zurück. **Rolle: Gast.**",
    responses={
        200: {"description": "Art-Details mit Hypermedia-Links"},
        404: {"description": "Art nicht gefunden"}
    }
)
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

    links = {
        "self": f"/species/{species.id}",
        "migration": f"/species/{species.id}/migration",
        "vessels": f"/vessels",
        "overlap": f"/overlaps?species={species.id}",
        "alerts": f"/alerts?species={species.id}"
    }
    resp = SpeciesResponse.model_validate(species)
    resp.links = links
    return resp


# ─────────────────────────────────────────────
# ADMIN ENDPOINTS (require_role("admin"))
# ─────────────────────────────────────────────

@router.post(
    "/",
    response_model=None,
    status_code=201,
    summary="Neue Fischart anlegen",
    description="Erstellt eine neue Art. **Rolle: Admin.**",
    responses={
        201: {"description": "Art erstellt"},
        409: {"description": "Art existiert bereits"},
        422: {"description": "Validierungsfehler"}
    }
)
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


@router.put(
    "/{species_id}",
    response_model=None,
    summary="Fischart vollständig aktualisieren",
    description="Ersetzt alle Felder einer Art. **Rolle: Admin.**",
    responses={
        200: {"description": "Art aktualisiert"},
        404: {"description": "Art nicht gefunden"},
        422: {"description": "Validierungsfehler"}
    }
)
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


@router.patch(
    "/{species_id}",
    response_model=None,
    summary="Fischart teilweise aktualisieren",
    description="Aktualisiert einzelne Felder. **Rolle: Admin.**",
    responses={
        200: {"description": "Art aktualisiert"},
        404: {"description": "Art nicht gefunden"},
        422: {"description": "Validierungsfehler"}
    }
)
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


@router.delete(
    "/{species_id}",
    status_code=204,
    summary="Fischart deaktivieren (Soft-Delete)",
    description="Setzt active=False. Daten bleiben erhalten. **Rolle: Admin.**",
    responses={
        204: {"description": "Deaktiviert"},
        404: {"description": "Art nicht gefunden"}
    }
)
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