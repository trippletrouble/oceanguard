# KI-Protokoll — OceanGuard

**Projekt:** OceanGuard — Echtzeit-Überwachung von Fischereifahrzeugen in Fisch-Migrationszonen  
**Team:** Naren, Marina, Fadhil (3 Personen, Backend-Fokus)  
**Modul:** REST-basierte Web Services (Studienarbeit)  
**Zeitraum:** 13. April – 09. Juli 2026  
**KI-Tooling:** Agentische KI-Assistenten (Claude Code, Antigravity, Codex), CocoIndex-Code, Ponytail

---

## 1. Einordnung: Context Engineering & Harness Engineering statt Prompt Engineering

Unser KI-Einsatz basiert nicht auf Prompt Engineering — also dem Optimieren einzelner Anfragen an ein Sprachmodell. Wir haben mit **agentischen KI-Tools** gearbeitet, die eigenständig Dateien lesen, Code schreiben, Tests ausführen und iterieren. Bei dieser Arbeitsweise verschieben sich die Hebel:

| Ebene | Was es bedeutet | Unser Werkzeug |
|---|---|---|
| **Context Engineering** | Kuratieren, *welche* Information der Agent bekommt, in *welcher* Struktur, damit er autonom korrekte Entscheidungen trifft. Nicht „gib der KI mehr Infos", sondern: baue ein Informationssystem, das der Agent navigieren kann. | **SSOT.md** (Projektgedächtnis), **SPRINT_PLAN.md** (Aufgabensteuerung), **modulare Skills** (on-demand Fachwissen) |
| **Harness Engineering** | Persistente Verhaltensschranken, die den Agenten *eingrenzen* — unabhängig von der konkreten Aufgabe. Der Agent arbeitet innerhalb definierter Leitplanken, statt frei zu generieren. | **AGENTS.md** (vier Prinzipien), **4-Phasen-Workflow**, **„Search Before Coding"-Pflicht**, **Implementierungsplan → Tasks.md** |

Der Unterschied: Prompt Engineering optimiert eine einzelne Frage. Context & Harness Engineering bauen das **Betriebssystem**, in dem der Agent arbeitet. Die Qualität jeder einzelnen Interaktion steigt, ohne dass man jedes Mal die Frage perfektionieren muss.

---

## 2. Context Engineering: Das Informationssystem des Agenten

### 2.1 SSOT.md — Das Projektgedächtnis

Die SSOT ist das zentrale Kontextdokument, das dem Agenten bei jeder Session zur Verfügung steht. Sie löst das Kernproblem agentischer KI — fehlendes Langzeitgedächtnis — nicht durch Wiederholung, sondern durch **Struktur**.

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

### 2.2 Sprint-Plan — Aufgabenkontext

Während die SSOT den Ist-Zustand beschreibt, liefert der Sprint-Plan den **Aufgabenkontext**: Wer ist für welchen Task verantwortlich, welche Abhängigkeiten bestehen, welche Änderungen gegenüber dem ursprünglichen Plan vorgenommen wurden. Der Agent sieht dadurch nicht nur *was existiert*, sondern auch *was als nächstes kommen soll* und *was sich geändert hat*.

Besonders relevant: Die Tabelle „Änderungen gegenüber altem Plan" (z. B. Score-Formel von additiv auf multiplikativ, `month`-Parameter von required auf optional). Ohne diese Information würde der Agent in späteren Sprints nach der alten Spezifikation implementieren.

### 2.3 Modulare Skills — On-Demand Fachwissen

Skills sind spezialisierte Kontextdokumente im Ordner `.agents/skills/`, die **bedarfsgesteuert** geladen werden. Sie halten die SSOT schlank und geben dem Agenten nur dann Detailwissen, wenn er es tatsächlich braucht.

**`backend-architecture`** — Enthält die exakten Code-Patterns für Router, Schemas und Services. Löst das Problem, dass drei Entwickler mit demselben Agenten unterschiedlich strukturierten Code bekommen. Egal ob Naren den Species-CRUD oder Fadhil den Favorites-Router baut — der Agent folgt denselben Architektur-Mustern, weil beide denselben Skill laden.

**`backend-testing`** — Definiert Testmuster und Mocking-Standards. Jede Score-Komponente (D, A, T) wird einzeln geprüft, nicht nur das Gesamtergebnis. Externe APIs werden immer gemockt. Der Skill enthält konkrete Beispieltests mit Erwartungswerten:

```python
@patch('app.services.overlap_service.calculate_haversine', return_value=25.0)
def test_overlap_warning_scenario(mock_haversine):
    vessel = {"lat": 45.2, "lng": -1.0, "sog": 2.0, "mmsi": 11111, "name": "Fisher"}
    r = compute_single_score(vessel, mock_zone, 15.0, MockSpecies())

    assert r["D"] == 0.75   # 1.0 - (25.0 / 100.0)
    assert r["A"] == 0.8    # 1.0 - (2.0 / 10.0)
    assert r["T"] == 1.0    # 1.0 - (|15 - 15| / 5)
    assert r["level"] == "WARNING"
```

