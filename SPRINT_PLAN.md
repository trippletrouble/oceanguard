# 📋 OceanGuard Sprint Plan & Task Tracking

**Topic:** [[OceanGuard]]
> **Stand:** 30.06.2026 | Alle Sprints abgeschlossen & verifiziert ✅

---

## 📌 Änderungen gegenüber altem Plan

| Was | Alt | Neu |
|---|---|---|
| **URL-Prefix** | `/api/auth`, `/api/species` | `/auth`, `/species` (kein `/api` Präfix) |
| **Auth in Swagger** | `OAuth2PasswordBearer` | `HTTPBearer` (einfaches Token-Feld in Swagger) |
| **Score-Formel** | additiv: `D×0.4 + A×0.35 + T×0.25` | **multiplikativ:** `D × (A×0.6 + T×0.4)` |
| **D-Cutoff** | hardcoded 100km | **dynamisch:** `species.radius_km` (50km bis 200km) |
| **SST-Abruf** | pro Schiff einzeln | **1 Punkt pro Zone (beim Start gecacht via Landcheck)** & via 24h-Cache |
| **wave_height** | abgerufen | **komplett weggelassen** (SST reicht als Proxy) |
| **month Parameter** | erforderlich (required) | **optional**, Default = aktueller Monat |
| **Öffentlicher Zugriff** | `/species/{id}/migration` | **Guest (kein Login nötig)** |
| **Öffentlicher Zugriff** | `/vessels`, `/overlaps`, `/alerts` | **Guest (kein Login nötig)** |

---

## ⚠️ Sprint 1 — Nachfixes (Erledigt ✅)

> Alle Nachfixes wurden vor dem Start von Sprint 2 erfolgreich umgesetzt.

### 👤 Naren — Nachfixes
* **Fix 1: main.py Prefix & Router registrieren:**
  * Präfix `/api` global entfernt. Alle Router (`auth`, `species`, `vessels`, `overlap`, `marine`, `alerts`, `favorites`, `reports`, `admin`) sauber registriert.
  * Variable `app_start_time` auf Modul-Ebene definiert, um die Uptime für das Admin-Dashboard zu messen.
* **Fix 2: dependencies.py + auth.py:**
  * Von `OAuth2PasswordBearer` auf `HTTPBearer` (FastAPI security) umgestellt, damit die Token-Verifikation über das Firebase ID-Token im Header reibungslos klappt.

### 👤 Marina — Nachfixes
* **Fix 3: Migration-Endpoint auf Guest-Zugriff:**
  * In `app/routers/species.py` die Authentifizierungspflicht für `/species/{species_id}/migration` entfernt. Gäste dürfen saisonale Zonen ohne Login einsehen.

### 👤 Fadhil — Nachfixes
* **Fix 4: Marine-Endpoint auf Guest-Zugriff:**
  * In `app/routers/marine.py` die `get_current_user` Dependency entfernt, um die Wassertemperatur-Abfrage öffentlich zu machen.
* **Fix 5: ais_service.py — Modul-Exporte & get_all_bboxes():**
  * Export der Variablen `vessel_cache`, `ais_connected` und `last_ais_message_at` auf Modul-Ebene (für den System-Status benötigt).
  * Funktion `get_all_bboxes()` implementiert, die dynamisch für den aktuellen Monat alle Bounding-Boxes aktiver Fischarten aus OBIS berechnet, um das AIS-WebSocket zu abonnieren.

---

## 🔄 Sprint 2 — Core Features (Erledigt ✅)

> Alle REST-Endpunkte wurden implementiert. Das Backend ist feature-complete.

### 👤 Naren — Species CRUD (Admin) + Admin-Router
* **N-2.1: Species CRUD Endpoints:**
  * `POST /species`: Erstellen neuer Fischarten mit Validierung (`temp_min < temp_max`) und Konflikterkennung (`409 Conflict` bei existierender ID).
  * `PUT /species/{id}`: Vollständige Aktualisierung einer Fischart.
  * `PATCH /species/{id}`: Partielle Aktualisierung einer Fischart.
  * `DELETE /species/{id}`: Soft-Delete (setzen von `active = False`), um historische Berichtsdaten nicht zu gefährden.
* **N-2.2: Admin-Router Endpoints:**
  * `GET /admin/users`: Liste aller registrierten Benutzer abrufen.
  * `DELETE /admin/users/{user_id}`: Benutzer löschen (Selbstlöschung blockiert mit `403`).
  * `PATCH /admin/users/{user_id}/role`: Benutzerrolle aktualisieren (`guest`, `user`, `admin`).
  * `GET /admin/system`: Systemstatus-Monitor mit Live-Metriken (Benutzerzahl, aktive Schiffe, gecachte Zonen, AIS-Status und Uptime).

