import pytest
from app.services.obis_service import obis_service


@pytest.mark.asyncio
async def test_obis_service_live_data():
    # Validates that the service connects to OBIS and returns the correct keys
    test_species = "Thunnus thynnus"

    results = await obis_service.fetch_occurrences(scientific_name=test_species, size=10)

    assert isinstance(results, list), "Results should be a list"

    if len(results) > 0:
        first = results[0]
        assert "decimalLatitude" in first, "Missing latitude"
        assert "decimalLongitude" in first, "Missing longitude"
        assert "eventDate" in first, "Missing date"
        print(f"\n Test Passed: Received {len(results)} records from OBIS.")
    else:
        pytest.fail("No data returned from OBIS API. Check your internet or scientific name.")


@pytest.mark.asyncio
async def test_obis_parameter_handling():
    # Ensures the service handles custom geometry correctly
    custom_geo = "POLYGON((-10 35, 0 35, 0 45, -10 45, -10 35))"
    results = await obis_service.fetch_occurrences(
        scientific_name="Thunnus thynnus",
        geometry=custom_geo,
        size=5
    )
    assert isinstance(results, list)