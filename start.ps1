# Encoding für deutsche Umlaute setzen
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "       OceanGuard wird gestartet..." -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White

# Prüfen, ob Backend eingerichtet ist
if (-not (Test-Path "backend\.venv")) {
    Write-Host "FEHLER: Backend noch nicht eingerichtet!" -ForegroundColor Red
    Write-Host "Führen Sie zuerst aus: .\backend\setup.ps1" -ForegroundColor Yellow
    Read-Host "Drücken Sie Enter zum Beenden"
    exit 1
}

# Prüfen, ob Frontend eingerichtet ist
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "FEHLER: Frontend noch nicht eingerichtet!" -ForegroundColor Red
    Write-Host "Führen Sie zuerst aus: .\frontend\setup.ps1" -ForegroundColor Yellow
    Read-Host "Drücken Sie Enter zum Beenden"
    exit 1
}

# Startverzeichnis speichern
$BasePath = Get-Location

# Backend in neuem Fenster starten
Write-Host "[Backend] Wird in einem neuen Fenster gestartet..." -ForegroundColor Green
Write-Host "" -ForegroundColor Yellow
Write-Host "  HINWEIS: Bitte schließen Sie das Backend-Fenster NICHT!" -ForegroundColor Yellow
Write-Host "  Dort sehen Sie API-Verbindungen (AISstream, OBIS, Open-Meteo)" -ForegroundColor Yellow
Write-Host "  und eventuelle Fehlermeldungen während des Tests." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

Start-Process powershell -ArgumentList "-NoExit", "-File", "$BasePath\backend\start_backend.ps1"

# Kurz warten bis Backend-Fenster geöffnet ist
Start-Sleep -Seconds 2

# Frontend im aktuellen Fenster starten
Write-Host "[Frontend] Wird gestartet..." -ForegroundColor Blue
Write-Host "" -ForegroundColor White
Set-Location "$BasePath\frontend"

npm run dev

# Wenn npm dev beendet wird, aufräumen
Write-Host "" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "       Frontend gestoppt" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "HINWEIS: Das Backend-Fenster ist noch geöffnet." -ForegroundColor Yellow
Write-Host "Sie können es jetzt schließen oder für weitere Tests offen lassen." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
