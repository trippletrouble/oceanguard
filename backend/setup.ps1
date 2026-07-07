# Backend Setup-Skript für Windows
Write-Host "OceanGuard Backend wird eingerichtet..." -ForegroundColor Cyan

# Python-Installation prüfen
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Gefunden: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "FEHLER: Python ist nicht installiert oder nicht im PATH" -ForegroundColor Red
    Write-Host "Bitte installieren Sie Python 3.8+ von https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Virtuelle Umgebung erstellen, falls nicht vorhanden
if (Test-Path ".venv") {
    Write-Host "Virtuelle Umgebung existiert bereits" -ForegroundColor Yellow
} else {
    Write-Host "Virtuelle Umgebung wird erstellt..." -ForegroundColor Cyan
    python -m venv .venv
    if ($?) {
        Write-Host "Virtuelle Umgebung erfolgreich erstellt" -ForegroundColor Green
    } else {
        Write-Host "FEHLER: Erstellen der virtuellen Umgebung fehlgeschlagen" -ForegroundColor Red
        exit 1
    }
}

# Virtuelle Umgebung aktivieren und Abhängigkeiten installieren
Write-Host "Python-Abhängigkeiten werden installiert..." -ForegroundColor Cyan
& ".\.venv\Scripts\Activate.ps1"
pip install -r requirements.txt

if ($?) {
    Write-Host "`nEinrichtung abgeschlossen! Backend ist bereit." -ForegroundColor Green
    Write-Host "Nächster Schritt: Frontend einrichten (cd ..\frontend; .\setup.ps1)" -ForegroundColor Yellow
} else {
    Write-Host "`nFEHLER: Installation der Abhängigkeiten fehlgeschlagen" -ForegroundColor Red
    exit 1
}
