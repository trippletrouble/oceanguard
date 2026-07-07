## Installation & Einrichtung

### Voraussetzungen

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))

---

### Einmalige Einrichtung (nur beim ersten Start)

#### Windows

```powershell
.\backend\setup.ps1
.\frontend\setup.ps1
```

#### macOS/Linux (including Ubuntu)

```bash
chmod +x backend/setup.sh frontend/setup.sh startScript.sh
./backend/setup.sh
./frontend/setup.sh
```

Dies führt folgende Schritte aus:
- Erstellt die Python virtuelle Umgebung und installiert Backend-Abhängigkeiten
- Installiert Node.js-Pakete für das Frontend
- Dauert ca. 2-3 Minuten

---

### Anwendung starten

Nach der Einrichtung verwenden Sie das Start-Skript, um Backend und Frontend zu starten:

#### Windows

Doppelklick auf `start.ps1` oder in PowerShell ausführen:

```powershell
.\start.ps1
```

#### macOS/Linux

```bash
./startScript.sh
```

Die Anwendung startet und zeigt folgende URLs an:
- **Frontend:** http://localhost:5173 (Hauptanwendung)
- **Backend API:** http://localhost:8000
- **API Dokumentation:** http://localhost:8000/docs (interaktive Swagger UI)

---

# 🌊 OceanGuard

**Echtzeit-Überwachung von Fischereifahrzeugen in Fisch-Migrationszonen.**

OceanGuard kombiniert drei isolierte Datenquellen zu einem einzigen **Overlap-Score**, der eine Frage beantwortet:

> *„Fahren gerade Fischereifahrzeuge genau dort, wo Fische saisonal wandern – und wie kritisch ist die Situation?"*

---

## Das Problem

Jedes Jahr werden Millionen Tonnen Fisch während ihrer saisonalen Wanderungen gefangen – genau dann, wenn Fischpopulationen am verwundbarsten sind. Die Daten, um das zu erkennen, existieren (Schiffspositionen, Fischsichtungen, Meerestemperaturen) – aber sie liegen in drei getrennten Systemen, die niemand verbindet.

## Die Lösung

OceanGuard verknüpft diese Datenquellen und berechnet in Echtzeit einen Bedrohungs-Score für jedes Fischereifahrzeug.

| Datenquelle | Liefert | Rolle |
|---|---|---|
| **OBIS API** | Historische Artensichtungen | → Saisonale Verbreitungszonen |
| **AISstream** | Live-Schiffspositionen (WebSocket) | → Fischereifahrzeug-Tracking |
| **Open-Meteo Marine API** | Aktuelle Meeresbedingungen | → Temperatur-Plausibilitätsprüfung |

---

## Overlap-Score

$$Score = D \times (A \times 0.6 + T \times 0.4)$$

**D (Distanz)** fungiert als Gatekeeper – wenn das Schiff weit entfernt ist, ist der gesamte Score 0.
**A (Aktivität)** und **T (Temperatur)** verfeinern den Score, wenn das Schiff in der Nähe ist.

Alle drei Faktoren nutzen dasselbe Muster:

$$Faktor = \max\left(0,\; 1 - \frac{Wert}{Schwelle}\right)$$

### D – Distanz-Faktor

$$D = \max\left(0,\; 1 - \frac{d}{Radius_{Art}}\right)$$

Der Schwellenwert ($Radius_{Art}$) hängt von der jeweiligen Fischart ab:
* Roter Thun: 200 km
* Atlantischer Kabeljau: 100 km
* Sardine: 50 km
* Schwertfisch: 150 km

| Entfernung (z. B. Kabeljau mit $Radius = 100\text{ km}$) | D | Bedeutung |
|---|---|---|
| 0 km (im Zentrum) | 1.0 | Maximale Bedrohung |
| $Radius \times 0.5$ (z. B. 50 km) | 0.5 | Mittel |
| $\ge Radius$ (z. B. 100+ km) | 0.0 | Keine Bedrohung → **gesamter Score = 0** |

Distanz berechnet via **Haversine-Formel**.

### A – Aktivitäts-Faktor

$$A = \max\left(0,\; 1 - \frac{v}{10}\right)$$

| Geschwindigkeit | A | Bedeutung |
|---|---|---|
| 0 kn | 1.0 | Steht still, fischt wahrscheinlich |
| 2–3 kn | 0.7–0.8 | Schleppgeschwindigkeit |
| 5 kn | 0.5 | Grenzbereich |
| 10+ kn | 0.0 | Transit, fischt nicht |

