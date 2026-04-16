## 1. Problemstellung

Jedes Jahr werden Millionen Tonnen Fisch während ihrer saisonalen Wanderungen gefangen – genau dann, wenn Fischpopulationen am verwundbarsten sind. Fischereifahrzeuge operieren häufig gezielt in Gebieten aktiver Fisch-Migration, was die ohnehin bedrohten Bestände weiter gefährdet.

**Das Problem:** Es gibt derzeit keine einfache, öffentlich zugängliche Lösung, die in Echtzeit sichtbar macht, ob Fischereifahrzeuge in Gebieten aktiver Fisch-Migration operieren. Die Daten existieren – Schiffspositionen (AIS), Artensichtungen (OBIS), Meeresbedingungen (Open-Meteo) – aber sie sind isoliert und nicht miteinander verknüpft.

**Die Konsequenz:** Weder Behörden, Naturschutzorganisationen noch die Öffentlichkeit können schnell erkennen, wo ein akutes Risiko für wandernde Fischpopulationen besteht.

---

## 2. Unsere Lösung: OceanGuard

OceanGuard ist eine Web-Applikation, die **drei isolierte Datenquellen kombiniert** und daraus einen neuartigen **Overlap-Score** berechnet. Dieser Score beantwortet eine einfache Frage:

> _„Fahren gerade Fischereifahrzeuge genau dort, wo Fische saisonal wandern – und wie kritisch ist das?"_

### Wie funktioniert das?

| Datenquelle | Was sie liefert | Rolle in OceanGuard |
|---|---|---|
| **OBIS API** | Historische Sichtungsdaten von Meerestieren | → Saisonale Verbreitungszonen ableiten |
| **AISstream** | Echtzeit-Schiffspositionen weltweit | → Fischereifahrzeuge live tracken |
| **Open-Meteo Marine API** | Aktuelle Meeresbedingungen | → Migrationswahrscheinlichkeit verifizieren |

Unser eigener REST Web Service **kombiniert** diese Daten und berechnet den Overlap-Score – das ist der **Mehrwert**, der über reines Durchreichen hinausgeht.

---

## 3. Externe APIs im Detail

### 3.1 OBIS – Ocean Biodiversity Information System