### 👤 Marina — Overlap-Engine + Router + Alerts
* **M-2.1: Overlap-Service:**
  * `compute_single_score()`: Multiplikativer Score-Algorithmus unter Verwendung des artspezifischen Suchradius.
  * `compute_overlap()`: Extrahiert Schiffe innerhalb des Puffer-Radius um das monatliche Migrationszentrum, holt die Temperatur und berechnet Bedrohungswerte und Statistiken.
* **M-2.2: Overlap-Router:**
  * `GET /overlaps`: Berechnet Overlap-Score für eine Art und optionalen Monat (öffentlich).
  * `GET /overlaps/{mmsi}`: Einzelne Schiffsbedrohung für das aktuelle Monat berechnen (öffentlich).
* **M-2.3: Alerts-Router:**
  * `GET /alerts`: Filtert Schiffe mit einem Gefahrenlevel von `WARNING` und `CRITICAL` (Score >= 0.4) und stellt diese als vereinfachten Feed bereit.

### 👤 Fadhil — Vessels + Meteo-SST + Favorites + Reports
* **F-2.1: Vessels-Router:**
  * `GET /vessels`: Gibt alle gecachten Schiffe zurück. Optional mit BBox-Filterung.
  * `GET /vessels/{mmsi}`: Detaildaten eines Schiffes abrufen.
* **F-2.2: Meteo-Service (SST Cache):**
  * `fetch_sst_for_zone()`: Sammelt SST für drei Koordinatenpunkte (Zentrum, Nord, Süd) einer Zone und berechnet den Durchschnitt.
  * `get_cached_sst()`: Liefert gecachte Temperaturen mit 24 Stunden TTL.
  * `prefetch_sst_for_all_species()`: Lädt beim App-Startup die Temperaturen für alle aktiven Arten vor.
* **F-2.3: Favorites-Router:**
  * Artenfavoriten: Endpunkte zum Speichern, Auflisten und Entfernen von favorisierten Arten.
  * Regionsfavoriten: Endpunkte zum Verwalten geographischer Bounding-Boxes. Eindeutigkeit (`409`) und Ownership-Checks implementiert.
* **F-2.4: Reports-Router:**
  * Endpunkte zum Speichern historischer Gefahren-Snapshots, Abrufen von Reports und Löschen mit Ownership-Check.
  * `/reports/compare`: Vergleicht zwei historische Berichte derselben Fischart und gibt den Differenz-Score sowie die Schiffsdifferenz zurück.

---

## 📋 Sprint 3 — Testing & Doku (Erledigt ✅)

