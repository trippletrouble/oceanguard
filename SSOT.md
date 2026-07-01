> **KI-Kontext-Dokument** | Stand: 30.06.2026 (Update: Projekt abgeschlossen & verifiziert) | Immer als erstes hochladen!
 
---
 
## 🧭 WAS IST DIESES DOKUMENT?
 
Dieses Dokument ist die **einzige Wahrheitsquelle (Single Source of Truth)** für das OceanGuard-Projekt.
Wenn du mit einer KI arbeitest, lade **nur diese Datei** hoch — sie enthält alles, was die KI braucht.
Nach jedem Sprint-Abschluss oder größeren Änderungen **aktualisieren**.
 
---
 
## 1. PROJEKTÜBERSICHT
 
### Was ist OceanGuard?
Eine Web-Applikation, die in Echtzeit zeigt, ob Fischereifahrzeuge in Gebieten aktiver Fisch-Migration operieren.
Die App kombiniert drei externe REST-Dienste (OBIS, AISstream, Open-Meteo) und bietet durch einen eigenen
„Overlap-Score" einen klaren Mehrwert gegenüber den Einzeldaten.
 
### Kernfrage der App
> „Fahren gerade Fischereifahrzeuge genau dort, wo Fische saisonal wandern — und wie kritisch ist das?"
 
### Akademischer Kontext
- **Modul:** REST-basierte Web Services (Studienarbeit)
- **Gruppe:** 3 Personen (Backend-only)
- **Anforderungen:**
  - Eigener REST Web Service nach REST-Prinzipien
  - Mindestens 2 externe REST-Dienste anbinden
  - Eigener Mehrwert → Overlap-Score
  - Client (Frontend) visualisiert den eigenen Web Service
  - Auth: Login, Logout, Registrierung, Admin-Bereich (Pflicht)
 
---
 
## 2. TEAM & VERANTWORTLICHKEITEN
 
| Person     | Sprint 1                                                                        | Sprint 2                                                         | Sprint 3                                                         |
| ---------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Naren**  | Auth (Firebase), Species GET, DB-Setup, Models, Schemas                         | Species CRUD (Admin), Admin-Router, alle Schemas                 | OpenAPI-Doku, Auth Hardening, Integration-Tests                  |
| **Marina** | OBIS-Service, Zone-Berechnung, OBIS-Cache, Migration-Endpoint, Haversine        | Overlap-Service, Overlap-Router, Alerts-Router                   | Overlap Unit-Tests, OBIS Error-Handling, Integration-Tests       |
| **Fadhil** | AIS-Service, Vessel-Cache, Vessels-Router, Open-Meteo, SST-Cache, Marine-Router | Favorites-Router, Reports-Router, AIS-Hardening, Meteo-Cache TTL | Integration-Tests, AIS-Stabilität, Meteo-Hardening, Error-Format |
 
---
 
## 3. TECH-STACK (FINAL)
 
### Backend
| Was | Technologie | Version |
|-----|-------------|---------|
| Sprache | Python | 3.x |
| Framework | FastAPI | 0.135.3 |
| Datenbank | SQLite (`oceanguard.db`) | via aiosqlite 0.22.1 |
| ORM | SQLAlchemy async | 2.0.49 |
| Auth | Firebase Admin SDK | Firebase verwaltet Tokens |
| Validation | Pydantic + pydantic-settings | 2.13.1 (vollständig auf v2 `ConfigDict` migriert) |
| Server | Uvicorn | 0.44.0 |
| HTTP Client | httpx (async) | 0.28.1 |
| WebSocket | websockets-Library | für AISstream |
 
### Frontend
| Was | Technologie |
|-----|-------------|
| Framework | React + TypeScript |
| Build Tool | Vite |
| Dev Port | http://localhost:5173 |
| Karten | Leaflet.js |
 
### Auth-Architektur (Firebase — WICHTIG)
- **Firebase Auth** verwaltet Passwörter und gibt ID-Tokens aus.
- Backend **verifiziert** Firebase-Tokens via `firebase-admin` SDK.
- Backend synct User in eigener SQLite-DB beim ersten Login.
- `POST /api/auth/sync` — synct Firebase-User in lokale DB.
- `POST /api/auth/login` — Dummy-Endpoint für Swagger.
 
---
 
## 4. PROJEKTSTRUKTUR
 
