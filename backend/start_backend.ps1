# Backend Launcher for OceanGuard
# Dieses Skript wird in einem separaten Fenster geöffnet

Write-Host '' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Green
Write-Host '  OceanGuard Backend - Fenster offen lassen!' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Hier sehen Sie:' -ForegroundColor Cyan
Write-Host '  - AISstream WebSocket-Verbindung' -ForegroundColor White
Write-Host '  - OBIS API Anfragen' -ForegroundColor White
Write-Host '  - Open-Meteo Marine API Anfragen' -ForegroundColor White
Write-Host '  - Datenbank-Operationen' -ForegroundColor White
Write-Host '  - Eventuelle Fehlermeldungen' -ForegroundColor White
Write-Host ''
Write-Host 'Dieses Fenster NICHT schließen während Sie die Website testen!' -ForegroundColor Yellow
Write-Host ''

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $ScriptDir

# Activate virtual environment and start uvicorn
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
