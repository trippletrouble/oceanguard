import logging

from app.utils.haversine import calculate_haversine
from app.models.species import Species

logger = logging.getLogger(__name__)


def compute_single_score(vessel: dict, zone: dict, sst: float | None, species: Species) -> dict:
    v_lat = vessel.get("lat")
    v_lng = vessel.get("lng")
    v_sog = vessel.get("sog", 0.0)
    mmsi = vessel.get("mmsi")

    if v_lat is None or v_lng is None:
        return {}

    # Extracts center coordinates from OBIS
    center = zone.get("center", {})
    c_lat = center.get("lat", zone.get("center_lat"))
    c_lng = center.get("lng", zone.get("center_lng"))

    if c_lat is None or c_lng is None:
        return {}

    distance_km = calculate_haversine(v_lat, v_lng, c_lat, c_lng)
    radius = zone.get("radius_km", getattr(species, "radius_km", 200.0)) or 200.0

    # D scales from 1.0 (exact center) down to 0.0 (at or outside perimeter boundary)
    D = max(0.0, 1.0 - (distance_km / radius))

    # A scales from 1.0 down to 0.0 (at or above 10 knots)
    # Commercial longlining or trawling usually occurs at lower speeds (1-5 knots)
    A = max(0.0, 1.0 - (v_sog / 10.0))

    # Compares real-time Open-Meteo values against species biological preferences
    temp_mid = getattr(species, "temp_mid", None)
    temp_range = getattr(species, "temp_range", None)

    if sst is not None and temp_mid is not None and temp_range and temp_range > 0:
        T = max(0.0, 1.0 - (abs(sst - temp_mid) / temp_range))
    else:
        T = 0.5

    # If a vessel is outside the radius boundary, D is 0.0, dropping total threat level instantly to 0
    score = round(D * (A * 0.6 + T * 0.4), 4)

    if score > 0.7:
        level = "CRITICAL"
    elif score >= 0.4:
        level = "WARNING"
    else:
        level = "LOW"

    return {
        "mmsi": mmsi,
        "vessel_name": vessel.get("name", "Unknown"),
        "lat": v_lat,
        "lng": v_lng,
        "sog": v_sog,
        "score": score,
        "factors": {
            "distance_factor": round(D, 4),
            "activity_factor": round(A, 4),
            "temperature_factor": round(T, 4)
        },
        "level": level,
        "distance_km": round(distance_km, 2)
    }
