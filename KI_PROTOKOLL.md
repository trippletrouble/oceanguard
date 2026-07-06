# KI-Nutzungsprotokoll zur Studienarbeit

## Angaben zur Arbeit

- Gruppenname: settima (Antonio, Fadhil, Marina, Naren, Taha)
- Titel der Studienarbeit: OceanGuard — Echtzeit-Überwachung von Fischereifahrzeugen in Fisch-Migrationszonen
- KI genutzt: ja
- Verwendete KI-Werkzeuge: Antigravity, Gemini, ChatGPT, Codex

Wenn keine KI genutzt wurde, reicht hier die Angabe "nein". In diesem Fall müssen die folgenden Abschnitte nicht ausgefüllt werden.

## Kurz-Erklärung

Dieses Protokoll wird als Markdown-Datei im Git-Repository der Gruppe geführt.
Wesentliche KI-Nutzungen werden hier kurz und zeitnah dokumentiert.
Die Nachvollziehbarkeit über Versionen ergibt sich aus der Git-Historie dieser Datei.

Für diese Studienarbeit wurden KI-Werkzeuge methodisch als Unterstützung verwendet. Die wissenschaftliche und konzeptionelle Eigenleistung liegt vollständig bei der Projektgruppe:
- **Architektur & Design:** Die Gesamtarchitektur des Backends, die Spezifikation der API-Endpunkte (OpenAPI), das relationale Datenbankschema sowie die grundlegenden Algorithmen wurden vollständig eigenständig vom Team entworfen.
- **Fachliche Verantwortung:** Alle übernommenen Inhalte und Code-Vorschläge wurden fachlich im Detail geprüft, angepasst, in die Gesamtstruktur integriert und vom Team eigenverantwortlich validiert.
- **Keine Vollautomatisierung:** Die KIs wurden nicht als automatische Code-Generatoren eingesetzt, sondern als Produktivitäts-Assistenten (z. B. für Boilerplate, Unittests und Pydantic-Migrationen) und Sparringspartner.

## Übersicht der KI-Nutzung

Tragen Sie hier die wesentlichen Nutzungen ein.
Wenn ähnliche Nutzungen in engem Zusammenhang stehen, können sie zusammengefasst werden.

> 
> **Hinweis zur Dokumentation von "Prompts":**
> Da wir in diesem Projekt primär mit **agentischen KI-Systemen** (wie Antigravity oder Codex) gearbeitet haben, die autonom über das Projektdateisystem, Mock-Generatoren und Test-Suiten iterierten, entspricht die Spalte "Nutzung kurz beschrieben" *nicht* einzelnen Chat-Prompts.

> Die dort angegebenen "Prompts" sind **stark verkürzte Zusammenfassungen** der komplexen System-Instruktionen, bereitgestellten SSOT-Dateien und Session-Ziele. Die tatsächliche Eingabe bestand aus tiefgehendem Context Engineering und mehrstufigen Feedback-Schleifen.


