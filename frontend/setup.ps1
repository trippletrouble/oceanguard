# Frontend Setup-Skript für Windows
Write-Host "OceanGuard Frontend wird eingerichtet..." -ForegroundColor Cyan

# Node.js-Installation prüfen
try {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    Write-Host "Gefunden Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "Gefunden npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "FEHLER: Node.js oder npm ist nicht installiert" -ForegroundColor Red
    Write-Host "Bitte installieren Sie Node.js von https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Abhängigkeiten installieren
if (Test-Path "node_modules") {
    Write-Host "Node modules existieren bereits, werden aktualisiert..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "Node.js-Abhängigkeiten werden installiert..." -ForegroundColor Cyan
    npm install
}

if ($?) {
    Write-Host "`nEinrichtung abgeschlossen! Frontend ist bereit." -ForegroundColor Green
    Write-Host "Als nächstes: Start-Skript im Projektverzeichnis ausführen" -ForegroundColor Yellow
} else {
    Write-Host "`nFEHLER: Installation der Abhängigkeiten fehlgeschlagen" -ForegroundColor Red
    exit 1
}
