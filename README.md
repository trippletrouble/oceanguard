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

## Externe APIs

| API | Typ | Auth |
|---|---|---|
| [OBIS](https://api.obis.org/v3/) | REST | Keine |
| [AISstream](https://aisstream.io/) | WebSocket | Kostenloser API-Key |
| [Open-Meteo Marine](https://marine-api.open-meteo.com/v1/marine) | REST | Keine |

---