Basiert auf der Methodik von **Global Fishing Watch** (Kroodsma et al., *Science*, 2018).

### T – Temperatur-Faktor

$$T = \max\left(0,\; 1 - \frac{|T_{aktuell} - T_{mitte}|}{R}\right)$$

Prüft, ob Fische wahrscheinlich anwesend sind – basierend auf der aktuellen Meeresoberflächentemperatur vs. Optimalbereich der Art.

### Score-Bewertung

| Score | Stufe |
|---|---|
| > 0.7 | 🔴 KRITISCH |
| 0.4 – 0.7 | 🟡 WARNUNG |
| < 0.4 | 🟢 GERING |

---

## Fokus-Arten (MVP)

| Art | Wissenschaftl. Name | Region | Opt. Temp. | IUCN-Status |
|---|---|---|---|---|
| 🐟 Roter Thun | *Thunnus thynnus* | Mittelmeer / Ostatlantik | 15–25°C | Nicht gefährdet |
| 🐟 Atlantischer Kabeljau | *Gadus morhua* | Nordsee / Nordatlantik | 0–12°C | Gefährdet |
| 🐟 Sardine | *Sardina pilchardus* | Europ. Atlantikküste | 10–20°C | Nicht gefährdet |
| 🐟 Schwertfisch | *Xiphias gladius* | Mittelmeer / Atlantik | 18–28°C | Potenziell gefährdet |

**MVP startet mit Rotem Thun** (beste OBIS-Datenabdeckung, hohe Schutzrelevanz).

---

## Tech-Stack

- **Backend:** REST Web Service, konsumiert alle drei externen APIs
- **Frontend:** Kartenbasierte UI mit MapTiler SDK
- **Echtzeit:** WebSocket (AISstream → Backend → Frontend via REST-Polling)
- **Datenformat:** Durchgehend JSON

---

## Externe APIs

| API | Typ | Auth |
|---|---|---|
| [OBIS](https://api.obis.org/v3/) | REST | Keine |
| [AISstream](https://aisstream.io/) | WebSocket | Kostenloser API-Key |
| [Open-Meteo Marine](https://marine-api.open-meteo.com/v1/marine) | REST | Keine |

---

## API-Dokumentation

OceanGuard bietet die API-Dokumentation in zwei Formaten:

| Format | Ort | Beschreibung |
|--------|-----|--------------|
| **OpenAPI YAML** | `documentation/openapi.yaml` | Maschinenlesbare Spezifikation (vollständige OpenAPI 3.1.0 Definition) |
| **Interaktive HTML** | http://localhost:8000/docs | Swagger UI – läuft mit dem Backend, ermöglicht direktes Testen aller Endpoints |

> **Hinweis:** Die Swagger UI unter `/docs` ist die generierte HTML-Version der API-Beschreibung. Sie bietet:
> - Vollständige Endpoint-Dokumentation
> - Interaktives Testen mit echten Requests
> - Request/Response-Beispiele
> - Authentifizierungsunterstützung (Bearer Token)

---

## API-Endpoints

| Endpoint | Beschreibung |
|---|---|
| `GET /species/` | Liste aller unterstützten, aktiven Arten |
| `GET /species/{species_id}/migration?month=` | Saisonale Verbreitungszone (GeoJSON) |
| `GET /vessels` | Aktive Schiffspositionen (ohne Filter) |
| `GET /overlap?species_id=&month=` | **Kern:** Overlap-Score Berechnung für eine Fischart |
| `GET /marine-conditions?lat=&lng=` | Meeresbedingungen an einem Koordinatenpunkt |
| `GET /alerts?species_id=` | Aktive Warnungen für eine Fischart |

---

### ETag Caching Beispiel

Demonstration des ETag-basierten HTTP-Cachings mit curl:

```bash
# Erster Request – vollständige Antwort + ETag Header
curl -i http://localhost:8000/species/
# Antwort enthält: ETag: W/"abc123..."

# Zweiter Request mit If-None-Match – Server antwortet mit 304 Not Modified
curl -i -H 'If-None-Match: W/"abc123..."' http://localhost:8000/species/
# Antwort: HTTP 304 Not Modified (kein Body, Bandbreite gespart)
```

Dies demonstriert zeitbasiertes Caching (`Cache-Control: max-age=86400`, 24 Stunden) 
kombiniert mit validierungsbasiertem Caching (ETag/If-None-Match).

**Getestete Endpoints mit ETag-Support:**
- `GET /species/` – Liste aller Fischarten
- `GET /species/{species_id}/migration?month=` – Migrationszonen einer Art

---