### 👤 Naren — OpenAPI-Doku & Integration-Tests
* **N-3.1: Swagger-Dokumentation:**
  * Jeden API-Endpoint in den Routern mit aussagekräftigen `summary`, `description` und Pydantic-Response-Modellen dokumentiert. Exportiert als [openapi.yaml](file://../documentation/openapi.yaml).
* **N-3.2: Integrations-Testsuite:**
  * 15+ Integrationstests unter Verwendung von pytest, einem Mock-Firebase-Token-Generator und transaktionalen Test-Datenbank-Sessions aufgesetzt.

### 👤 Marina — Overlap-Tests & OBIS-Absicherung
* **M-3.1: Overlap Unit-Tests:**
  * 10+ Unit-Tests in `test_overlap.py` geschrieben. Testet mathematische Grenzfälle (CRITICAL, GERING, Transit-Schiffe, Fallbacks).
* **M-3.2: OBIS Error-Handling:**
  * Retry-Mechanismen, Timeouts und Fehler-Logging in `obis_service.py` integriert. Das System fängt Ausfälle ab und läuft stabil weiter (Graceful Degradation).

### 👤 Fadhil — Service-Tests & AIS-Stabilität
* **F-3.1: Service-Tests:**
  * 12+ Integrationstests für Vessels, Favorites und Reports geschrieben.
* **F-3.2: AIS-Stabilität (Reconnect):**
  * WebSocket-Verbindung im Hintergrund-Thread mit Exponential Backoff (5s bis max 60s) und sicherem Signal-Handler bei Server-Shutdown stabilisiert.
* **F-3.3: Einheitliches Fehler-Format:**
  * Exception-Handler in `main.py` registriert, um alle FastAPI-Validierungsfehler und HTTPExceptions in das einheitliche Format `{"detail": "..."}` umzuwandeln.

---

## 🚀 Sprint 4 — Polish, Refactoring & Audit Fixes (Erledigt ✅)

> **Fokus:** Finales Refactoring, Bugfixes aus dem Code-Audit und Vorbereitung der Abgabe.

### 👤 Alle Entwickler — Code Audit & Polish (30.06.2026)
* **Pydantic v2 Migration:** Sämtliche verbleibenden Schemata und Konfigurationen auf Pydantic v2 `ConfigDict` migriert. Alle 28 Deprecation-Warnungen im Testlauf vollständig bereinigt.
* **Redundanzbereinigung (Overlap):** Den Router `/overlap/{mmsi}` so refaktoriert, dass er die Logik des `overlap_service` (`get_best_evaluation_for_vessel`) direkt wiederverwendet, statt redundante SST-Schleifen auszuführen.
* **Vessels BBox Filterung:** Filter-Logik für `GET /vessels?bbox=min_lat,min_lng,max_lat,max_lng` vollständig implementiert und Fehlerbehandlung bei falscher Formatierung hinzugefügt.
* **Regions-Favoriten Fix:** Das manuelle Dict-Mapping bei `/favorites/regions` entfernt. Die Endpunkte geben nun direkt die SQLAlchemy-Modelle zurück und überlassen die Serialisierung fehlerfrei Pydantic (`from_attributes`).
* **Testabdeckung erweitert:** Integrationstests für den Vessels-BBox-Filter und den Regions-CRUD-Flow hinzugefügt.
* **Testlauf:** Gesamte Suite (33/33 Tests passed) erfolgreich und fehlerfrei ausgeführt.


---

## 🚀 Sprint 5 — REST Extensions: Hypermedia & ETag-Caching (01.07. – 05.07.2026)

> **Fokus:** Implementierung fortgeschrittener REST-Architektur-Constraints (HATEOAS und Cache-Control/ETag Validation), um die Anforderungen der Studienarbeit auf akademischem Spitzenniveau abzuschließen.

### 👤 Alle Entwickler — REST Hardening & Extensions

#### 1. Hypermedia (HATEOAS) für die Species-Ressource
* **Ziel:** Die API liefert bei Ressourcen-Abfragen strukturierte Links zu Folgeaktionen zurück, um den HATEOAS-Constraint zu erfüllen.
* **Aufgaben:**
  * Das `SpeciesResponse`-Pydantic-Modell um ein `_links`-Feld (Dictionary) erweitern.
  * Bei Abfrage einer Fischart (`GET /species/{id}`) Hypermedia-Relationen zurückgeben:
    * `self`: Link zur Detailansicht der Art (`/species/{id}`)
    * `migration`: Link zur saisonalen Migrationszone (`/species/{id}/migration?month={month}`)
    * `vessels`: Link zu den in der Zone befindlichen Schiffen (`/vessels/species/{id}`)
    * `overlap`: Link zur Overlap-Score-Auswertung (`/overlap?species={id}`)
    * `alerts`: Link zum aktiven Gefahren-Feed (`/alerts?species={id}`)

#### 2. Zeit- und ETag-basiertes Caching
* **Ziel:** Reduzierung von Bandbreite und Serverlast für statische und semi-statische Daten unter Einhaltung des REST-Caching-Constraints.
* **Aufgaben (Zeit-basiert):**
  * Hinzufügen von `Cache-Control: public, max-age=86400` (24h) HTTP-Headern für Antworten von `/species/` (Artliste) und `/species/{id}/migration` (da sich historische Sichtungs-Cluster selten ändern).
* **Aufgaben (ETag-basiert):**
  * Implementierung einer ETag-Validierung (z. B. MD5-Hash des Response-Bodys) für `/species` und `/species/{id}/migration`.
  * Wenn der Client eine Folgeabfrage mit dem Header `If-None-Match: "<etag>"` sendet und sich die Daten nicht geändert haben, antwortet das Backend sofort mit einem leeren Body und dem Status-Code `304 Not Modified`.

#### 3. Integration-Tests für REST Extensions
* **Ziel:** Vollständige Testabdeckung für die neuen HATEOAS-Links und die Caching-Schnittstellen.
* **Aufgaben:**
  * Schreiben von Tests, die das Vorhandensein der `_links` Struktur verifizieren.
  * Schreiben von Tests, die überprüfen, dass bei Angabe eines gültigen `If-None-Match` Headers ein `304 Not Modified` zurückgegeben wird.

---

## 📊 Gesamtfortschritt

| Sprint | Zeitraum | Fokus | Status |
|---|---|---|---|
| **Sprint 1** | 13.04 – 27.04.2026 | Foundation & Setup | ✅ Abgeschlossen |
| **Sprint 2** | 28.04 – 11.05.2026 | Core Endpoints & Services | ✅ Abgeschlossen |
| **Sprint 3** | 12.05 – 01.06.2026 | Testing & API-Dokumentation | ✅ Abgeschlossen |
| **Sprint 4** | 02.06 – 30.06.2026 | Polish, Code Audit & Refactoring | ✅ Abgeschlossen |
| **Sprint 5** | 01.07 – 05.07.2026 | REST Extensions (HATEOAS & ETag Caching) | 📋 Geplant |

### Wichtige Meilensteine
* **27. April 2026:** Spezifikations-Präsentation ✅
* **28. Mai 2026:** Implementierungs-Review ✅
* **29. Juni 2026:** Abschluss-Review (System Polish durchgeführt) ✅
* **05. Juli 2026:** REST Extensions abgeschlossen (Ziel: vor dem 06. Juli) 📋
* **09. Juli 2026:** Finale Projektabgabe (Offizielle Deadline) 🚀
