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

#### macOS/Linux

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

#### macOS/Linux

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

**Wichtig:** Beim Start wird ein separates Fenster für das Backend geöffnet, damit Sie Backend-Logs, API-Fehler und Verbindungsprobleme direkt sehen können. Das Frontend läuft im ursprünglichen Terminal.

Die Anwendung zeigt folgende URLs an:
- **Frontend:** http://localhost:5173 (Hauptanwendung)
- **Backend API:** http://localhost:8000
- **API Dokumentation:** http://localhost:8000/docs (interaktive Swagger UI)

Das Backend-Fenster zeigt:
- ✅ Uvicorn Startup-Meldung ("Application startup complete")
- ✅ AISstream WebSocket-Verbindungsstatus
- ✅ Datenbank- und API-Fehler in Echtzeit

**Beenden:**
- Frontend: `Strg+C` im Terminal
- Backend: Schließen Sie das Backend-Fenster oder drücken Sie `Strg+C` darin

---

### Anwendung testen

1. Öffnen Sie Ihren Browser und navigieren Sie zu **http://localhost:5173**
2. Das Haupt-Dashboard sollte mit Live-Schiffsverfolgung laden
3. Für API-Tests besuchen Sie **http://localhost:8000/docs** für interaktive Dokumentation
4. Alle Endpoints können direkt über die Swagger UI getestet werden

---

## Fehlerbehebung

### Port bereits belegt

Bei "Port already in use"-Fehlern:

**Windows:**
```powershell
# Prozess auf Port 8000 beenden
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Prozess auf Port 5173 beenden
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Prozess auf Port 8000 beenden
lsof -ti:8000 | xargs kill -9

# Prozess auf Port 5173 beenden
lsof -ti:5173 | xargs kill -9
```

Danach die Anwendung neu starten.

---

### Python nicht gefunden

Stellen Sie sicher, dass Python installiert und zum PATH hinzugefügt wurde:
- **Windows:** Python neu installieren mit aktivierter Option "Add Python to PATH"
- **macOS:** Über Homebrew installieren: `brew install python@3.11`
- **Linux:** Über Paketmanager installieren: `sudo apt install python3 python3-pip python3-venv`

---

### Node.js nicht gefunden

Installieren Sie Node.js von [nodejs.org](https://nodejs.org/) (LTS-Version empfohlen).

---

### Berechtigungsprobleme (macOS/Linux)

Falls Setup-Skripte Berechtigungsfehler melden:

```bash
chmod +x backend/setup.sh frontend/setup.sh startScript.sh
```

---

### Probleme mit der virtuellen Umgebung

Falls die Backend virtuelle Umgebung Probleme hat:

```bash
# Löschen und neu erstellen
rm -rf backend/.venv
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

### Fehlende Konfigurationsdateien

Erforderliche `.env`-Dateien werden separat bereitgestellt. Stellen Sie sicher, dass diese existieren in:
- `backend/.env`
- `frontend/.env`

Bei Bedarf von `.env.example` kopieren und erforderliche Werte eintragen.

---

### Umlaut/Sonderzeichen werden falsch angezeigt

Falls deutsche Umlaute (ä, ö, ü) im Windows PowerShell falsch dargestellt werden:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

Das Start-Skript sollte dies automatisch korrigieren. Falls Probleme bestehen, fügen Sie diese Zeile am Anfang von `start.ps1` hinzu.

---