```
oceanguard/
├── .agents/                    # KI-Agent Richtlinien & Skills (Lokal über Symlink)
│   ├── AGENTS.md               # Globale Verhaltensregeln & Setup-Guide
│   ├── design_plan.md          # Styling & UI-Richtlinien
│   └── skills/                 # Bedarfsgesteuerte Anweisungen
│       ├── backend-architecture/
│       │   └── SKILL.md        # FastAPI Code-Schablonen (Router, Schemas, Rules)
│       ├── backend-testing/
│       │   └── SKILL.md        # Pytest & Mocking Guidelines
│       └── cocoindex-workflow/
│           └── SKILL.md        # Codebase-Suche & Ponytail-Integration
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── requirements.txt
│   ├── oceanguard.db
│   └── app/
│       ├── main.py                   # FastAPI App, CORS, Router-Registrierung, Lifespan
│       ├── config.py                 # Settings via pydantic-settings (Pydantic v2 ✅)
│       ├── database.py               # AsyncEngine, Session, Base, init_db(), get_db()
│       ├── auth/
│       │   ├── firebase.py           # Firebase Admin SDK Init + Token-Verifikation
│       │   └── dependencies.py       # get_current_user(), require_role() — DI Guards
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py               ✅
│       │   ├── species.py            ✅
│       │   ├── favorite.py           ✅
│       │   └── report.py             ✅
│       ├── schemas/
│       │   ├── auth.py               ✅ SyncRequest, UserResponse (Pydantic v2 ✅)
│       │   ├── species.py            ✅ SpeciesCreate, SpeciesUpdate, SpeciesPatch, SpeciesResponse (Pydantic v2 ✅)
│       │   ├── vessel.py             ✅ VesselResponse, VesselListResponse
│       │   ├── overlap.py            ✅ OverlapQuery, VesselScore, OverlapResponse
│       │   ├── favorite.py           ✅ FavoriteSpeciesCreate/Response, FavoriteRegionCreate/Response (Pydantic v2 ✅)
│       │   └── report.py             ✅ ReportCreate, ReportResponse, ReportCompare (Pydantic v2 ✅)
│       ├── routers/
│       │   ├── auth.py               ✅ /api/auth/sync + /api/auth/login
│       │   ├── species.py            ✅ GET | POST/PUT/PATCH/DELETE (CRUD Admin)
│       │   ├── vessels.py            ✅ GET /vessels (BBox Filter ✅) | GET /{mmsi}
│       │   ├── overlap.py            ✅ GET /overlap (Service Reuse ✅) | GET /overlap/{mmsi}
│       │   ├── marine.py             ✅ GET /marine-conditions
│       │   ├── alerts.py             ✅ GET /alerts
│       │   ├── favorites.py          ✅ /favorites/species | /favorites/regions (ORM-Fix ✅)
│       │   ├── reports.py            ✅ GET/POST/DELETE /reports | GET /reports/compare
│       │   └── admin.py              ✅ GET /admin/users | DELETE /admin/users | PATCH /admin/users/{id}/role | GET /admin/system
│       ├── services/
│       │   ├── ais_service.py        ✅ AISstream Connection, Vessel caching & bounding box checks
│       │   ├── obis_service.py       ✅ OBIS Occurrence fetching, DBSCAN clustering, land filtering
│       │   ├── meteo_service.py      ✅ Open-Meteo SST marine querying & 24h caching
│       │   └── overlap_service.py    ✅ Overlap calculation & multi-zone evaluation logic
│       ├── utils/
│       │   └── haversine.py          ✅ Distanz-Berechnungs-Helper
│       └── data/
│           └── species_seed.json     ✅ Validierte biologische Parameter (Seed-Daten)
├── frontend/
│   └── src/
│       ├── App.tsx
│       └── main.tsx
└── startScript.sh
```
 
---
 
## 5. DATENMODELL (SQLite — FINAL)
 
### Tabelle: `users`
```sql
id           INTEGER PRIMARY KEY AUTOINCREMENT
email        TEXT UNIQUE NOT NULL
name         TEXT NOT NULL
firebase_uid TEXT UNIQUE NOT NULL
role         TEXT DEFAULT 'user'   -- 'guest' | 'user' | 'admin'
created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
 
### Tabelle: `species`
```sql
id              TEXT PRIMARY KEY    -- Slug z.B. "thunnus-thynnus"
common_name     TEXT NOT NULL
scientific_name TEXT NOT NULL
region          TEXT NOT NULL
temp_min        REAL
temp_max        REAL
temp_mid        REAL                -- T_mitte für Overlap-Score
temp_range      REAL                -- R für Overlap-Score
radius_km       INTEGER DEFAULT 200
active          BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
 