| Datum | Anwender der KI | Werkzeug | Nutzung kurz beschrieben | Übernahme und Anpassung kurz beschrieben |
| --- | --- | --- | --- | --- |
| Sprint 1 | Fadhil | ChatGPT & Codex | **Ziel:** Anbindung der Open-Meteo API zur Ermittlung der aktuellen Wassertemperatur (SST) an einer gegebenen Koordinate.<br>**Prompt:** Schreibe einen API-Client in Python, der die Open-Meteo-Marine-API abfragt und die Meeresoberflächentemperatur zurückgibt.<br>**Lieferung:** API-Client-Klasse mit HTTP-Anfragen. | **Übernahme:** Grundstruktur des API-Clients übernommen.<br>**Anpassung:** Bereinigung nicht benötigter Parameter (Wave-Height) und Implementierung von Fallbacks für Festland-Koordinaten in `backend/app/services/marine_weather.py`. |
| Sprint 1 | Fadhil | ChatGPT & Codex | **Ziel:** Echtzeit-Filterung von AIS-Schiffsdaten basierend auf geografischen Bounding Boxes der Zonen.<br>**Prompt:** Implementiere eine Filterfunktion für Schiffs-Koordinaten, die prüft, ob sich ein Schiff innerhalb einer Bounding Box befindet.<br>**Lieferung:** Geografische Filterlogik. | **Übernahme:** Mathematischer Ansatz der BBox-Kalkulation übernommen.<br>**Anpassung:** Integration in `routers/vessels.py` inklusive Spezialbehandlung für Grenzüberschreitungen des Anti-Meridians. |
| Sprint 2 | Fadhil | ChatGPT & Codex | **Ziel:** Implementierung von Endpunkten für Benutzer-Favoriten (Lieblings-Fischarten).<br>**Prompt:** Erstelle einen Router `GET /favorites` und `POST /favorites` für gespeicherte Fischarten von Benutzern.<br>**Lieferung:** API-Endpunkte und Pydantic-Schemas. | **Übernahme:** Schnittstellendefinition als Vorlage verwendet.<br>**Anpassung:** Integration der Endpunkte in `routers/favorites.py` unter Einbindung der projektweiten Dependency Injection (`get_db`). |
| Sprint 2 | Fadhil | ChatGPT & Codex | **Ziel:** Erweiterung der Favoriten-Logik auf bevorzugte Meeresregionen/Schutzzonen.<br>**Prompt:** Erstelle Endpunkte und Pydantic-Schemas zum Speichern und Abrufen von bevorzugten geografischen Regionen.<br>**Lieferung:** Router-Erweiterung und Region-Schemas. | **Übernahme:** Datenstrukturen für Geodaten-Schemas übernommen.<br>**Anpassung:** Integration strikter Wertebereichs-Validierungen (-180 bis 180 / -90 bis 90) in die Pydantic-Klassen. |
| Sprint 2 | Fadhil | ChatGPT & Codex | **Ziel:** Erstellung eines Species Report Services zur automatischen Berichtsgenerierung über geschützte Zonen.<br>**Prompt:** Schreibe einen FastAPI-Router `/reports` zum Speichern, Vergleichen und Abrufen von Berichten über Schiffe in geschützten Zonen.<br>**Lieferung:** Endpunkte `POST /reports`, `GET /reports` und `GET /reports/compare` sowie die zugehörigen SQLAlchemy-Modelle. | **Übernahme:** Konzept für JSON-basierte Berichtsstruktur übernommen.<br>**Anpassung:** Implementierung der Endpunkte `/reports` und `/reports/compare` sowie Integration von Benutzer-Berechtigungsprüfungen. PDF-Export wurde nicht umgesetzt. |
| Sprint 3 | Fadhil | ChatGPT & Codex | **Ziel:** Optimierung der Ladezeit von Routen im Haupt-Router und Behebung von Datenbank-Zirkelbezügen.<br>**Prompt:** Analysiere langsame Ladezeiten bei verschachtelten Abfragen in FastAPI und SQLAlchemy. Wie können N+1 Queries gelöst werden?<br>**Lieferung:** Empfehlungen für Eager Loading mittels `joinedload`. | **Übernahme:** Optimierungsvorschlag zur Vermeidung von N+1 Queries übernommen.<br>**Anpassung:** Anpassung betroffener SQLAlchemy-Queries in `backend/app/main.py` auf Eager Loading mittels `joinedload`. |
| Sprint 1 | Marina | Gemini | **Ziel:** Entwicklung der mathematischen Risikobewertung (Risk Score Logic) für Schiffe in Migrationszonen.<br>**Prompt:** Entwirf eine Formel zur Berechnung der Gefährdung eines Schiffes basierend auf Distanz zur Zone (D), Geschwindigkeit (A) und Meerestemperatur (T).<br>**Lieferung:** Mathematischer Entwurf (additives Modell) und Python-Code zur Berechnung. | **Übernahme:** Risikoberechnungsansatz als Entwurf übernommen.<br>**Anpassung:** Umwandlung der Formel in ein multiplikatives Modell (Radius als Gatekeeper) in `services/overlap_service.py`. |
| Sprint 2 | Marina | Gemini | **Ziel:** Berechnung mehrerer geografischer Zentrum-Punkte (Hotspots) statt nur eines einzigen Mittelpunkts pro Fischart basierend auf OBIS-Daten.<br>**Prompt:** Ändere die Mittelpunktberechnung so ab, dass Ausreißer gefiltert werden und mehrere Cluster-Zentren für das Vorkommen berechnet werden.<br>**Lieferung:** Python-Code mit K-Means-Clustering and geografischer Filterung. | **Übernahme:** K-Means-Clustering-Ansatz als Basis übernommen.<br>**Anpassung:** Anpassung der Gewichtung zur geografischen Bereinigung von Ausreißern im Atlantik in `services/obis_service.py`. |
| Sprint 2 | Marina | Gemini | **Ziel:** Endpunkt für Echtzeit-Warnungen (Alerts) implementieren, der gefährdete Gebiete und Schiffe zurückgibt.<br>**Prompt:** Erstelle einen FastAPI-Router `GET /alerts`, der Schiffe mit einem Risk Score > 0.7 liefert, inklusive DB-Join mit Zonen.<br>**Lieferung:** Router-Klasse mit SQL-Abfrage. | **Übernahme:** Struktur der SQL-Abfrage übernommen.<br>**Anpassung:** Erweiterung der Route `GET /alerts` um dynamische Query-Parameter und zeitbasierte Filter. |
| Sprint 2 | Marina | Gemini | **Ziel:** Entwicklung einer Reihe von Unit-Tests für den Overlap-Berechnungs-Service.<br>**Prompt:** Generiere 10 Unit-Tests für `compute_overlap` mit verschiedenen Schiffsparametern (SOG, Position, SST) und gemockten Services.<br>**Lieferung:** Test-Suite mit pytest und Mock-Klassen. | **Übernahme:** pytest-Grundgerüst der Tests übernommen.<br>**Anpassung:** Anpassung und Parametrisierung aller Mock-Daten in `tests/test_overlap.py` zur Überprüfung der Score-Grenzwerte. |
| Sprint 3 | Marina | Gemini | **Ziel:** Verbesserung der Fehlertoleranz und des Error-Handlings bei Anfragen an die externe OBIS-API.<br>**Prompt:** Implementiere robustes Error-Handling für OBIS-API-Timeouts und ungültige JSON-Antworten. Verwende Fallbacks.<br>**Lieferung:** Try-Except-Blöcke mit Default-Werten für Wassertemperaturen (z.B. 15°C). | **Übernahme:** Fehlerbehandlungsschema für API-Ausfälle übernommen.<br>**Anpassung:** Implementierung von Try-Except-Blöcke mit Temperatur-Fallbacks und Logging in `services/obis_service.py`. |
| Sprint 1 | Naren | Antigravity | **Ziel:** Erstellung der ersten DB-Models, Tabellenstrukturen und des SQLAlchemy-ORM-Setups für Fischarten.<br>**Prompt:** Generiere SQLAlchemy-Modelle für `Species` mit Attributen für Namen, wissenschaftlichen Namen, Standard-Radius und Wassertemperatur-Grenzwerte.<br>**Lieferung:** Vollständige Python-Klassendefinitionen für SQLAlchemy. | **Übernahme:** Tabellenschema als Vorlage übernommen.<br>**Anpassung:** Integration in `models/species.py` inklusive Definition von Unique Constraints und des `active`-Flags für Soft-Delete. |
| Sprint 2 | Naren | Antigravity | **Ziel:** Implementierung der admin-exklusiven CRUD-Endpunkte für die Fischarten-Verwaltung inklusive Validierung.<br>**Prompt:** Erstelle FastAPI-Router für `POST /species`, `PUT`, `PATCH` und `DELETE`. Integriere Pydantic-Validierung für Wassertemperaturen (min < max) und Soft-Delete.<br>**Lieferung:** Vollständige Endpunkte mit Pydantic-Schemas. | **Übernahme:** Grundstruktur des CRUD-Routers übernommen.<br>**Anpassung:** Implementierung der Validierungslogik in `routers/species.py` und Zuweisung korrekter HTTP-Statuscodes (409/422). |
| Sprint 3 | Naren | Antigravity | **Ziel:** Erstellung einer FastAPI-Integrations-Testsuite mit transaktionalen Datenbanksitzungen und Mocking.<br>**Prompt:** Generiere ein pytest-Setup für FastAPI, das nach jedem Test einen Rollback der DB-Transaktion durchführt, und Mocks für Firebase-Auth.<br>**Lieferung:** Eine `conftest.py` und mehrere Testfälle unter `app/tests/`. | **Übernahme:** pytest-Konfiguration (`conftest.py`) als Framework-Basis verwendet.<br>**Anpassung:** Implementierung der konkreten Integrations-Testfälle sowie der transaktionalen DB-Session-Fixtures. |
| Sprint 3 | Naren | Antigravity | **Ziel:** OpenAPI/Swagger Dokumentation und Anreicherung aller API-Endpunkte mit klaren Metadaten.<br>**Prompt:** Füge OpenAPI-Beschreibungen, Swagger-Tags und Antwort-Modell-Beschreibungen zu allen FastAPI-Routern hinzu.<br>**Lieferung:** Detaillierte docstrings und Pydantic `Field`-Konfigurationen. | **Übernahme:** Empfohlene Bezeichner und Strukturierungsvorschläge übernommen.<br>**Anpassung:** Integration detaillierter docstrings und OpenAPI-Beschreibungen in den Routern. |
| Sprint 4 | Naren | Antigravity | **Ziel:** Migration des gesamten Pydantic-Codes von v1 auf v2, um Deprecation-Warnings im Backend zu beseitigen.<br>**Prompt:** Migriere diese Pydantic-Schemas von v1 auf v2. Ersetze `class Config` durch `model_config = ConfigDict(...)` und passe Validatoren an.<br>**Lieferung:** Aktualisierte Schemadateien für Species, Favorites, Reports und Alerts. | **Übernahme:** Syntaxänderungen für Pydantic v2 übernommen.<br>**Anpassung:** Behebung fehlerhafter Importpfade und Anpassung der benutzerdefinierten Validatoren in allen Schemadateien. |
| Sprint 4 | Naren | Antigravity | **Ziel:** ETag-basiertes Caching zur Lastreduktion für Species-Endpunkte.<br>**Prompt:** Implementiere ETag-Caching für GET-Anfragen der Species-Endpunkte, um redundante Datenübertragungen zu vermeiden.<br>**Lieferung:** Konzeptentwurf für HTTP-Caching-Header. | **Übernahme:** Konzept für HTTP-Caching übernommen.<br>**Anpassung:** Entwurf des ETag-Hashing-Verfahrens für die GET-Schnittstellen zur Entlastung der Netzwerkübertragung. |
| Sprint 4 | Taha | Gemini | **Ziel:** HATEOAS-Verlinkungen (Hypermedia) für Species-Endpunkte.<br>**Prompt:** Generiere HATEOAS-Links (self, migration, vessels, overlap, alerts) zur Species-Response zur Erhöhung des REST-Reifegrads.<br>**Lieferung:** Strukturvorschläge für HATEOAS-Links. | **Übernahme:** Entwurf für Hypermedia-Link-Relationen übernommen.<br>**Anpassung:** Implementierung der HATEOAS-Modelle in `schemas/species.py` und dynamische Generierung in `routers/species.py` basierend auf dem eingehenden Request. |

