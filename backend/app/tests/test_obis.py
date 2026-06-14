import pytest

from app.services.obis_service import OBISService


@pytest.fixture()
def service():
    return OBISService()


@pytest.mark.asyncio
async def test_fetch_occurrences(service):
    config = service.SPECIES_CONFIG["thunnus-thynnus"]

    results = await service.fetch_occurrences(
        scientific_name=config["name"],
        geometry=config["region"],
        size=10,
    )

    assert isinstance(results, list)
    assert len(results) > 0, "OBIS returned no data for the test species"

    first = results[0]
    assert "decimalLatitude" in first
    assert "decimalLongitude" in first
    assert "eventDate" in first

    for item in results:
        assert item["decimalLatitude"] is not None
        assert item["decimalLongitude"] is not None
        assert "eventDate" in item


@pytest.mark.asyncio
async def test_calculate_zones(service):
    config = service.SPECIES_CONFIG["thunnus-thynnus"]

    occurrences = await service.fetch_occurrences(
        scientific_name=config["name"],
        geometry=config["region"],
        size=50,
    )

    assert len(occurrences) > 0, "OBIS returned no data for zone calculation"

    zones = await service.calculate_zones("thunnus-thynnus", occurrences)

    assert isinstance(zones, dict)
    assert len(zones) > 0, "No monthly zones were created from live OBIS data"

    for month, zone_list in zones.items():
        assert 1 <= month <= 12
        assert isinstance(zone_list, list)
        for zone in zone_list:
            assert "center" in zone
            assert "lat" in zone["center"]
            assert "lng" in zone["center"]
            assert zone["radius_km"] == 200
            assert zone["sighting_count"] >= 1


@pytest.mark.asyncio
async def test_refresh_zones(service):
    await service.refresh_zones("thunnus-thynnus")

    cached = service.get_zones("thunnus-thynnus")

    assert cached is not None, "refresh_zones did not populate the cache"
    assert isinstance(cached, dict)
    assert len(cached) > 0, "Cache is empty after refresh_zones"

    for month, zone_list in cached.items():
        assert 1 <= month <= 12
        assert isinstance(zone_list, list)
        for zone in zone_list:
            assert zone["radius_km"] == 200
            assert zone["sighting_count"] >= 1


def test_get_zones_none_for_unknown_species(service):
    assert service.get_zones("unknown-fish") is None