### Tabelle: `favorite_species`
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT
user_id    INTEGER FK → users.id ON DELETE CASCADE
species_id TEXT NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(user_id, species_id)
```
 
### Tabelle: `favorite_regions`
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT
user_id    INTEGER FK → users.id ON DELETE CASCADE
name       TEXT NOT NULL
bbox       TEXT NOT NULL    -- JSON: [lat1, lng1, lat2, lng2]
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
 
### Tabelle: `reports`
```sql
id           INTEGER PRIMARY KEY AUTOINCREMENT
user_id      INTEGER FK → users.id ON DELETE CASCADE
species_id   TEXT NOT NULL
bbox         TEXT NOT NULL
month        INTEGER NOT NULL
snapshot     TEXT NOT NULL    -- JSON: vollständiger OverlapResponse
vessel_count INTEGER
avg_score    REAL
created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
 
---
 
## 6. AUTH-FLOW (Firebase)
 
```
1. User registriert sich im Frontend via Firebase SDK
2. Firebase gibt ID-Token zurück (~1h gültig)
3. Frontend → POST /api/auth/sync  { Authorization: "Bearer <firebase_token>" }
4. Backend verifiziert Token via firebase_admin.auth.verify_id_token()
5. Backend erstellt/updated User in SQLite
6. Alle weiteren Requests: Authorization: "Bearer <firebase_token>"
7. Backend-DI: get_current_user() verifiziert + lädt User aus DB
```
 
### DI-Guards
```python
async def get_current_user(token, db) -> User   # 401 wenn ungültig
def require_role(required_role: str) -> Callable # 403 wenn Rolle unzureichend
# Hierarchie: guest < user < admin
```
 