## Optionale ergänzende Hinweise

Hier können Sie bei Bedarf kurz ergänzen,

- **Umgang mit fehlerhaften KI-Antworten:** Bei fehlerhaften Code-Generierungen (z. B. falschen Pydantic-Importen, Fehlern bei Grenzüberschreitungen des Anti-Meridians oder unvollständigen SQLAlchemy-Abfragen) wurden Fehlermeldungen und Compiler-Warnungen direkt an die KIs zurückgespeist, um diese iterativ korrigieren zu lassen. Alle Fehler wurden durch eigene Logik-Reviews behoben.
- **Bewusst verworfene Vorschläge:** Vorschläge zur Erstellung komplexer PDF-Berichtsgenerierungen (ReportLab) oder generischer, überladener Caching-Schichten wurden im Sinne des YAGNI-Prinzips (Keep It Simple) abgelehnt. Die Implementierung wurde bewusst auf das Nötigste reduziert.
- **KI als Sparringspartner (Brainstorming & Verifikation):** In vielen Situationen wurden KIs primär als Sparringspartner zur Validierung unserer eigenen Ideen genutzt, ohne Code zu übernehmen. Beispiele hierfür sind: die mathematische Herleitung des multiplikativen Overlap-Scores (zur Verhinderung von Ausreißereffekten außerhalb des Migrationsradius), die Strukturierung geografischer Bounding-Box-Kalkulationen oder die Konzeptionierung der Firebase-Rollenhierarchie.


