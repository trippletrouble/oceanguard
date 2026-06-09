import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ais_service import ais_service
from app.services.meteo_service import get_sst
from app.services.obis_service import obis_service
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
        "D": round(D, 4),
        "A": round(A, 4),
        "T": round(T, 4),
        "score": score,
        "level": level,
        "distance_km": round(distance_km, 2)
    }


def get_best_evaluation_for_vessel(vessel: dict, month_zones: list, zone_ssts: list, species: Species) -> dict | None:
    best_evaluation = None
    max_score = -1.0
    min_distance = float('inf')

    # Test the vessel against all available zones
    for idx, zone in enumerate(month_zones):
        sst = zone_ssts[idx]
        evaluation = compute_single_score(vessel, zone, sst, species)

        if not evaluation:
            continue

        score = evaluation.get("score", 0.0)
        distance = evaluation.get("distance_km", float('inf'))

        # If this zone is a better match (or closer), it becomes the new best
        if (score > max_score) or (score == max_score and distance < min_distance):
            max_score = score
            min_distance = distance
            best_evaluation = evaluation

    return best_evaluation


async def compute_overlap(species_id: str, month: int, db: AsyncSession) -> dict:
    # Look up targeted species parameters
    stmt = select(Species).where(Species.id == species_id, Species.active == True)
    result = await db.execute(stmt)
    species = result.scalar_one_or_none()

    if not species:
        raise HTTPException(status_code=404, detail="Active target species profile not found")

    # Fetch tracking zones from OBIS
    zones = obis_service.get_zones(species_id)
    if not zones:
        raise HTTPException(status_code=404, detail="No historical tracking profiles registered for this species")

    month_zones = zones.get(month)
    if not month_zones:
        raise HTTPException(status_code=404, detail=f"No zone bounds mapped for operational month context: {month}")

    # Get SST once per zone
    zone_ssts = []
    metadata_list = []

    for idx, zone in enumerate(month_zones):
        c_lat = zone.get("center", {}).get("lat")
        c_lng = zone.get("center", {}).get("lng")

        sst = None
        try:
            meteo_data = await get_sst(c_lat, c_lng)
            sst = meteo_data.get("sea_surface_temperature")
        except Exception as e:
            logger.warning(f"Unable to retrieve meteo metrics for tracking coordinate [{c_lat}, {c_lng}]: {e}")

        zone_ssts.append(sst)
        metadata_list.append({
            "center_lat": c_lat,
            "center_lng": c_lng,
            "radius_km": zone.get("radius_km", 200.0),
            "sea_surface_temperature_celsius": sst
        })

    # Extract target vessels within the specialized species box limits
    vessels = await ais_service.get_vessels_for_species(species_id)

    # Iteration through all vessels and calculation of threat level for each vessel
    scored_vessels = []
    for v in vessels:
        evaluation = get_best_evaluation_for_vessel(v, month_zones, zone_ssts, species)
        if evaluation:
            scored_vessels.append(evaluation)

    # Analytical calculations
    scores = [v["score"] for v in scored_vessels]
    stats = {
        "vessels_tracked_count": len(scored_vessels),
        "average_threat_score": round(sum(scores) / len(scores), 4) if scores else 0.0,
        "maximum_threat_score": round(max(scores), 4) if scores else 0.0
    }

    return {
        "species_id": species_id,
        "month_context": month,
        "zone_metadata": metadata_list,
        "stats": stats,
        "tracked_vessels": scored_vessels
    }