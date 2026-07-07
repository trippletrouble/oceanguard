#!/bin/bash

# Backend launcher for OceanGuard.
# This script is opened in a separate terminal window by startScript.sh.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

echo ""
echo "============================================"
echo "  OceanGuard Backend - Fenster offen lassen!"
echo "============================================"
echo ""
echo "Hier sehen Sie:"
echo "  - AISstream WebSocket-Verbindung"
echo "  - OBIS API Anfragen"
echo "  - Open-Meteo Marine API Anfragen"
echo "  - Datenbank-Operationen"
echo "  - Eventuelle Fehlermeldungen"
echo ""
echo "Dieses Fenster NICHT schließen während Sie die Website testen!"
echo ""

source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