## Eigenständigkeit und Verantwortung

Wir bestätigen, dass die KI-Nutzung in dieser Arbeit vollständig und nach bestem Wissen dokumentiert wurde.
Wir übernehmen die Verantwortung für die fachliche Richtigkeit, die Auswahl der übernommenen Inhalte und die gesamte abgegebene Arbeit.

- Datum: 01.07.2026
- Gruppenname: settima (Antonio, Fadhil, Marina, Naren, Taha)

---

## Detaillierte methodische Einordnung: Context Engineering & Harness Engineering statt Prompt Engineering

Unser KI-Einsatz basiert nicht auf Prompt Engineering — also dem Optimieren einzelner Anfragen an ein Sprachmodell. Wir haben mit **agentischen KI-Tools** gearbeitet, die eigenständig Dateien lesen, Code schreiben, Tests ausführen und iterieren. Bei dieser Arbeitsweise verschieben sich die Hebel:

| Ebene | Was es bedeutet | Unser Werkzeug |
|---|---|---|
| **Context Engineering** | Kuratieren, *welche* Information der Agent bekommt, in *welcher* Struktur, damit er autonom korrekte Entscheidungen trifft. Nicht „gib der KI mehr Infos", sondern: baue ein Informationssystem, das der Agent navigieren kann. | **SSOT.md** (Projektgedächtnis), **SPRINT_PLAN.md** (Aufgabensteuerung), **modulare Skills** (on-demand Fachwissen) |
| **Harness Engineering** | Persistente Verhaltensschranken, die den Agenten *eingrenzen* — unabhängig von der konkreten Aufgabe. Der Agent arbeitet innerhalb definierter Leitplanken, statt frei zu generieren. | **AGENTS.md** (vier Prinzipien), **4-Phasen-Workflow**, **„Search Before Coding"-Pflicht**, **Implementierungsplan → Tasks.md** |

