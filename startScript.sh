#!/bin/bash

# Skript-Verzeichnis holen
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "  ========================================"
echo "       OceanGuard wird gestartet..."
echo "  ========================================"
echo ""

# Prüfen, ob Backend eingerichtet ist
if [ ! -d "backend/.venv" ]; then
    echo "FEHLER: Backend noch nicht eingerichtet!"
    echo "Führen Sie zuerst aus: ./backend/setup.sh"
    read -p "Drücken Sie Enter zum Beenden"
    exit 1
fi

# Prüfen, ob Frontend eingerichtet ist
if [ ! -d "frontend/node_modules" ]; then
    echo "FEHLER: Frontend noch nicht eingerichtet!"
    echo "Führen Sie zuerst aus: ./frontend/setup.sh"
    read -p "Drücken Sie Enter zum Beenden"
    exit 1
fi

# Backend in neuem Terminal-Fenster starten (plattformabhängig)
echo "[Backend] Wird in einem neuen Fenster gestartet..."
echo ""
echo "  HINWEIS: Bitte schließen Sie das Backend-Fenster NICHT!"
echo "  Dort sehen Sie API-Verbindungen (AISstream, OBIS, Open-Meteo)"
echo "  und eventuelle Fehlermeldungen während des Tests."
echo ""

# Detect OS and open terminal accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - Terminal.app oder iTerm2
    if [ -d "/Applications/Utilities/Terminal.app" ]; then
        osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$SCRIPT_DIR/backend' && source .venv/bin/activate && echo '\\n============================================' && echo '  OceanGuard Backend - Fenster offen lassen!' && echo '============================================' && echo '' && echo 'Hier sehen Sie:' && echo '  - AISstream WebSocket-Verbindung' && echo '  - OBIS API Anfragen' && echo '  - Open-Meteo Marine API Anfragen' && echo '  - Datenbank-Operationen' && echo '  - Eventuelle Fehlermeldungen' && echo '' && echo 'Dieses Fenster NICHT schließen während Sie die Website testen!' && echo '' && uvicorn app.main:app --reload --port 8000"
end tell
EOF
    fi
elif command -v gnome-terminal &> /dev/null; then
    # Linux mit GNOME
    gnome-terminal --title="OceanGuard Backend" -- bash -c "cd '$SCRIPT_DIR/backend' && source .venv/bin/activate && echo '' && echo '============================================' && echo '  OceanGuard Backend - Fenster offen lassen!' && echo '============================================' && echo '' && echo 'Hier sehen Sie:' && echo '  - AISstream WebSocket-Verbindung' && echo '  - OBIS API Anfragen' && echo '  - Open-Meteo Marine API Anfragen' && echo '  - Datenbank-Operationen' && echo '  - Eventuelle Fehlermeldungen' && echo '' && echo 'Dieses Fenster NICHT schließen während Sie die Website testen!' && echo '' && uvicorn app.main:app --reload --port 8000; exec bash"
elif command -v xterm &> /dev/null; then
    # Fallback zu xterm
    xterm -title "OceanGuard Backend" -e "bash -c 'cd \\\"$SCRIPT_DIR/backend\\\" && source .venv/bin/activate && echo \\\"============================================\\\" && echo \\\"  OceanGuard Backend - Fenster offen lassen!\\\" && echo \\\"============================================\\\" && echo \\\"\\\" && echo \\\"Hier sehen Sie:\\\" && echo \\\"  - AISstream WebSocket-Verbindung\\\" && echo \\\"  - OBIS API Anfragen\\\" && echo \\\"  - Open-Meteo Marine API Anfragen\\\" && echo \\\"  - Datenbank-Operationen\\\" && echo \\\"  - Eventuelle Fehlermeldungen\\\" && echo \\\"\\\" && echo \\\"Dieses Fenster NICHT schließen während Sie die Website testen!\\\" && echo \\\"\\\" && uvicorn app.main:app --reload --port 8000; exec bash'"
else
    # Wenn kein separates Fenster möglich, im gleichen Fenster (background)
    echo "Hinweis: Kein unterstütztes Terminal gefunden. Backend läuft im Hintergrund."
    cd backend
    source .venv/bin/activate
    uvicorn app.main:app --reload --port 8000 &
    BACKEND_PID=$!
    cd ..
    sleep 2
fi

# Kurz warten bis Backend-Fenster geöffnet ist
sleep 2

# Frontend im aktuellen Fenster starten
echo ""
echo "[Frontend] Wird gestartet..."
echo ""

cd frontend
npm run dev

# Wenn npm dev beendet wird, aufräumen
echo ""
echo "  ========================================"
echo "       Frontend gestoppt"
echo "  ========================================"
echo ""
echo "HINWEIS: Das Backend-Fenster ist noch geöffnet."
echo "Sie können es jetzt schließen oder für weitere Tests offen lassen."
echo ""