**`cocoindex-workflow`** — Verbindet semantische Codebase-Suche mit dem „Search Before Coding"-Prinzip (siehe Harness, Abschnitt 3). Enthält die CLI-Referenz für `ccc search` (semantische Vektorsuche) und `ccc grep` (AST-basierte Struktursuche).

---

## 3. Harness Engineering: Die Leitplanken des Agenten

### 3.1 Die vier Prinzipien aus AGENTS.md

Die AGENTS.md definiert Verhaltensregeln, die **unabhängig von der konkreten Aufgabe** greifen. Sie sind das Gegenstück zum Context Engineering: Während der Kontext bestimmt, *was der Agent weiß*, bestimmt der Harness, *wie der Agent sich verhält*.

**Prinzip 1 — Think Before Coding:**
Der Agent darf nicht raten. Bei Unklarheiten muss er fragen, bei Mehrdeutigkeit alle Optionen benennen, bei Overengineering pushbacken.

> *Auswirkung im Projekt:* Der Agent hat bei der Overlap-Score-Implementierung nachgefragt, ob D additiv oder multiplikativ wirken soll. Das hat zur bewussten Entscheidung für das multiplikative Modell geführt — D als Gatekeeper: Schiff außerhalb des Radius → Score sofort 0.

**Prinzip 2 — Simplicity First:**
Minimaler Code, der das Problem löst. Kein spekulatives Feature, keine Abstraktion für Einmal-Code. Selbsttest: *„Würde ein Senior Engineer sagen, das ist overcomplicated?"*

> *Auswirkung im Projekt:* Der Agent wollte eine generische Cache-Klasse mit konfigurierbarer Eviction-Policy bauen. Nach Anwendung des Prinzips: ein simples Python-Dict mit Timestamp-Check und 24h-TTL — 15 Zeilen statt 80.

**Prinzip 3 — Surgical Changes:**
Der Agent darf nur Code anfassen, der direkt mit der aktuellen Aufgabe zusammenhängt. Kein „Aufräumen" von Nachbar-Code, kein Refactoring von funktionierendem Code.

> *Auswirkung im Projekt:* Bei der BBox-Filterung hat der Agent ausschließlich den Vessels-Router angepasst. Der AIS-Service blieb unangetastet, obwohl Optimierungspotenzial erkannt wurde — das wurde als separater Hinweis kommuniziert. In einem 3-Personen-Team, das parallel arbeitet, verhindert das Merge-Konflikte.

**Prinzip 4 — Goal-Driven Execution:**
Jede Aufgabe wird in überprüfbare Ziele umformuliert. Der Agent arbeitet in Schleifen, bis die Erfolgskriterien erfüllt sind.

> *Auswirkung im Projekt:* Statt „Implementiere den Favorites-Router" arbeitet der Agent mit: Schema erstellen → verify: Pydantic validiert; Router implementieren → verify: Swagger zeigt Endpoints; Tests schreiben → verify: 409 bei Duplikaten, 204 bei Delete, 33/33 Tests grün.

### 3.2 Implementierungsplan → Tasks.md: Vom Plan zur kontrollierten Ausführung

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

### 3.3 Human in the Loop: Kontrolle an den richtigen Stellen

Agentische KI kann autonom arbeiten — das heißt aber nicht, dass sie es immer *soll*. Unser Workflow setzt **Human in the Loop** an den Stellen ein, an denen menschliches Urteil den größten Unterschied macht:

**Vor der Ausführung — Planfreigabe:**
Der Agent erstellt den Implementierungsplan und die Tasks.md, aber der Entwickler gibt sie frei. Hier werden falsche Annahmen, überflüssige Schritte und fehlende Edge-Cases abgefangen, *bevor* Code geschrieben wird. Das ist der effizienteste Eingriffspunkt: eine Korrektur im Plan kostet Sekunden, eine Korrektur im fertigen Code kostet Minuten bis Stunden.

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

### 3.4 Der 4-Phasen-Zyklus

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

### 3.5 „Search Before Coding" als Harness-Constraint

Eine zentrale Leitplanke: **Bevor der Agent eine Funktion schreibt, muss er prüfen, ob ähnliche Logik bereits existiert.** Das ist kein Vorschlag, sondern eine Pflicht im Harness.

In unserem Projekt hat das z. B. verhindert, dass die Haversine-Distanzberechnung doppelt implementiert wird — einmal in `utils/haversine.py` und potenziell nochmal inline im Overlap-Service. CocoIndex findet solche Duplikate semantisch: `ccc search "distance calculation"` findet `calculate_haversine()`, auch wenn die Suchbegriffe nicht im Funktionsnamen vorkommen.

| AGENTS.md-Prinzip | CocoIndex-Unterstützung |
|---|---|
| Surgical Changes | `ccc grep 'calculate_haversine'` → findet alle Aufrufer → nur minimale Zeilen werden geändert |
| Simplicity First | `ccc search "distance"` → existiert schon → wiederverwenden statt neu schreiben |
| Think Before Coding | `ccc status` → Codebase-Überblick → Agent versteht Kontext vor dem ersten Edit |

