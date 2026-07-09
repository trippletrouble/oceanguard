---
name: backend-testing
description: Conventions and patterns for writing unit and integration tests in the OceanGuard backend using pytest and unittest.mock.
---

# 🧪 OceanGuard Backend Testing Guidelines

Dieser Skill definiert die Standards und Muster für Unit- und Integrationstests im FastAPI-Backend.

---

## 1. Test-Kategorien
* **Unit-Tests (`app/tests/test_*.py`):** Testen isolierte mathematische Logiken (z. B. Haversine, Overlap-Score). Keine echten API-Aufrufe oder DB-Verbindungen!
* **Integrationstests (`app/tests/test_integration.py`):** Testen Routen, Endpunkt-Zusammenspiel, Berechtigungen und Datenbank-Verhalten unter Verwendung einer Test-Datenbank-Session (`conftest.py`).

---

## 2. Mocking-Standards
* Externe Webservices (z. B. Open-Meteo oder AISstream) müssen in Unit-Tests konsequent gemockt werden.
* Nutze `@patch('app.services.overlap_service.calculate_haversine', return_value=X)` oder `unittest.mock.MagicMock`, um deterministische Testfälle zu garantieren.
* Teste auch Fehlersituationen (z. B. wenn eine API `HTTPException` wirft oder `None` zurückgibt) und stelle sicher, dass die Fallbacks (z. B. `T = 0.5`) greifen.

---

## 3. Muster-Test für Berechnungslogik (`app/tests/test_logic.py`)
```python
import pytest
from unittest.mock import patch
from app.services.overlap_service import compute_single_score

class MockSpecies:
    radius_km = 100
    temp_mid = 15.0
    temp_range = 5.0

mock_zone = {"center_lat": 45.0, "center_lng": -1.0, "radius_km": 100}

@patch('app.services.overlap_service.calculate_haversine', return_value=25.0)
def test_overlap_warning_scenario(mock_haversine):
    # Schiff fährt langsam (2 kn) nahe der Zone, Temperatur ist ideal (15.0°C)
    vessel = {"lat": 45.2, "lng": -1.0, "sog": 2.0, "mmsi": 11111, "name": "Fisher"}
    r = compute_single_score(vessel, mock_zone, 15.0, MockSpecies())

    assert r["D"] == 0.75  # 1.0 - (25.0 / 100.0)
    assert r["A"] == 0.8   # 1.0 - (2.0 / 10.0)
    assert r["T"] == 1.0   # 1.0 - (|15 - 15| / 5)
    assert r["level"] == "WARNING"
```
