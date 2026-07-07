#!/bin/bash

echo "OceanGuard Frontend wird eingerichtet..."

# Node.js-Installation prüfen
if ! command -v node &> /dev/null; then
    echo "FEHLER: Node.js ist nicht installiert"
    echo "Bitte installieren Sie Node.js von https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "FEHLER: npm ist nicht installiert"
    echo "Bitte installieren Sie Node.js von https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "Gefunden Node.js: $NODE_VERSION"
echo "Gefunden npm: $NPM_VERSION"

# Abhängigkeiten installieren
if [ -d "node_modules" ]; then
    echo "Node modules existieren bereits, werden aktualisiert..."
    npm install
else
    echo "Node.js-Abhängigkeiten werden installiert..."
    npm install
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "Einrichtung abgeschlossen! Frontend ist bereit."
    echo "Als nächstes: Start-Skript im Projektverzeichnis ausführen"
else
    echo ""
    echo "FEHLER: Installation der Abhängigkeiten fehlgeschlagen"
    exit 1
fi
