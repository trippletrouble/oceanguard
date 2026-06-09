from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.species import Species
from app.auth.dependencies import require_role
from app.schemas.auth import UserResponse
from app.schemas.admin import RoleUpdate

router = APIRouter()


# ─────────────────────────────────────────────
# USER MANAGEMENT
# ─────────────────────────────────────────────

@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="Alle User auflisten",
    description="**Rolle: Admin.**",
    responses={
        200: {"description": "User-Liste"}
    }
)
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Gibt eine Liste aller registrierten User zurück.
    Nur für Admins.
    """
    result = await db.execute(select(User))
    return result.scalars().all()


@router.delete(
    "/users/{user_id}",
    status_code=204,
    summary="User löschen",
    description="Admin kann sich nicht selbst löschen. **Rolle: Admin.**",
    responses={
        204: {"description": "User gelöscht"},
        403: {"description": "Selbstlöschung nicht erlaubt"},
        404: {"description": "User nicht gefunden"}
    }
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Löscht einen User aus der Datenbank.
    Nur für Admins.

    - **403** wenn der Admin versucht sich selbst zu löschen
    - **404** wenn der User nicht existiert
    """
    if admin.id == user_id:
        raise HTTPException(status_code=403, detail="Admin cannot delete themselves")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

    await db.delete(user)
    await db.commit()


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="User-Rolle ändern",
    description="Erlaubte Rollen: guest, user, admin. **Rolle: Admin.**",
    responses={
        200: {"description": "Rolle geändert"},
        400: {"description": "Ungültige Rolle"},
        404: {"description": "User nicht gefunden"}
    }
)
async def change_role(
    user_id: int,
    body: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Ändert die Rolle eines Users. Mögliche Rollen: guest | user | admin.
    Nur für Admins.

    Beispiel: Neuer User bekommt standardmäßig 'guest' — Admin setzt ihn auf 'user'
    damit er Overlap-Daten und Vessel-Daten sehen kann.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

    user.role = body.role
    await db.commit()
    await db.refresh(user)
    return user


# ─────────────────────────────────────────────
# SYSTEM STATUS
# ─────────────────────────────────────────────

@router.get(
    "/system",
    summary="Systemstatus abrufen",
    description="Zeigt User-Anzahl, aktive Schiffe, gecachte Zonen, AIS-Status und Uptime. **Rolle: Admin.**",
    responses={
        200: {"description": "Systemstatus"}
    }
)
async def system_status(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    """
    Gibt einen Live-Überblick über den aktuellen System-Status zurück.
    Nur für Admins.

    - **user_count** — Anzahl registrierter User in der DB
    - **species_count** — Anzahl aktiver Fischarten
    - **active_vessels** — Aktuell gecachte Schiffe aus dem AIS-Stream
    - **cached_zones** — Anzahl gecachter Migrationszonen (OBIS)
    - **ais_connected** — Ist der AIS-WebSocket gerade verbunden?
    - **last_ais_message_at** — Zeitstempel der letzten AIS-Nachricht
    - **uptime_seconds** — Wie lange läuft der Server schon?
    """
    from app.main import app_start_time
    from app.services.obis_service import obis_service

    try:
        from app.services.ais_service import ais_service
        vessel_cache = ais_service.vessel_cache
        ais_connected = ais_service.ais_connected
        last_ais_message_at = ais_service.last_ais_message_at
    except Exception:
        vessel_cache = {}
        ais_connected = False
        last_ais_message_at = None

    user_count = (await db.execute(select(func.count(User.id)))).scalar()
    species_count = (await db.execute(
        select(func.count(Species.id)).where(Species.active == True)
    )).scalar()
    cached_zones = sum(
        len(obis_service.get_zones(species_id) or {})
        for species_id in obis_service.SPECIES_CONFIG.keys()
)
    return {
        "user_count": user_count,
        "species_count": species_count,
        "active_vessels": len(vessel_cache),
        "cached_zones": cached_zones,
        "ais_connected": ais_connected,
        "last_ais_message_at": last_ais_message_at,
        "uptime_seconds": int((datetime.now() - app_start_time).total_seconds())
    }