### Zugriffsmatrix
| Endpoint-Gruppe | Guest | User | Admin |
|----------------|-------|------|-------|
| GET /api/species (Liste + Detail) | ✅ | ✅ | ✅ |
| POST/PUT/PATCH/DELETE /api/species | ❌ | ❌ | ✅ |
| GET /api/species/{id}/migration | ❌ | ✅ | ✅ |
| GET /api/vessels | ❌ | ✅ | ✅ |
| GET /api/overlap | ❌ | ✅ | ✅ |
| GET /api/marine-conditions | ❌ | ✅ | ✅ |
| GET /api/alerts | ❌ | ✅ | ✅ |
| /api/favorites/* | ❌ | ✅ | ✅ |
| /api/reports/* | ❌ | ✅ | ✅ |
| /api/admin/* | ❌ | ❌ | ✅ |
 
---
 
## 7. ALLE API-ENDPOINTS
 
### Auth
| Method | URL | Auth | Status-Codes |
|--------|-----|------|-------------|
| POST | `/api/auth/sync` | Firebase Token | 200, 201, 401 |
| POST | `/api/auth/login` | – | 200 (Swagger-Dummy) |
 
### Species
| Method | URL | Auth | Status-Codes |
|--------|-----|------|-------------|
| GET | `/api/species` | Guest | 200 |
| GET | `/api/species/{id}` | Guest | 200, 404 |
| POST | `/api/species` | Admin | 201, 409, 422 |
| PUT | `/api/species/{id}` | Admin | 200, 404, 422 |
| PATCH | `/api/species/{id}` | Admin | 200, 404, 422 |
| DELETE | `/api/species/{id}` | Admin | 204, 404 |
| GET | `/api/species/{id}/migration?month=` | User | 200, 400, 404 |
 
### Vessels
| Method | URL | Auth | Status-Codes |
|--------|-----|------|-------------|
| GET | `/api/vessels?bbox=` | User | 200, 400 (BBox Filter aktiv ✅) |
| GET | `/api/vessels/{mmsi}` | User | 200, 404 |
 
### Overlap (Kern-Feature)
| Method | URL | Auth | Status-Codes |
|--------|-----|------|-------------|
| GET | `/api/overlap?species=&month=` | User | 200, 400, 404 |
| GET | `/api/overlap/{mmsi}?species=` | User | 200, 404 (reused Service-Logik ✅) |
 
### Marine / Alerts / Favorites / Reports / Admin
| Method          | URL                                | Auth  | Status-Codes          |
| --------------- | ---------------------------------- | ----- | --------------------- |
| GET             | `/api/marine-conditions?lat=&lng=` | User  | 200, 400              |
| GET             | `/api/alerts?species=`             | User  | 200, 400, 404         |
| GET/POST/DELETE | `/api/favorites/species`           | User  | 200/201/204, 409, 404 |
| GET/POST/DELETE | `/api/favorites/regions`           | User  | 200/201/204, 404 (ORM Schema-Fix ✅) |
| GET/POST/DELETE | `/api/reports`                     | User  | 200/201/204, 404      |
| GET             | `/api/reports/compare?ids=1,2`     | User  | 200, 400              |
| GET             | `/api/admin/users`                 | Admin | 200                   |
| DELETE          | `/api/admin/users/{id}`            | Admin | 204, 404              |
| PATCH           | `/api/admin/users/{id}/role`       | Admin | 200, 400, 404         |
| GET             | `/api/admin/system`                | Admin | 200                   |
 
---
 
## 8. OVERLAP-SCORE ALGORITHMUS
 
```
Score = D × (A × 0.6 + T × 0.4)
 
D = max(0, 1 - d / radius_km)
    d = Distanz in km via Haversine(vessel_pos → zone_center)
    radius_km = Artspezifischer Radius (50km bis 200km)
    (D fungiert als multiplikativer Gatekeeper: Ist das Schiff außerhalb des Radius, wird der Score sofort 0)
 
A = max(0, 1 - sog / 10)
    sog = Speed over Ground in Knoten (Grenzgeschwindigkeit 10 kn)
 
T = max(0, 1 - |sst - temp_mid| / temp_range)
    sst = Aktuelle Sea Surface Temperature aus Open-Meteo
    temp_mid + temp_range kommen aus der artspezifischen Konfiguration
 
Fallback: SST nicht verfügbar → T = 0.5 (neutral)
 
Bewertung (Risk Level):
  > 0.7   → "CRITICAL"
  0.4–0.7 → "WARNING"
  < 0.4   → "LOW" (nicht im Alerts-Feed)
```
 
---
 
## 9. EXTERNE SERVICES
 
### OBIS
- URL: `https://api.obis.org/v3/occurrence`
- Parameter: `scientificname`, `startdate`, `enddate`, `geometry`
- Felder: `decimalLatitude`, `decimalLongitude`, `eventDate`
- Auth: keine | Getestet: ✅
 
### AISstream
- URL: `wss://stream.aisstream.io/v0/stream`
- Auth: API-Key ✅ (wird via `.env` geladen)
- Subscription innerhalb von 3 Sekunden senden
- Filter: PositionReport, BoundingBoxes berechnet aus monatlichen OBIS-Zonen
 
### Open-Meteo Marine
- URL: `https://marine-api.open-meteo.com/v1/marine`
- Parameter: `latitude`, `longitude`, `hourly=sea_surface_temperature`
- Auth: keine | Cache-TTL: 24h (In-Memory)
 
---
 
## 10. IN-MEMORY CACHES
 
```python
vessel_cache: dict[int, dict]   # Key=MMSI (int), Cleanup für inaktive Schiffe >30min
_zone_cache:  dict[str, dict]   # Key=species_id, Value={1..12: zone_data} (OBIS DBSCAN)
sst_cache:    dict[str, dict]   # Key="lat_lng" (gerundet auf 0.1°), TTL=24h
```
 
---
 
## 11. FOKUSARTEN — WISSENSCHAFTLICH VALIDIERTE PARAMETER
 
> Quelle: Multidimensionale Analyse mariner Schlüsselarten (wissenschaftliche Validierung, April 2026)
 
| Art | ID | temp_min | temp_max | **temp_mid** | **temp_range** | **radius_km** |
|-----|----|----------|----------|-------------|---------------|--------------|
| Roter Thun | `thunnus-thynnus` | 15.0 | 25.0 | **22.0** | 10.0 | 200 |
| Atl. Kabeljau | `gadus-morhua` | 0.0 | **12.0** | 6.0 | **6.0** | **100** |
| Sardine | `sardina-pilchardus` | 10.0 | 20.0 | 15.0 | **5.0** | **50** |
| Schwertfisch | `xiphias-gladius` | 18.0 | 28.0 | 23.0 | 10.0 | **150** |
 
### Validierungs-Details
 
#### 🐟 Roter Thun (`thunnus-thynnus`)
- **temp_mid: 22.0°C** — Laich-Schwerpunkt liegt bei 22–24°C (maximale Larvenüberlebensrate). 20°C war mathematisch korrekt, aber ökologisch zu niedrig.
- temp_range: 10.0 (Range 15–25°C deckt Fütterung + Laichen ab)
- radius_km: 200 (konservative Sicherheitsmarge für 48h, ~50km/Tag Wanderung)
 
#### 🐟 Atlantischer Kabeljau (`gadus-morhua`)
- **temp_max: 12.0°C** — 12°C ist der kritische metabolische Wendepunkt (Aerobic Scope kollabiert). Über 12°C: Wachstumsstagnation + erhöhte Sterblichkeit.
- **temp_range: 6.0°C** — Engeres Optimum (0–12°C Habitat, Laich-Optimum 0–6°C). T_mid=6.0°C = Optimum Embryonalentwicklung (~14 Tage bei 6°C).
- **radius_km: 100 km** — Kabeljau ist standorttreu, Migrationen >200km selten.
 
#### 🐟 Europäische Sardine (`sardina-pilchardus`)
- **temp_range: 5.0°C** — Engeres thermisches Optimum. Spawning bei 13–18°C, Larvenhabitat 16–18°C SST.
- **radius_km: 50 km** — Strategisch klein um Fehlalarme zu minimieren. Schulen lokal extrem dicht, Fischereiaktivität konzentriert auf kleine Areale.
 
#### 🐟 Schwertfisch (`xiphias-gladius`)
- **radius_km: 150 km** — 150km deckt 48h-Fenster ab (30–55km/Tag normaler Transit). Lingering-Radius <120km bei Fütterungsgebieten.
- temp_mid: 23.0 bestätigt (Lingering-Behavior bei 23–27°C = potenzielle Laichgründe)
- Diel Vertical Migration! Tagsüber 400–600m tief, nachts Oberfläche → Interaktion mit Fischereiflotte primär **nachts**.
 
---
 
## 12. ARCHITEKTUR & CONVENTIONS
 
```
Layered Architecture:
  routers/  → FastAPI Endpoints, Input Validation, Dependency-Injection Guards
  services/ → Business Logic, externe API-Aufrufe, Caching & Data Prep
  models/   → SQLAlchemy async ORM-Models (SQLite)
  schemas/  → Pydantic Validation & Serialization Request/Response Models
```
 
- **Naming:** `snake_case` (Python), `PascalCase` (Klassen), `kebab-case` (URL-Slugs)
- **Prefix:** Alle Endpoints `/api/...`
- **Error-Format:** `{"detail": "...", "status_code": 4xx}` — einheitlich überall
- **Async:** Alles async — FastAPI, SQLAlchemy, httpx, websockets
- **CORS:** Nur `http://localhost:5173` und lokale Frontend-Instanzen
 
### Env-Variablen
```
DATABASE_URL=sqlite+aiosqlite:///./oceanguard.db
AISSTREAM_API_KEY=
***ENTFERNT***
DEBUG=true
```
 
---
 
## 13. KEY-SIGNATUREN
 
```python
# database.py
async def get_db() -> AsyncGenerator[AsyncSession, None]: ...
async def init_db() -> None: ...
 
# auth/dependencies.py
async def get_current_user(token, db) -> User: ...
def require_role(required_role: str) -> Callable: ...
 
# auth/firebase.py
async def verify_firebase_token(token: str) -> dict: ...  # → {"uid", "email"}
 
# services/obis_service.py
async def fetch_occurrences(scientific_name: str, start_date: str | None, end_date: str | None, geometry: str | None) -> list[dict]: ...
async def calculate_zones(species_id: str, occurrences: list[dict]) -> dict[int, list[dict]]: ...
# → {month: [{"center": {"lat", "lng"}, "radius_km", "sighting_count"}]}
async def refresh_zones(species_id: str) -> None: ...
def get_zones(species_id: str) -> dict | None: ...  # → {1: zone_list, ..., 12: zone_list}
 
# services/ais_service.py
async def connect_ais_stream() -> None: ...       # Background Task (WebSocket)
async def get_vessels_for_species(species_id: str) -> list[dict]: ...
def get_all_vessels() -> list[dict]: ...
def get_vessel(mmsi: int) -> dict | None: ...
 
# services/meteo_service.py
async def get_sst(lat: float, lng: float) -> dict: ... # Cached fetch wrapper
async def fetch_sst(lat: float, lng: float) -> dict: ... # API call
# → {"sea_surface_temperature": float}
 
# services/overlap_service.py
def compute_single_score(vessel: dict, zone: dict, sst: float | None, species: Species) -> dict: ...
# → {"mmsi", "vessel_name", "lat", "lng", "sog", "D", "A", "T", "score", "level", "distance_km"}
def get_best_evaluation_for_vessel(vessel: dict, month_zones: list, zone_ssts: list, species: Species) -> dict | None: ...
async def compute_overlap(species_id: str, month: int, db: AsyncSession) -> dict: ...
# → {"species_id", "month_context", "zone_metadata", "stats": {"vessels_tracked_count", "average_threat_score", "maximum_threat_score"}, "tracked_vessels": [...]}
 
# utils/haversine.py
def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float: ...
# → km
```
 
---
 
## 14. RESPONSE-SCHEMAS (JSON-Beispiele)
 
### VesselScore
```json
{"mmsi": 123456789, "vessel_name": "FV Atlantic Star", "lat": 42.3, "lng": 5.1,
 "sog": 2.4, "score": 0.82, "D": 0.91, "A": 0.76, "T": 0.80, "level": "CRITICAL", "distance_km": 18.0}
```
 
### OverlapResponse
```json
{
  "species_id": "thunnus-thynnus",
  "month_context": 6,
  "zone_metadata": [{"center_lat": 40.1, "center_lng": 6.3, "radius_km": 200, "sea_surface_temperature_celsius": 21.5}],
  "stats": {"vessels_tracked_count": 1, "average_threat_score": 0.82, "maximum_threat_score": 0.82},
  "tracked_vessels": [...]
}
```
 
### Migration-Endpoint (GET /api/species/{id}/migration)
```json
{
  "species_id": "thunnus-thynnus",
  "month": 6,
  "zones": [
    {
      "center": {"lat": 40.1, "lng": 6.3},
      "radius_km": 200,
      "sighting_count": 143
    }
  ]
}
```
 
### AlertResponse
```json
[{"mmsi": "123456789", "vessel_name": "FV Atlantic Star", "species_id": "thunnus-thynnus", "score": 0.82, "risk_level": "CRITICAL", "message": "..."}]
```
 
### SystemStatus
```json
{"user_count": 42, "species_count": 4, "active_vessels": 17, "cached_zones": 48,
 "ais_connected": true, "last_ais_message_at": "2026-06-30T10:32:11Z", "uptime_seconds": 3600}
```
 
---
 
## 15. SPRINT-PLAN
 
| Datum | Was |
|-------|-----|
| 27. April 2026 | Spezifikations-Präsentation ✅ |
| 28. Mai / 01. Juni | Implementierungs-Review ✅ |
| 29. Juni / 02. Juli | Abschluss-Review (Polish durchgeführt) ✅ |
| 05. Juli 2026 | REST Extensions (HATEOAS + ETag Caching) 📋 |
| 09. Juli 2026 | Finale Abgabe 🚀 |
 
| Sprint | Zeitraum | Fokus | Status |
|--------|---------|-------|--------|
| Sprint 1 | ~13.04 – 27.04.2026 | Foundation | ✅ Abgeschlossen |
| Sprint 2 | 28.04 – 11.05.2026 | Core Features | ✅ Abgeschlossen |
| Sprint 3 | 12.05 – 01.06.2026 | Testing + Doku | ✅ Abgeschlossen |
| Sprint 4 | 02.06 – 30.06.2026 | Polish & Refactoring | ✅ Abgeschlossen |
| Sprint 5 | 01.07 – 05.07.2026 | REST Extensions (HATEOAS & Caching) | 📋 Geplant |
 
---
 
## 16. AKTUELLER PROJEKTSTATUS (30.06.2026)
 
### ✅ Fertig & Abgeschlossen
- **Modulares Setup & Excludes:** Hilfswerkzeuge (`ponytail`, `cocoindex-code`) und lokale Hilfskonfigurationen in `.git/info/exclude` eingepflegt.
- **Pydantic v2 Migration:** Alle Daten-Schemata und Konfigurationsdateien vollständig auf v2 `ConfigDict` migriert (Deprecation-Warnings bereinigt).
- **Core API Features & Services:**
  - DB-Setup & SQLAlchemy ORM-Models (user, species, favorite, report).
  - Firebase Authentication + Endpoint-Synchronisation.
  - Artenschutz-CRUD-Endpoints (GET öffentlich, POST/PUT/PATCH/DELETE Admin-restricted).
  - AIS-Stream-Anbindung via WebSockets mit Zonenfilterung und Vessel-Cache.
  - OBIS-Service mit monatlicher DBSCAN-Clusterberechnung und Meereskoordinaten-Filterung (Landbereinigung).
  - Open-Meteo Marine SST-Abfrage mit 24h-Caching.
- **Overlap-Score Engine:** Multi-Zonen-Turnierauswahl mit neuem multiplikativen Score-Modell (`Score = D * (A * 0.6 + T * 0.4)`). Redundanz im Single-Vessel-Router durch direkte Wiederverwendung der Service-Ermittlung behoben.
- **BBox-Filterung:** Geographische Filterung für `/api/vessels?bbox=` vollständig integriert.
- **Regions-Favoriten Fix:** Serialization-Mapping für `/favorites/regions` behoben (keine Schema-Verletzungen mehr).
- **Integrationstests:** Pytest-Suite auf 33 voll-funktionsfähige Integrationstests und Unit-Tests erweitert. Alle Tests laufen erfolgreich durch.

### 📋 In Arbeit / Geplant (Sprint 5)
- **HATEOAS (Hypermedia):** Erweiterung des `SpeciesResponse`-Modells um Hypermedia-Links (`_links`) zu verwandten Ressourcen (`self`, `migration`, `vessels`, `overlap`, `alerts`).
- **REST-Caching:** Integration von zeitbasiertem Caching (`Cache-Control: max-age`) und ETag-Validierung (`If-None-Match` → `304 Not Modified`) für die stabilen Ressourcen `/species` und `/species/{id}/migration`.
 
---
 
## 17. WICHTIGE ENTSCHEIDUNGEN
 
| Entscheidung | Begründung |
|-------------|------------|
| Firebase statt eigenem JWT | Sicherer, weniger Code, Firebase übernimmt Passwort-Verwaltung. |
| SQLite | Einfaches Setup, ausreichend für Studienarbeit. |
| In-Memory Cache | Kein zusätzlicher Service nötig (SST TTL 24h, AIS cleanup 30min). |
| Soft-Delete für Species | Historische Integrität bleibt in den Berichten erhalten. |
| Multiplikatives D-Modell | Distanz fungiert als Gatekeeper ($D=0 \rightarrow Score=0$), um Falschmeldungen außerhalb des Radius zu unterbinden. |
| temp_mid Kabeljau = 6°C | Optimum Embryonalentwicklung (~14 Tage bei 6°C). |
| temp_mid Thun = 22°C | Laich-Schwerpunkt 22–24°C. |
| radius_km Kabeljau = 100 | Standorttreue Art, >200km Migrationen selten. |
| radius_km Sardine = 50 | Fehlalarm-Minimierung, Schulen lokal extrem dicht. |
| radius_km Schwertfisch = 150 | 48h-Fenster bei 30–55km/Tag Transit. |
 
---
 
## 18. HÄUFIGE FEHLER & LÖSUNGEN
 
| Problem | Lösung |
|---------|--------|
| Firebase Token abgelaufen | Frontend: `user.getIdToken(true)`. |
| OBIS gibt 0 Occurrences | Zone mit `sighting_count: 0`, kein Crash. |
| AIS-WebSocket disconnected | Exponential Backoff: 5→10→20→max 60s. |
| SST nicht im Cache | Fallback T = 0.5 (neutral). |
| BBox ungültig | `400 Bad Request` mit klarer Fehlermeldung. |
| Favorites Duplikat | UNIQUE Constraint → `409 Conflict`. |
| Report Compare verschiedene Species | `400`: "Reports müssen gleiche Art haben". |
| Admin löscht sich selbst | `403`: "Admin kann sich nicht selbst löschen". |
 
---
 
*Letzte Aktualisierung: 30.06.2026 — Projekt erfolgreich refaktoriert, Pydantic v2 migriert, BBox-Filter & ORM-Mapping korrigiert und Testabdeckung erweitert.*