---

## 4. KI-Einsatz pro Sprint

### Sprint 1 — Foundation

| Aufgabe | Agenten-Einsatz | Ergebnis |
|---|---|---|
| DB-Setup & ORM-Models | Schema-Definitionen aus SSOT, backend-architecture Skill | 4 Models fehlerfrei in einem Durchgang |
| Firebase Auth Integration | Auth-Flow aus SSOT, DI-Guards nach Architektur-Skill | `get_current_user()` + `require_role()` mit Rollenhierarchie |
| Haversine-Utility | Formel implementiert, Edge-Cases autonom getestet | Korrekte Distanzberechnung, Tests für Äquator, Pole, kurze Distanzen |

### Sprint 2 — Core Features

| Aufgabe | Agenten-Einsatz | Ergebnis |
|---|---|---|
| Overlap-Score Algorithmus | Formel aus SSOT §8, Think-Before-Coding hat multiplikatives Modell ausgelöst | Mathematisch verifiziert, Unit-Tests für alle Grenzfälle |
| Species CRUD (Admin) | backend-architecture Skill, Surgical Changes (nur Router + Schema) | Konsistente Endpoints, Soft-Delete, 409/422 Fehlerbehandlung |
| Reports Compare | Spezifikation aus SSOT, Goal-Driven mit Erfolgskriterien | Validierung: gleiche Species erforderlich, sonst 400 |

### Sprint 3 — Testing & Dokumentation

| Aufgabe | Agenten-Einsatz | Ergebnis |
|---|---|---|
| Integrationstests | backend-testing Skill, 33 Tests autonom generiert und verifiziert | Vollständige Endpoint-Abdeckung, Mock-Firebase, transaktionale DB-Sessions |
| OBIS Error-Handling | Graceful-Degradation-Pattern aus Architektur-Skill | System läuft bei API-Ausfällen stabil weiter |
| Swagger-Dokumentation | Response-Models und Endpoint-Beschreibungen aus SSOT extrahiert | Vollständige OpenAPI-Spezifikation |

### Sprint 4 — Polish & Refactoring

| Aufgabe | Agenten-Einsatz | Ergebnis |
|---|---|---|
| Pydantic v2 Migration | Agent hat alle 28 Deprecation-Warnings identifiziert und migriert | Sauberer Testlauf ohne Warnings |
| Overlap-Router Redundanz | Surgical Changes: nur Router, Service unangetastet | Code-Reduktion durch direkte Service-Wiederverwendung |
| BBox-Filterung | Filter-Logik und Fehlerbehandlung in einem Agenten-Loop | Korrekte geografische Filterung mit klaren Fehlermeldungen |

---

## 5. Bewusst vermiedene Anti-Patterns

| Anti-Pattern | Unsere Lösung |
|---|---|
| **Agent ohne Kontext arbeiten lassen** | SSOT + Sprint-Plan als strukturiertes Informationssystem (Context Engineering) |
| **Keine Verhaltensschranken setzen** | AGENTS.md mit vier Prinzipien + 4-Phasen-Zyklus (Harness Engineering) |
| **Agent autonom ohne Checkpoints laufen lassen** | Human in the Loop: Planfreigabe vor Ausführung, Checkpoints bei Entscheidungen, Code-Review nach Abschluss |
| **Agent-Output blind übernehmen** | Goal-Driven Execution: Agent iteriert bis Erfolgskriterien erfüllt, dann Team-Review |
| **Gesamte Codebase als Kontext** | On-Demand-Skills + CocoIndex-Suche: Agent bekommt nur, was er für die aktuelle Aufgabe braucht |
| **Jeder Entwickler eigene KI-Gewohnheiten** | Geteilte Skills erzwingen einheitliche Architektur- und Testmuster über alle drei Teammitglieder |
| **Agent „räumt auf" und bricht Nachbar-Code** | Surgical Changes als Harness-Prinzip: Agent darf nur Dateien anfassen, die direkt zur Aufgabe gehören |
| **Agent arbeitet ohne nachvollziehbaren Plan** | Implementierungsplan → Tasks.md: jeder Schritt dokumentiert und abhakbar |

---

## 6. Ergebnisse

33/33 Tests grün. 18 REST-Endpoints implementiert und dokumentiert. 4 Sprints termingerecht abgeschlossen. 0 Pydantic-Deprecation-Warnings. 3 externe Services (OBIS, AISstream, Open-Meteo) stabil angebunden.

Die KI hat keinen Code geschrieben, den wir nicht verstehen. Jedes Teammitglied kann seinen Code erklären, debuggen und erweitern — der Agent hat die Umsetzung beschleunigt, aber die Verantwortung liegt beim Team.

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

*Erstellt am 30.06.2026 — OceanGuard KI-Protokoll, Sprints 1–4.*
