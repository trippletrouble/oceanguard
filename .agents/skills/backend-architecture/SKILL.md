---
name: backend-architecture
description: Guidelines and patterns for backend architecture in OceanGuard (routers, schemas, services, models, and security rules based on openapi.yaml).
---

# 🏛️ OceanGuard Backend Architecture Guidelines

Dieser Skill beschreibt die Entwurfsmuster, Schichtentrennung und API-Konventionen für das FastAPI-Backend von OceanGuard.

---

## 1. Schichtentrennung (Architecture Layout)
Jedes Feature im Backend ist strikt in die folgenden Schichten unterteilt:
* `app/models/`: SQLAlchemy-Modelle für die physische Datenbankstruktur.
* `app/schemas/`: Pydantic-Modelle zur Validierung, Serialisierung und Einhaltung des API-Vertrags (OpenAPI).
* `app/routers/`: FastAPI-Endpunkte (Verarbeitung von HTTP-Requests, Validierung von Parametern und Berechtigungen).
* `app/services/`: Business-Logik und Anbindung von externen Schnittstellen (OBIS, AISstream, Open-Meteo).

---

## 2. Endpunkte & Routers (`app/routers/`)
* **Konventionen:** Pfade müssen exakt der [openapi.yaml](../../../documentation/openapi.yaml) entsprechen. **Kein** `/api`-Präfix!
* **Authentifizierung:**
  * Öffentliche Endpunkte (Gast): Kein Token erforderlich (z. B. `GET /species/`, `GET /overlap`).
  * Geschützte Endpunkte: Verwende `Depends(get_current_user)` oder `Depends(require_role("admin"))`.
* **Parameter:** Verwende FastAPIs `Query` und `Path` zur Absicherung (z. B. `ge=1, le=12` für Monate). Parameter-Namen müssen identisch mit der OpenAPI sein (z. B. `species_id`).

### Muster-Router (`app/routers/example.py`)
```python
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.species import SpeciesResponse
from app.auth.dependencies import require_role

router = APIRouter(prefix="/example", tags=["Example"])

@router.get(
    "/{id}",
    response_model=SpeciesResponse,
    summary="Details abrufen"
)
async def get_details(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    ...
```

---

## 3. Datenschemata (`app/schemas/`)
* Erben immer von `pydantic.BaseModel` (Pydantic v2).
* **Muster:**
  * `Base`: Gemeinsame Datenfelder.
  * `Create` / `Update` / `Patch`: Spezifische Eingabeschemata (`Patch` hat nur optionale Felder).
  * `Response`: Rückgabe-Datenstruktur mit `from_attributes = True` für ORM-Mapping.

### Muster-Schema (`app/schemas/species.py`)
```python
from pydantic import BaseModel, ConfigDict

class SpeciesBase(BaseModel):
    common_name: str
    scientific_name: str
    region: str
    radius_km: int = 200

class SpeciesCreate(SpeciesBase):
    id: str

class SpeciesResponse(SpeciesBase):
    id: str
    active: bool
    
    model_config = ConfigDict(from_attributes=True)
```

---

## 4. Services & Drittanbieter-APIs (`app/services/`)
* **Singleton/Modul-Muster:** Instanziiere Services als Singletons, um Verbindungen und Caches global zu verwalten.
* **Robustheit:** API-Fehler externer Dienste dürfen das Backend nicht zum Absturz bringen. Nutze `try-except` und `logger.warning`.
* **Caching:** REST-Daten von Open-Meteo und OBIS müssen lokal gecacht werden (z. B. 24h Time-To-Live für Meerestemperatur).
* **Asynchronität:** Externe Requests müssen asynchron mittels `httpx.AsyncClient` erfolgen.

---

## 5. Sicherheits- & Validierungsregeln
1. **Validierung:** Alle Benutzereingaben an den Routen-Schnittstellen validieren.
2. **Datenbank-Modifikation:** Nur authentifizierte Admins dürfen Daten anlegen, verändern oder löschen.
3. **Soft-Delete:** Verwende `active = False` statt echtem SQL-`DELETE`, um die Integrität historischer Berichte zu wahren.
4. **Fehlertoleranz:** Fällt der Temperatur-Dienst aus, verwende einen Standardwert (`T = 0.5`) statt abzubrechen.