- **Zweck:** Historische Sichtungsdaten von Meerestieren → daraus saisonale Verbreitungszonen ableiten
- **Base-URL:** [https://api.obis.org/v3/](https://api.obis.org/v3/)
- **Wichtigster Endpoint:** GET /occurrence
- **Relevante Parameter:**
    - scientificname – z.B. Thunnus thynnus (Roter Thun)
    - startdate / enddate – Zeitraum filtern
    - geometry – WKT-Polygon für Region
- **Relevante Response-Felder:** `decimalLatitude`, `decimalLongitude`, `eventDate`, `scientificName`
- **Auth:** Keine (komplett offen)
- **Nutzung im Projekt:** Daten werden periodisch abgerufen und vorverarbeitet. Pro Art und Monat wird aus allen historischen Sichtungen der räumliche Mittelpunkt (Durchschnitt aller Lat/Lng-Werte) + ein Radius berechnet. Das ergibt eine **saisonale Verbreitungszone** (Kreis) pro Monat. Nicht Echtzeit.

### 3.2 AISstream.io – Echtzeit-Schiffspositionen

- **Zweck:** Live-Positionen von Schiffen weltweit via AIS-Transponder
- **Verbindung:** WebSocket `wss://stream.aisstream.io/v0/stream`
- **Auth:** Kostenloser API-Key nach Registrierung
- **Relevante Felder:** `Latitude`, `Longitude`, `SpeedOverGround`, `ShipType`
- **Wichtige Logik:** `ShipType = 30` → Fischereifahrzeug. Geschwindigkeit < 5 Knoten → wahrscheinlich aktiv fischend
- **Warum WebSocket statt REST?** Für Echtzeit-Schiffstracking wäre REST-Polling extrem ineffizient (tausende Requests/Minute). WebSocket liefert einen kontinuierlichen Datenstrom – ideal für Live-Positionen.

### 3.3 Open-Meteo Marine Weather API

- **Zweck:** Aktuelle Meeresbedingungen als Kontext-Layer
- **Base-URL:** [https://marine-api.open-meteo.com/v1/marine](https://marine-api.open-meteo.com/v1/marine)
- **Parameter:** `latitude`, `longitude`, `hourly` (z.B. `sea_surface_temperature`, `wave_height`)
- **Auth:** Keine
- **Nutzung im Projekt:** Wassertemperatur bestätigt/widerlegt Migrationswahrscheinlichkeit. Z.B. Roter Thun bevorzugt 15–25°C – wenn die aktuelle Temperatur in diesem Bereich liegt, steigt der Overlap-Score.

---

## 4. Eigener REST Web Service – Der Mehrwert

Unser Backend konsumiert die drei externen APIs und bietet dem Frontend über eine **saubere REST-Schnittstelle** aufbereitete, kombinierte Daten an.

### Kern-Endpoints (Entwurf):

| Endpoint | Beschreibung |
|---|---|
| `GET /api/species` | Liste aller unterstützten Fischarten |
| `GET /api/species/{id}/migration?month=` | Saisonale Verbreitungszone einer Art pro Monat (GeoJSON) |
| `GET /api/vessels?bbox=&type=fishing` | Aktuelle Fischereifahrzeuge in einer Region |
| `GET /api/overlap?species=&month=&bbox=` | **Kern:** Overlap-Score Berechnung |
| `GET /api/marine-conditions?lat=&lng=` | Meeresbedingungen an einem Punkt |
| `GET /api/alerts?species=&bbox=` | Aktive Warnungen |

### Overlap-Score Algorithmus

$$Score = D \times (A \times 0.6 + T \times 0.4)$$

Wobei:

- **D** = Distanz-Faktor (Wie nah ist das Schiff an der Verbreitungszone?)
- **A** = Aktivitäts-Faktor (Wie wahrscheinlich fischt das Schiff aktiv?)
- **T** = Temperatur-Faktor (Passt die aktuelle Wassertemperatur zum Optimum der Art?)

#### Warum multiplikativ?

Die Distanz fungiert als **Gatekeeper**. Wenn ein Schiff weit entfernt ist ($D = 0$), ist der gesamte Score 0 – egal wie langsam es fährt oder wie perfekt die Temperatur ist. Das verhindert **False Positives**: Ein Schiff 500 km entfernt kann in einer rein additiven Formel trotzdem einen WARNING-Score erreichen, obwohl es offensichtlich keine Bedrohung darstellt.

Erst wenn das Schiff tatsächlich in der Nähe ist ($D > 0$), verfeinern die Faktoren A und T den Score:
- **A** bestimmt, ob das Schiff aktiv fischt (60% Gewicht innerhalb der Klammer, da direkter messbar und zuverlässiger)
- **T** prüft, ob Fische wahrscheinlich überhaupt da sind (40% Gewicht als Plausibilitätsprüfung)

Alle drei Faktoren nutzen dasselbe einfache Pattern – eine lineare Interpolation zwischen 0.0 und 1.0:

$$Faktor = \max\left(0,\; 1 - \frac{Wert}{Schwelle}\right)$$

---

#### D – Distanz-Faktor

$$D = \max\left(0,\; 1 - \frac{d}{100}\right)$$

$d$ = Entfernung des Schiffs zur nächsten Verbreitungszone in km (berechnet via Haversine-Formel).

| Entfernung $d$ | $D$ | Bedeutung |
|---|---|---|
| 0 km (in der Zone) | 1.0 | Maximale Bedrohung |
| 25 km | 0.75 | Sehr nah |
| 50 km | 0.5 | Mittlere Entfernung |
| 75 km | 0.25 | Ziemlich weit |
| 100+ km | 0.0 | Keine Bedrohung → **gesamter Score wird 0** |

**Datenquellen:** Schiffsposition aus AISstream (`Latitude`, `Longitude`) + Zonenmittelpunkt aus vorverarbeiteten OBIS-Daten.

**Haversine-Formel für die Distanzberechnung:**

$$d = 2r \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

Wobei $r = 6371$ km (Erdradius), $\phi$ = Breitengrad in Radian, $\lambda$ = Längengrad in Radian.

---

#### A – Aktivitäts-Faktor

$$A = \max\left(0,\; 1 - \frac{v}{10}\right)$$

$v$ = Geschwindigkeit des Schiffs in Knoten.

| Geschwindigkeit $v$ | $A$ | Bedeutung |
|---|---|---|
| 0 kn | 1.0 | Steht still, fischt höchstwahrscheinlich |
| 2 kn | 0.8 | Schleppt Netz (typische Schleppgeschwindigkeit) |
| 3 kn | 0.7 | Langsam, wahrscheinlich fischend |
| 5 kn | 0.5 | Möglicherweise fischend |
| 8 kn | 0.2 | Wahrscheinlich Transit |
| 10+ kn | 0.0 | Definitiv Transit, fischt nicht |

**Warum Aktivität statt Kursrichtung?** Die Geschwindigkeit eines Fischereifahrzeugs ist ein wissenschaftlich etablierter Proxy für Fischerei-Aktivität (vgl. Kroodsma et al. 2018, Global Fishing Watch). Ein Schleppnetz erzeugt enormen Widerstand – Schiffe können physikalisch nicht schnell fahren während sie fischen. Eine Migrationsrichtung lässt sich aus OBIS-Sichtungsdaten nicht zuverlässig ableiten, da diese nur Positionen, keine Richtungen enthalten.

**Datenquelle:** `SpeedOverGround` aus AISstream.

---

#### T – Temperatur-Faktor

$$T = \max\left(0,\; 1 - \frac{|T_{aktuell} - T_{mitte}|}{R}\right)$$

- $T_{mitte}$ = Mitte des Optimalbereichs der Art (z.B. Roter Thun: $(15+25)/2 = 20°C$)
- $R$ = halbe Breite des Optimalbereichs + Puffer (z.B. Roter Thun: $5 + 5 = 10°C$)

**Beispiel Roter Thun** (optimal 15–25°C, $T_{mitte} = 20°C$, $R = 10°C$):

| Wassertemp. $T_{aktuell}$ | $T$ | Bedeutung |
|---|---|---|
| 20°C | 1.0 | Perfekte Temperatur, Thunfisch sehr wahrscheinlich hier |
| 17°C | 0.7 | Noch im Optimalbereich |
| 25°C | 0.5 | Rand des Optimalbereichs |
| 28°C | 0.2 | Wird zu warm |
| 30°C+ | 0.0 | Viel zu warm, kein Thunfisch hier |

**Warum Temperatur als Plausibilitätsprüfung?** Fische sind wechselwarm (ektotherm). Ihr Stoffwechsel, ihre Fortpflanzung und ihre Nahrungssuche hängen direkt von der Wassertemperatur ab. Fische folgen buchstäblich den Isothermen – Linien gleicher Temperatur – durch den Ozean. Wenn die Wassertemperatur nicht zum Optimum der Art passt, sind die Fische mit hoher Wahrscheinlichkeit nicht dort, unabhängig von historischen Daten.

**Datenquellen:** `sea_surface_temperature` aus Open-Meteo + artspezifische Konfiguration im Backend.

---

#### Bewertung

| Score | Stufe | Bedeutung |
|---|---|---|
| > 0.7 | 🔴 KRITISCH | Hohe Bedrohung – Schiff fischt aktiv in/nahe einer Verbreitungszone bei passender Temperatur |
| 0.4 – 0.7 | 🟡 WARNUNG | Moderate Bedrohung – ein oder mehrere Faktoren deuten auf Risiko hin |
| < 0.4 | 🟢 GERING | Geringe Bedrohung – Schiff ist weit entfernt, im Transit oder Temperatur unpassend |

> *Hinweis: Die Schwellenwerte (0.4 / 0.7) und die Gewichtungen der Faktoren sind initial gesetzt und können bei Bedarf durch reale Testdaten kalibriert werden.*

---

#### Rechenbeispiele

**Szenario 1 – Kritisch:** Mai, Fischereifahrzeug 5 km vor den Balearen, fährt 1 Knoten, Wassertemperatur 20°C. Art: Roter Thun.

$$D = \max\left(0,\; 1 - \frac{5}{100}\right) = 0.95$$

$$A = \max\left(0,\; 1 - \frac{1}{10}\right) = 0.9$$

$$T = \max\left(0,\; 1 - \frac{|20 - 20|}{10}\right) = 1.0$$

$$Score = 0.95 \times (0.9 \times 0.6 + 1.0 \times 0.4) = 0.95 \times (0.54 + 0.4) = 0.95 \times 0.94 = 0.893$$

**→ 🔴 KRITISCH** – Nahezu stillstehendes Fischereifahrzeug, direkt in der Verbreitungszone, perfekte Thunfisch-Temperatur während der Laichzeit.

---

**Szenario 2 – Warnung:** Fischereifahrzeug 30 km entfernt, fährt 3 Knoten, Wassertemperatur 17°C.

$$D = \max\left(0,\; 1 - \frac{30}{100}\right) = 0.7$$

$$A = \max\left(0,\; 1 - \frac{3}{10}\right) = 0.7$$

$$T = \max\left(0,\; 1 - \frac{|17 - 20|}{10}\right) = 0.7$$

$$Score = 0.7 \times (0.7 \times 0.6 + 0.7 \times 0.4) = 0.7 \times (0.42 + 0.28) = 0.7 \times 0.7 = 0.49$$

**→ 🟡 WARNUNG** – Schiff in mittlerer Entfernung, möglicherweise fischend, Temperatur noch im Bereich.

---

**Szenario 3 – False Positive verhindert:** Fischereifahrzeug 500 km entfernt, fährt 2 Knoten, Wassertemperatur 20°C.

$$D = \max\left(0,\; 1 - \frac{500}{100}\right) = 0.0$$

$$Score = 0.0 \times (\text{egal}) = 0.0$$

**→ 🟢 GERING** – Dank der multiplikativen Formel ist der Score sofort 0. In einer rein additiven Formel wäre dieser Score fälschlicherweise 0.53 (WARNING) gewesen.

---

**Szenario 4 – Transit:** Fischereifahrzeug 30 km entfernt, fährt aber 12 Knoten, Wassertemperatur 20°C.

$$D = 0.7, \quad A = 0.0, \quad T = 1.0$$

$$Score = 0.7 \times (0.0 \times 0.6 + 1.0 \times 0.4) = 0.7 \times 0.4 = 0.28$$

**→ 🟢 GERING** – Schiff ist zwar in der Nähe, fährt aber viel zu schnell zum Fischen. Wahrscheinlich Transit.

---

**Szenario 5 – Falsche Temperatur:** Fischereifahrzeug 10 km entfernt, fährt 3 Knoten, aber Wassertemperatur 8°C (Thunfisch-Optimum: 15–25°C).

$$D = 0.9, \quad A = 0.7, \quad T = 0.0$$

$$Score = 0.9 \times (0.7 \times 0.6 + 0.0 \times 0.4) = 0.9 \times 0.42 = 0.378$$

**→ 🟢 GERING** – Schiff ist nah und fischt wahrscheinlich, aber das Wasser ist viel zu kalt für Thunfisch. Die Fische sind hier nicht.

---

## 5. Berechnung der saisonalen Verbreitungszonen

Die Verbreitungszone einer Art pro Monat wird aus OBIS-Sichtungsdaten wie folgt berechnet:

1. Alle historischen Sichtungen der Art aus OBIS abrufen (z.B. über mehrere Jahre)
2. Sichtungen nach **Monat** gruppieren
3. Pro Monat den **Mittelpunkt** berechnen:

$$Lat_{mitte} = \frac{1}{n} \sum_{i=1}^{n} Lat_i \qquad Lng_{mitte} = \frac{1}{n} \sum_{i=1}^{n} Lng_i$$

4. Einen **Radius** definieren (z.B. 200 km für pelagische Arten wie Thunfisch)

Das Ergebnis ist ein **Kreis pro Monat** – die saisonale Verbreitungszone. Die Verschiebung dieser Kreise über die Monate zeigt die grobe saisonale Wanderungsbewegung.

> *Hinweis: OBIS-Daten sind opportunistische Sichtungen, keine systematischen Erhebungen. Deshalb sprechen wir bewusst von „saisonalen Verbreitungszonen" statt von „Migrationsrouten".*

---

## 6. Mehrwert / Warum OceanGuard?

1. **Datenkombination:** Keine der drei APIs allein beantwortet die Kernfrage – erst die Kombination erzeugt neues Wissen
2. **Overlap-Score:** Ein eigener Algorithmus, der aus drei isolierten Datenquellen einen neuen, nicht existierenden Indikator berechnet
3. **Echtzeit + Historisch:** Verbindung von historischen Verbreitungsdaten mit Live-Schiffspositionen
4. **Praxisrelevanz:** Könnte von Naturschutzbehörden, NGOs oder Fischereiaufsicht genutzt werden
5. **Akademisch sauber:** REST-Prinzipien, mindestens zwei externe APIs, klarer Mehrwert durch eigene Berechnung

---

## 7. Fokus-Arten (MVP)

| Art | Wissenschaftl. Name | Region | Opt. Temp. | $T_{mitte}$ | $R$ |
|---|---|---|---|---|---|
| 🐟 Roter Thun | _Thunnus thynnus_ | Mittelmeer / Ostatlantik | 15–25°C | 20°C | 10°C |
| 🐟 Atlantischer Kabeljau | _Gadus morhua_ | Nordsee / Nordatlantik | 2–10°C | 6°C | 9°C |
| 🐟 Sardine | _Sardina pilchardus_ | Europ. Atlantikküste | 10–20°C | 15°C | 10°C |
| 🐟 Schwertfisch | _Xiphias gladius_ | Mittelmeer / Atlantik | 18–28°C | 23°C | 10°C |

**MVP-Start:** Roter Thun (beste Datendichte bei OBIS, hohe Schutzrelevanz).

---

## 8. API-Tests 

### 8.1 OBIS API – Basis-Test

**Request:**

```
GET https://api.obis.org/v3/occurrence?scientificname=Thunnus%20thynnus&size=3
```

**Ergebnis:** Erfolgreich

Die API liefert insgesamt **10.862 Sichtungen** für Roter Thun (_Thunnus thynnus_) weltweit. Ohne Geografie-Filter kommen die Daten primär aus nordamerikanischen Gewässern (New York Bight, Florida East Coast, Gulf of Mexico). Die Response enthält alle Felder, die wir brauchen: `decimalLatitude`, `decimalLongitude`, `eventDate` und `scientificName`. Ein unerwarteter Bonus: OBIS liefert ein `sst`-Feld (Sea Surface Temperature) zum Zeitpunkt der Sichtung mit. Damit können wir unsere artspezifischen Temperaturbereiche validieren – alle drei zurückgegebenen Records hatten SST-Werte zwischen 16.5°C und 27.5°C, was zum bekannten Temperaturprofil des Roten Thuns passt. Auth wird keine benötigt.

### 8.2 OBIS API – Mittelmeer-Filter

**Request:**

```
GET https://api.obis.org/v3/occurrence?scientificname=Thunnus%20thynnus&geometry=POLYGON((-5%2030,36%2030,36%2046,-5%2046,-5%2030))&size=3
```

**Ergebnis:** Erfolgreich

Mit dem WKT-Polygon-Filter auf das Mittelmeer-Gebiet liefert OBIS **836 Sichtungen**. Die zurückgegebenen Records stammen aus dem Catalan Sea (Tarragona), der Adria (Emilia Romagna) und dem östlichen Mittelmeer (Lebanon). Alle drei SST-Werte (18.89°C, 18.94°C, 23.02°C) liegen im Optimalbereich von 15–25°C, was unsere Konfiguration bestätigt.

Eine wichtige Beobachtung zur Datenqualität: Nicht alle Records haben ein exaktes Datum. Manche enthalten nur ein Jahr (z.B. `"1964"`), andere einen Zeitraum (z.B. `"1973-06/1990-12"`). Beim Gruppieren nach Monat müssen wir Records ohne konkreten Monat entweder ignorieren oder gesondert behandeln.

**Nutzung im Projekt:** Wir rufen alle Sichtungen einer Art im Mittelmeer ab, gruppieren sie nach Monat und berechnen daraus den Mittelpunkt + Radius für die saisonale Verbreitungszone. Der `geometry`-Parameter erlaubt uns, die Abfrage auf unsere Zielregion einzuschränken.

### 8.3 Open-Meteo Marine API – Wassertemperatur

**Request:**

```
GET https://marine-api.open-meteo.com/v1/marine?latitude=38.0&longitude=15.0&hourly=sea\_surface\_temperature,wave\_height&forecast\_days=1
```

**Ergebnis:** Erfolgreich

Die API liefert stündliche Meeresbedingungen für den angefragten Punkt im zentralen Mittelmeer (Straße von Messina). Die Wassertemperatur lag am Testtag (27. März 2026) stabil bei **15.2–15.4°C** über den gesamten Tag. Das `wave\_height`-Feld war für diesen Punkt `null` – Wellendaten sind nicht an allen Koordinaten verfügbar, was für uns aber unkritisch ist, da wir primär die SST brauchen.

Zur Validierung unserer Formel: Mit einer aktuellen SST von 15.4°C und den Parametern für Roten Thun (T_mitte = 20°C, R = 10°C) ergibt sich ein Temperatur-Faktor von T = max(0, 1 − |15.4 − 20| / 10) = **0.54**. Das ist plausibel – Ende März ist das Mittelmeer noch kühl, der T-Faktor liegt im mittleren Bereich. Im Sommer steigt die Temperatur und damit der Faktor.

Da die SST über den Tag kaum schwankt, reicht eine Abfrage pro Tag und Region. Auth wird keine benötigt, die Generierungszeit lag bei 0.2ms.

**Nutzung im Projekt:** Wenn unser Backend den Overlap-Score berechnet, fragt es für die Position des Schiffs die aktuelle SST bei Open-Meteo ab und berechnet daraus den Temperatur-Faktor.

### 8.4 AISstream.io – Echtzeit-Schiffspositionen

**Verbindung:**

```
WebSocket wss://stream.aisstream.io/v0/stream
```

**Subscription-Message:**

```json
{
&nbsp;&nbsp;"APIKey": "***ENTFERNT***",
&nbsp;&nbsp;"BoundingBoxes": [[[37, 14], [39, 16]]],
&nbsp;&nbsp;"FilterMessageTypes": ["PositionReport"]
}
```

**Ergebnis:** Erfolgreich

Nach dem Senden der Subscription-Message kamen innerhalb von Sekunden Echtzeit-Positionsdaten von Schiffen im Gebiet der Straße von Messina. Drei Schiffe wurden empfangen: CHRYSANTHEMUM (MMSI 311015300, stehend bei 0.0 kn), GARAGONAY (MMSI 247294400, stehend bei 0.0 kn) und SC CITRINE (MMSI 477138400, mit 10.0 kn unterwegs).

Die Response enthält alle benötigten Felder: Position über `MetaData.latitude`/`longitude`, Schiffsidentifikation über `MetaData.MMSI` und `MetaData.ShipName`, sowie `PositionReport.Sog` (Speed Over Ground) für unseren Aktivitäts-Faktor.

Zur Validierung unserer Formel: CHRYSANTHEMUM mit 0.0 kn ergibt A = max(0, 1 − 0/10) = **1.0** (steht, möglicherweise fischend). SC CITRINE mit 10.0 kn ergibt A = max(0, 1 − 10/10) = **0.0** (Transit, fischt definitiv nicht).

Eine wichtige Entdeckung: Die API liefert ein Feld `NavigationalStatus`, wobei der Wert 7 explizit „Engaged in Fishing" bedeutet. Das können wir zusätzlich zum ShipType-Filter nutzen, um aktiv fischende Schiffe zuverlässiger zu identifizieren.

**Wichtig bei der Implementierung:** Die Subscription-Message muss innerhalb von 3 Sekunden nach dem Verbindungsaufbau gesendet werden, sonst trennt der Server die Verbindung. In Postman war das nicht zuverlässig möglich – der Test wurde erfolgreich mit einem Python-Script (`websockets`-Library) durchgeführt. Außerdem unterstützt AISstream kein CORS, d.h. der WebSocket muss vom Backend konsumiert werden, nicht direkt vom Browser.

**Nutzung im Projekt:** Unser Backend hält eine dauerhafte WebSocket-Verbindung zu AISstream und filtert auf die relevante BoundingBox. Eingehende Positionsdaten werden im Speicher gehalten und dem Frontend über unsere eigene REST-API bereitgestellt.

---

