import pytest
from unittest.mock import patch
from app.services.overlap_service import compute_single_score


class MockSpecies:
    radius_km = 200
    temp_mid = 22.0
    temp_range = 10.0


mock_zone = {"center_lat": 40.0, "center_lng": 6.0, "radius_km": 200}


# ========== TEST 1: Maximum Threat (All Factors = 1.0) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=0.0)
def test_score_critical(mock_haversine):
    """Vessel at zone center, stationary, perfect temperature = CRITICAL"""
    vessel = {"lat": 40.0, "lng": 6.0, "sog": 0.0, "mmsi": "1", "name": "Test"}
    r = compute_single_score(vessel, mock_zone, 22.0, MockSpecies())

    assert r["D"] == 1.0
    assert r["A"] == 1.0
    assert r["T"] == 1.0
    assert r["score"] == 1.0
    assert r["level"] == "CRITICAL"


# ========== TEST 2: D = 0 Outside Zone Boundary (Gatekeeper) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=400.0)
def test_d_zero_outside_boundary(mock_haversine):
    """Vessel 400km away (outside 200km radius) = D=0, Score=0 (Gatekeeper)"""
    vessel = {"lat": 44.0, "lng": 6.0, "sog": 2.0, "mmsi": "1", "name": "Test"}
    r = compute_single_score(vessel, mock_zone, 22.0, MockSpecies())

    assert r["D"] == 0.0
    assert r["score"] == 0.0  # Gatekeeper: If D=0, score is always 0


# ========== TEST 3: Transit Ship (High Speed = Low Activity Factor) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=50.0)
def test_transit_ship(mock_haversine):
    """Transit ship at 15 knots = A=0, Level=LOW"""
    vessel = {"lat": 40.1, "lng": 6.0, "sog": 15.0, "mmsi": "1", "name": "Test"}
    r = compute_single_score(vessel, mock_zone, 22.0, MockSpecies())

    assert r["A"] == 0.0
    assert r["level"] == "LOW"


# ========== TEST 4: Missing SST Fallback (T = 0.5) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=50.0)
def test_sst_fallback(mock_haversine):
    """No SST data available = T = 0.5 (default)"""
    vessel = {"lat": 40.0, "lng": 6.0, "sog": 2.0, "mmsi": "1", "name": "Test"}
    r = compute_single_score(vessel, mock_zone, None, MockSpecies())

    assert r["T"] == 0.5


# ========== TEST 5: Multiplicative Gatekeeper (D=0 → Score=0) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=300.0)
def test_multiplicative_formula_gatekeeper(mock_haversine):
    """D=0 (outside zone) makes score=0 regardless of A and T"""
    vessel = {"lat": 50.0, "lng": 6.0, "sog": 0.0, "mmsi": "1", "name": "Test"}
    r = compute_single_score(vessel, mock_zone, 22.0, MockSpecies())

    assert r["D"] == 0.0
    assert r["score"] == 0.0  # Gatekeeper prevents high scores at zone edge


# ========== TEST 6: Fishing Activity Zone (D=0.5, Low Speed) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=100.0)
def test_fishing_activity(mock_haversine):
    """Vessel 100km from center, slow fishing speed = D=0.5, A=0.9 = WARNING"""
    vessel = {"lat": 40.5, "lng": 6.0, "sog": 1.0, "mmsi": "2", "name": "Fisher"}
    r = compute_single_score(vessel, mock_zone, 22.0, MockSpecies())

    assert r["D"] == 0.5
    assert r["A"] == 0.9
    assert 0.4 <= r["score"] <= 0.7
    assert r["level"] == "WARNING"


# ========== TEST 7: Temperature Outside Ideal Range (T = 0.0) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=50.0)
def test_temp_outside_range(mock_haversine):
    """SST=35°C far from ideal 22°C (range 10°C) = T=0.0"""
    vessel = {"lat": 40.0, "lng": 6.0, "sog": 2.0, "mmsi": "1", "name": "Test"}
    r = compute_single_score(vessel, mock_zone, 35.0, MockSpecies())

    assert r["T"] == 0.0
    assert r["level"] == "LOW"  # Poor conditions


# ========== TEST 8: Mid-Zone, Mid-Speed (Realistic WARNING) ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=75.0)
def test_realistic_warning(mock_haversine):
    """Realistic scenario: 75km from center, 5 knots, good temp = WARNING"""
    vessel = {"lat": 40.3, "lng": 6.0, "sog": 5.0, "mmsi": "3", "name": "Trawler"}
    r = compute_single_score(vessel, mock_zone, 21.0, MockSpecies())

    assert 0.4 <= r["score"] <= 0.7
    assert r["level"] == "WARNING"


# ========== TEST 9: Perfect Conditions but Outside Zone = LOW ==========
@patch('app.services.overlap_service.calculate_haversine', return_value=250.0)
def test_perfect_but_outside(mock_haversine):
    """Perfect conditions (stationary, ideal temp) but outside zone = D=0, Score=0, LOW"""
    vessel = {"lat": 42.0, "lng": 6.0, "sog": 0.0, "mmsi": "4", "name": "Stationary"}
    r = compute_single_score(vessel, mock_zone, 22.0, MockSpecies())

    assert r["D"] == 0.0
    assert r["score"] == 0.0
    assert r["level"] == "LOW"


# ========== TEST 10: Validation - Missing Latitude ==========
def test_missing_latitude():
    """Invalid vessel (no latitude) returns empty dict"""
    vessel = {"lng": 6.0, "sog": 0.0, "mmsi": "5", "name": "Invalid"}
    r = compute_single_score(vessel, mock_zone, 22.0, MockSpecies())

    assert r == {}


