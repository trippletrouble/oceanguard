#!/bin/bash

echo "OceanGuard Backend wird eingerichtet..."

# Python-Installation prüfen
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "FEHLER: Python ist nicht installiert oder nicht im PATH"
    echo "Bitte installieren Sie Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
echo "Gefunden: $PYTHON_VERSION"

# Virtuelle Umgebung erstellen, falls nicht vorhanden
if [ -d ".venv" ]; then
    echo "Virtuelle Umgebung existiert bereits"
else
    echo "Virtuelle Umgebung wird erstellt..."
    $PYTHON_CMD -m venv .venv
    if [ $? -eq 0 ]; then
        echo "Virtuelle Umgebung erfolgreich erstellt"
    else
        echo "FEHLER: Erstellen der virtuellen Umgebung fehlgeschlagen"
        exit 1
    fi
fi

# Virtuelle Umgebung aktivieren und Abhängigkeiten installieren
echo "Python-Abhängigkeiten werden installiert..."
source .venv/bin/activate
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "Einrichtung abgeschlossen! Backend ist bereit."
    echo "Nächster Schritt: Frontend einrichten (cd ../frontend && ./setup.sh)"
else
    echo ""
    echo "FEHLER: Installation der Abhängigkeiten fehlgeschlagen"
    exit 1
fi
