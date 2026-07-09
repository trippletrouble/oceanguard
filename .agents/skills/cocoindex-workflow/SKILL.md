---
name: cocoindex-workflow
description: Guidelines for leveraging cocoindex-code semantic search and structural grep to gain a codebase overview and execute Ponytail's lazy development rules.
---

# 🧠 CocoIndex & Ponytail: Das perfekte Entwicklungs-Duo

Dieser Skill beschreibt, wie du **CocoIndex** (semantische und strukturelle Suche) und **Ponytail** (Effizienz, Einfachheit und Wiederverwendbarkeit) zusammen nutzt, um Code-Duplikate zu vermeiden, die Codebase zu verstehen und Änderungen minimal zu halten.

---

## 1. Gesamtüberblick über die Codebase gewinnen
Bevor du Änderungen vornimmst, nutze die CLI-Befehle von `cocoindex-code` in deiner lokalen Entwicklungsumgebung:
* **Statistiken anzeigen (`ccc status`):** Gibt dir einen schnellen Überblick über Dateimengen und Sprachverteilungen im Projekt.
* **Semantische Suche (`ccc search "<konzept>"`):** Suche nach logischen Konzepten statt exakten Wörtern (z. B. `ccc search "calculate distance between coordinates"` oder `ccc search "vessel threat score"`). Dies zeigt dir sofort, wo relevante Logik liegt, selbst wenn du die Dateinamen nicht kennst.
* **Strukturelle Suche (`ccc grep '<muster>'`):** Sucht nach Syntaxbäumen (AST) statt einfachem Text. Leerzeichen und Formatierungen werden ignoriert.
  * Beispiel: `ccc grep 'def \NAME(\(ARGS*\)):'` listet alle Python-Funktionsdefinitionen auf.

---

## 2. Das Zusammenspiel im Entwicklungs-Workflow

| Ponytail-Prinzip | Unterstützt durch CocoIndex-Praxis |
|---|---|
| **"Existiert das schon?" (Wiederverwendung)** | Bevor du eine Hilfsfunktion (z. B. Zeitkonvertierung, Geodaten-Berechnung) schreibst, führe `ccc search` aus. Es findet semantisch ähnliche Helper in `utils/` oder `services/`. |
| **"Root-Cause-Fixing" (Nicht nur Symptome lindern)** | Wenn du eine Funktion änderst, musst du alle Aufrufer anpassen. Nutze `ccc grep 'deine_funktion(\(ARGS*\))'` um ausnahmslos alle Verwendungen im gesamten Codebaum zu finden und mitzupatchen. |
| **"Surgical Changes" (Nur das Nötigste ändern)** | Durch die präzise Suche mit `ccc search` und `ccc grep` findest du die exakt minimalen Zeilen, die geändert werden müssen. Du vermeidest es, blind Dateien zu durchsuchen oder angrenzenden Code anzufassen. |

*Nutze diese Werkzeuge proaktiv bei jeder Analyse einer neuen Aufgabe, um Zeit und Token zu sparen!*