Der Unterschied: Prompt Engineering optimiert eine einzelne Frage. Context & Harness Engineering bauen das **Betriebssystem**, in dem der Agent arbeitet. Die Qualität jeder einzelnen Interaktion steigt, ohne dass man jedes Mal die Frage perfektionieren muss.

---

## Context Engineering: Das Informationssystem des Agenten

### SSOT.md — Das Projektgedächtnis

Die SSOT is das zentrale Kontextdokument, das dem Agenten bei jeder Session zur Verfügung steht. Sie löst das Kernproblem agentischer KI — fehlendes Langzeitgedächtnis — nicht durch Wiederholung, sondern durch **Struktur**.

Jeder Eintrag in der SSOT existiert, weil er ein konkretes Fehlverhalten des Agenten verhindert:

| SSOT-Eintrag | Verhindert |
|---|---|
| Tech-Stack mit exakten Versionen (z. B. Pydantic 2.13.1) | Agent generiert Code für veraltete API (Pydantic v1 `class Config` statt v2 `ConfigDict`) |
| Vollständiger Dateibaum mit ✅-Markierungen | Agent erstellt Dateien, die bereits existieren, oder legt Code am falschen Ort ab |
| Overlap-Score-Formel mit allen Variablen und Grenzwerten | Agent implementiert eigene Interpretation der Formel statt der spezifizierten |
| Entscheidungslog mit Begründungen („Firebase statt eigenem JWT — weil…") | Agent schlägt bereits verworfene Alternativen erneut vor |
| Key-Signaturen aller Services | Agent rät Funktionssignaturen statt bestehende korrekt aufzurufen |
| Häufige Fehler & Lösungen | Agent wiederholt bereits gelöste Probleme |

**Aktualisierungszyklus:** Nach jedem Sprint-Abschluss. Die SSOT ist ein lebendes Dokument — ihr Wert liegt darin, dass sie immer den aktuellen Stand reflektiert.

### Sprint-Plan — Aufgabenkontext

Während die SSOT den Ist-Zustand beschreibt, liefert der Sprint-Plan den **Aufgabenkontext**: Wer ist für welchen Task verantwortlich, welche Abhängigkeiten bestehen, welche Änderungen gegenüber dem ursprünglichen Plan vorgenommen wurden. Der Agent sieht dadurch nicht nur *was existiert*, sondern auch *was als nächstes kommen soll* und *was sich geändert hat*.

Besonders relevant: Die Tabelle „Änderungen gegenüber altem Plan" (z. B. Score-Formel von additiv auf multiplikativ, `month`-Parameter von required auf optional). Ohne diese Information würde der Agent in späteren Sprints nach der alten Spezifikation implementieren.

### Modulare Skills — On-Demand Fachwissen

Skills sind spezialisierte Kontextdokumente im Ordner `.agents/skills/`, die **bedarfsgesteuert** geladen werden. Sie halten die SSOT schlank und geben dem Agenten nur dann Detailwissen, wenn er es tatsächlich braucht.

**`backend-architecture`** — Enthält die exakten Code-Patterns für Router, Schemas und Services. Löst das Problem, dass fünf Entwickler mit demselben Agenten unterschiedlich strukturierten Code bekommen. Egal ob Naren den Species-CRUD oder Fadhil den Favorites-Router baut — der Agent folgt denselben Architektur-Mustern, weil beide denselben Skill laden.

**`backend-testing`** — Definiert Testmuster und Mocking-Standards. Jede Score-Komponente (D, A, T) wird einzeln geprüft, nicht nur das Gesamtergebnis. Externe APIs werden immer gemockt. Der Skill enthält konkrete Beispieltests mit Erwartungswerten:

```python
@patch('app.services.overlap_service.calculate_haversine', return_value=25.0)
def test_overlap_warning_scenario(mock_haversine):
    vessel = {"lat": 45.2, "lng": -1.0, "sog": 2.0, "mmsi": 11111, "name": "Fisher"}
    r = compute_single_score(vessel, mock_zone, 15.0, MockSpecies())

    assert r["D"] == 0.75   # 1.0 - (25.0 / 100.0)
    assert r["A"] == 0.8    # 1.0 - (2.0 / 10.0)
    assert r["T"] == 1.0    # 1.0 - (|15 - 15| / 5)
```

**`cocoindex-workflow`** — Verbindet semantische Codebase-Suche mit dem „Search Before Coding"-Prinzip (siehe Harness, unten). Enthält die CLI-Referenz für `ccc search` (semantische Vektorsuche) und `ccc grep` (AST-basierte Struktursuche).

---

## Harness Engineering: Die Leitplanken des Agenten

### Die vier Prinzipien aus AGENTS.md

Die AGENTS.md definiert Verhaltensregeln, die **unabhängig von der konkreten Aufgabe** greifen. Sie sind das Gegenstück zum Context Engineering: Während der Kontext bestimmt, *was der Agent weiß*, bestimmt der Harness, *wie der Agent sich verhält*.

**Prinzip 1 — Think Before Coding:**
Der Agent darf nicht raten. Bei Unklarheiten muss er fragen, bei Mehrdeutigkeit alle Optionen benennen, bei Overengineering pushbacken.

> *Auswirkung im Projekt:* Der Agent hat bei der Overlap-Score-Implementierung nachgefragt, ob D additiv oder multiplikativ wirken soll. Das hat zur bewussten Entscheidung für das multiplikative Modell geführt — D als Gatekeeper: Schiff außerhalb des Radius → Score sofort 0.

**Prinzip 2 — Simplicity First:**
Minimaler Code, der das Problem löst. Kein spekulatives Feature, keine Abstraktion für Einmal-Code. Selbsttest: *„Würde ein Senior Engineer sagen, das ist overcomplicated?"*

> *Auswirkung im Projekt:* Der Agent wollte eine generische Cache-Klasse mit konfigurierbarer Eviction-Policy bauen. Nach Anwendung des Prinzips: ein simples Python-Dict mit Timestamp-Check und 24h-TTL — 15 Zeilen statt 80.

**Prinzip 3 — Surgical Changes:**
Der Agent darf nur Code anfassen, der direkt mit der aktuellen Aufgabe zusammenhängt. Kein „Aufräumen" von Nachbar-Code, kein Refactoring von funktionierendem Code.

> *Auswirkung im Projekt:* Bei der BBox-Filterung hat der Agent ausschließlich den Vessels-Router angepasst. Der AIS-Service blieb unangetastet, obwohl Optimierungspotenzial erkannt wurde — das wurde als separater Hinweis kommuniziert. In einem 5-Personen-Team, das parallel arbeitet, verhindert das Merge-Konflikte.

**Prinzip 4 — Goal-Driven Execution:**
Jede Aufgabe wird in überprüfbare Ziele umformuliert. Der Agent arbeitet in Schleifen, bis die Erfolgskriterien erfüllt sind.

> *Auswirkung im Projekt:* Statt „Implementiere den Favorites-Router" arbeitet der Agent mit: Schema erstellen → verify: Pydantic validiert; Router implementieren → verify: Swagger zeigt Endpoints; Tests schreiben → verify: 409 bei Duplikaten, 204 bei Delete, 33/33 Tests grün.

### Implementierungsplan → Tasks.md: Vom Plan zur kontrollierten Ausführung

Bevor der Agent eine Zeile Code schreibt, wird ein **Implementierungsplan** erstellt — entweder vom Entwickler oder gemeinsam mit dem Agenten. Dieser Plan wird dann in eine `Tasks.md` überführt: eine Checkliste, die der Agent während der Ausführung Schritt für Schritt abhakt.

Der Ablauf:

```
1. Entwickler definiert das Ziel und die Rahmenbedingungen
2. Agent erstellt einen Implementierungsplan mit konkreten Schritten
3. Entwickler reviewt und korrigiert den Plan (Human in the Loop)
4. Agent überführt den Plan in eine Tasks.md mit Checkboxen
5. Agent arbeitet die Tasks sequenziell ab, hakt jeden Schritt ab
6. Entwickler prüft nach jedem kritischen Schritt das Ergebnis
```

**Beispiel Tasks.md** (gekürzt, Overlap-Service Sprint 2):

```markdown
## Implementierung: Overlap-Service (M-2.1)

- [x] `compute_single_score()` implementieren (Formel aus SSOT §8)
- [x] Fallback T=0.5 bei fehlendem SST einbauen
- [x] `get_best_evaluation_for_vessel()` — Turnier über alle Zonen
- [x] `compute_overlap()` — Orchestrierung: Vessels holen, SST cachen, Scores berechnen
- [x] Unit-Tests: CRITICAL (>0.7), WARNING (0.4–0.7), LOW (<0.4)
- [x] Unit-Test: Fallback T=0.5
- [x] Unit-Test: Schiff außerhalb Radius → Score = 0
- [x] Bestehende Tests laufen weiterhin grün (33/33)
```

Der Wert dieses Musters: Der Agent arbeitet nicht frei assoziativ, sondern folgt einem **vorab genehmigten Plan**. Wenn er bei Schritt 4 von 8 ist und etwas Unerwartetes auftaucht, eskaliert er — statt eigenmächtig den Plan zu ändern. Die Tasks.md dient gleichzeitig als Dokumentation: Man sieht im Nachhinein exakt, welche Schritte der Agent ausgeführt hat.

### Human in the Loop: Kontrolle an den richtigen Stellen

Agentische KI kann autonom arbeiten — das heißt aber nicht, dass sie es immer *soll*. Unser Workflow setzt **Human in the Loop** an den Stellen ein, an denen menschliches Urteil den größten Unterschied macht:

**Vor der Ausführung — Planfreigabe:**
Der Agent erstellt den Implementierungsplan und die Tasks.md, aber der Entwickler gibt sie frei. Hier werden falsche Annahmen, überflüssige Schritte und fehlende Edge-Cases abgefangen, *bevor* Code geschrieben wird. Das ist den effizienteste Eingriffspunkt: eine Korrektur im Plan kostet Sekunden, eine Korrektur im fertigen Code kostet Minuten bis Stunden.

**Während der Ausführung — Checkpoints bei kritischen Entscheidungen:**
Der Agent arbeitet die Tasks.md eigenständig ab, aber bei Architektur-Entscheidungen, Schnittstellen-Änderungen oder unerwarteten Fehlern pausiert er und fragt den Entwickler. Beispiele:
- Der Agent stößt auf eine Inkonsistenz zwischen SSOT und bestehendem Code → er fragt, welche Version gilt, statt selbst zu entscheiden.
- Der Agent erkennt, dass ein Task Auswirkungen auf einen anderen Router hat → er meldet das, statt den Nachbar-Code eigenständig zu ändern (Surgical Changes).
- Ein Test schlägt fehl, aber die Ursache liegt außerhalb des aktuellen Tasks → der Agent eskaliert statt zu patchen.

**Nach der Ausführung — Code-Review:**
Jeder vom Agenten geschriebene Code wird vom verantwortlichen Entwickler gelesen, verstanden und erst dann committed. Das ist keine Formalie: der Entwickler muss den Code erklären können, als hätte er ihn selbst geschrieben. Die Tests (33/33 grün) sind eine notwendige, aber keine hinreichende Bedingung — sie beweisen Korrektheit, nicht Verständnis.

**Das Zusammenspiel:**

```
  Mensch                          Agent
    │                               │
    │  1. Ziel + Rahmenbedingungen  │
    │ ─────────────────────────────▶│
    │                               │  2. Erstellt Implementierungsplan
    │  3. Review & Freigabe des     │◀─────────────────────────────────
    │     Plans (oder Korrektur)    │
    │ ─────────────────────────────▶│
    │                               │  4. Überführt in Tasks.md
    │                               │  5. Arbeitet Tasks ab ✅ ✅ ✅
    │                               │
    │  6. Checkpoint: Agent fragt   │◀── (bei Unklarheit / Entscheidung)
    │     Entwickler                │
    │ ─────────────────────────────▶│
    │                               │  7. Fährt fort ✅ ✅
    │                               │
    │  8. Code-Review & Commit      │◀── (alle Tasks abgehakt)
    │                               │
```

Dieses Modell gibt dem Agenten maximale Autonomie bei der Ausführung, behält aber die Kontrolle über **was** gemacht wird (Planfreigabe), **wie** auf Unerwartetes reagiert wird (Checkpoints) und **ob** das Ergebnis akzeptiert wird (Review).

### Der 4-Phasen-Zyklus

Die Prinzipien, der Implementierungsplan und die Human-in-the-Loop-Checkpoints sind in einen konkreten Arbeitszyklus eingebettet:

```
   Phase 1: ANALYSE             Phase 2: FILTER
   ccc search / ccc status      YAGNI? Gibt es schon?
   „Wo lebt das Thema?"    ──▶  Kann es kleiner sein?
                                         │
                                         ▼
   Phase 4: TESTEN              Phase 3: IMPLEMENTIEREN
   ccc grep: alle Aufrufer      Implementierungsplan erstellen
   backend-testing Skill   ◀──  → Human Review → Tasks.md
   pytest → 33/33 grün          → Agent arbeitet ab
            │
            ▼
      Erfolgreich? ──NEIN──▶ zurück zu Phase 1
            │
           JA → SSOT + Sprint-Plan aktualisieren
```

### „Search Before Coding" als Harness-Constraint

Eine zentrale Leitplanke: **Bevor der Agent eine Funktion schreibt, muss er prüfen, ob ähnliche Logik bereits existiert.** Das ist kein Vorschlag, sondern eine Pflicht im Harness.

In unserem Projekt hat das z. B. verhindert, dass die Haversine-Distanzberechnung doppelt implementiert wird — einmal in `utils/haversine.py` und potenziell nochmal inline im Overlap-Service. CocoIndex findet solche Duplikate semantisch: `ccc search "distance calculation"` findet `calculate_haversine()`, auch wenn die Suchbegriffe nicht im Funktionsnamen vorkommen.

| AGENTS.md-Prinzip | CocoIndex-Unterstützung |
|---|---|
| Surgical Changes | `ccc grep 'calculate_haversine'` → findet alle Aufrufer → nur minimale Zeilen werden geändert |
| Simplicity First | `ccc search "distance"` → existiert schon → wiederverwenden statt neu schreiben |
| Think Before Coding | `ccc status` → Codebase-Überblick → Agent versteht Kontext vor dem ersten Edit |

---

## Bewusst vermiedene Anti-Patterns

| Anti-Pattern | Unsere Lösung |
|---|---|
| **Agent ohne Kontext arbeiten lassen** | SSOT + Sprint-Plan als strukturiertes Informationssystem (Context Engineering) |
| **Keine Verhaltensschranken setzen** | AGENTS.md mit vier Prinzipien + 4-Phasen-Zyklus (Harness Engineering) |
| **Agent-Output blind übernehmen** | Goal-Driven Execution: Agent iteriert bis Erfolgskriterien erfüllt, dann Team-Review |
| **Gesamte Codebase als Kontext** | On-Demand-Skills + CocoIndex-Suche: Agent bekommt nur, was er für die aktuelle Aufgabe braucht |
| **Jeder Entwickler eigene KI-Gewohnheiten** | Geteilte Skills erzwingen einheitliche Architektur- und Testmuster über alle fünf Teammitglieder |
| **Agent „räumt aufräumt" und bricht Nachbar-Code** | Surgical Changes als Harness-Prinzip: Agent darf nur Dateien anfassen, die direkt zur Aufgabe gehören |
| **Agent arbeitet ohne nachvollziehbaren Plan** | Implementierungsplan → Tasks.md: jeder Schritt dokumentiert und abhakbar |

---

## Ergebnisse

33/33 Tests grün. 18 REST-Endpoints implementiert und dokumentiert. 4 Sprints termingerecht abgeschlossen. 0 Pydantic-Deprecation-Warnings. 3 externe Services (OBIS, AISstream, Open-Meteo) stabil angebunden.

Die KI hat keinen Code geschrieben, den wir nicht verstehen. Jedes Teammitglied kann seinen Code erklären, debuggen und erweitern — der Agent has die Umsetzung beschleunigt, aber die Verantwortung liegt beim Team.

---

## Anhang: Dateistruktur des Agenten-Frameworks

```
.agents/
├── AGENTS.md                        ← Harness: Vier Prinzipien + Workflow-Zyklus
├── design_plan.md                   ← UI/Styling-Richtlinien
└── skills/                          ← Context: On-Demand Fachwissen
    ├── backend-architecture/
    │   └── SKILL.md                 ← Code-Patterns für Router, Schemas, Services
    ├── backend-testing/
    │   └── SKILL.md                 ← Testmuster, Mocking-Standards, Beispieltests
    └── cocoindex-workflow/
        └── SKILL.md                 ← Semantische Suche & „Search Before Coding"
```

---

*Erstellt am 01.07.2026 — OceanGuard KI-Protokoll, Sprints 1–4.*
