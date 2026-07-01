# pyrefly: ignore [missing-import]
import pytest
from unittest.mock import patch
from app.tests.conftest import AUTH_HEADER

@pytest.mark.asyncio
async def test_sync_creates_new_user(client, mock_firebase):
    response = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Test User"})
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@test.de"
    assert data["name"] == "Test User"
    assert data["role"] == "user"


@pytest.mark.asyncio
async def test_sync_returns_existing_user(client, mock_firebase):
    res1 = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Test User"})
    assert res1.status_code == 201

    res2 = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Test User"})
    assert res2.status_code == 200


@pytest.mark.asyncio
async def test_get_species_list_no_auth(client):
    response = await client.get("/species/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_species_detail_exists(client, db_session):
    from app.models.species import Species
    species = Species(
        id="thunnus-thynnus", common_name="Roter Thun",
        scientific_name="Thunnus thynnus", region="Mediterranean",
        temp_min=15.0, temp_max=25.0, temp_mid=22.0, temp_range=10.0,
        radius_km=200, active=True
    )
    db_session.add(species)
    await db_session.commit()

    response = await client.get("/species/thunnus-thynnus")
    assert response.status_code == 200
    assert response.json()["id"] == "thunnus-thynnus"


@pytest.mark.asyncio
async def test_get_species_detail_not_found(client):
    response = await client.get("/species/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_species_without_admin(client, mock_firebase):
    # Create user in DB first
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Test User"})
    assert sync_res.status_code == 201

    payload = {
        "id": "test-species",
        "common_name": "Test Fish",
        "scientific_name": "Testus fishus",
        "region": "Atlantic",
        "temp_min": 10.0,
        "temp_max": 20.0,
        "temp_mid": 15.0,
        "temp_range": 10.0
    }
    response = await client.post("/species/", headers=AUTH_HEADER, json=payload)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_species_as_admin(client, mock_firebase_admin, db_session):
    # Sync user in DB
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201

    # Update role to admin manually in DB
    from app.models.user import User
    from sqlalchemy import update
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    payload = {
        "id": "test-species",
        "common_name": "Test Fish",
        "scientific_name": "Testus fishus",
        "region": "Atlantic",
        "temp_min": 10.0,
        "temp_max": 20.0,
        "temp_mid": 15.0,
        "temp_range": 10.0
    }
    response = await client.post("/species/", headers=AUTH_HEADER, json=payload)
    assert response.status_code == 201
    assert response.json()["id"] == "test-species"


@pytest.mark.asyncio
async def test_create_species_duplicate(client, mock_firebase_admin, db_session):
    # Sync user in DB and set admin role
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201
    from app.models.user import User
    from sqlalchemy import update
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    payload = {
        "id": "test-species",
        "common_name": "Test Fish",
        "scientific_name": "Testus fishus",
        "region": "Atlantic",
        "temp_min": 10.0,
        "temp_max": 20.0,
        "temp_mid": 15.0,
        "temp_range": 10.0
    }
    res1 = await client.post("/species/", headers=AUTH_HEADER, json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/species/", headers=AUTH_HEADER, json=payload)
    assert res2.status_code == 409


@pytest.mark.asyncio
async def test_patch_species(client, mock_firebase_admin, db_session):
    # Sync user in DB and set admin role
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201
    from app.models.user import User
    from sqlalchemy import update
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    from app.models.species import Species
    species = Species(
        id="test-species", common_name="Test Fish",
        scientific_name="Testus fishus", region="Atlantic",
        temp_min=10.0, temp_max=20.0, temp_mid=15.0, temp_range=10.0,
        radius_km=150, active=True
    )
    db_session.add(species)
    await db_session.commit()

    response = await client.patch("/species/test-species", headers=AUTH_HEADER, json={"common_name": "Updated Name"})
    assert response.status_code == 200
    assert response.json()["common_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_species_soft(client, mock_firebase_admin, db_session):
    # Sync user in DB and set admin role
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201
    from app.models.user import User
    from sqlalchemy import update, select
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    from app.models.species import Species
    species = Species(
        id="test-species", common_name="Test Fish",
        scientific_name="Testus fishus", region="Atlantic",
        temp_min=10.0, temp_max=20.0, temp_mid=15.0, temp_range=10.0,
        radius_km=150, active=True
    )
    db_session.add(species)
    await db_session.commit()

    response = await client.delete("/species/test-species", headers=AUTH_HEADER)
    assert response.status_code == 204

    # Expire cached session instances to force a reload from the database
    db_session.expire_all()
    res = await db_session.execute(select(Species).where(Species.id == "test-species"))
    db_species = res.scalar_one()
    assert db_species.active is False



@pytest.mark.asyncio
async def test_admin_users_no_auth(client):
    response = await client.get("/admin/users")
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_admin_users_as_admin(client, mock_firebase_admin, db_session):
    # Sync user in DB and set admin role
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201
    from app.models.user import User
    from sqlalchemy import update
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    response = await client.get("/admin/users", headers=AUTH_HEADER)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_admin_delete_self(client, mock_firebase_admin, db_session):
    # Sync user in DB and set admin role
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201
    from app.models.user import User
    from sqlalchemy import update, select
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    res = await db_session.execute(select(User).where(User.firebase_uid == "admin-uid-456"))
    admin_user = res.scalar_one()
    admin_id = admin_user.id

    response = await client.delete(f"/admin/users/{admin_id}", headers=AUTH_HEADER)
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin cannot delete themselves"


@pytest.mark.asyncio
async def test_admin_change_role(client, mock_firebase_admin, db_session):
    # Sync user in DB and set admin role
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201
    from app.models.user import User
    from sqlalchemy import update
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    second_user = User(
        firebase_uid="second-user-uid",
        email="second@test.de",
        name="Second User",
        role="user"
    )
    db_session.add(second_user)
    await db_session.commit()
    second_id = second_user.id

    response = await client.patch(f"/admin/users/{second_id}/role", headers=AUTH_HEADER, json={"role": "admin"})
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_invalid_token(client):
    with patch("firebase_admin.auth.verify_id_token", side_effect=Exception("Invalid token")):
        response = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Test User"})
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_species_create_invalid_temp(client, mock_firebase_admin, db_session):
    # Sync user in DB and set admin role
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Admin User"})
    assert sync_res.status_code == 201
    from app.models.user import User
    from sqlalchemy import update
    await db_session.execute(
        update(User).where(User.firebase_uid == "admin-uid-456").values(role="admin")
    )
    await db_session.commit()

    payload = {
        "id": "test-species",
        "common_name": "Test Fish",
        "scientific_name": "Testus fishus",
        "region": "Atlantic",
        "temp_min": 25.0,
        "temp_max": 10.0,
        "temp_mid": 15.0,
        "temp_range": 10.0
    }
    response = await client.post("/species/", headers=AUTH_HEADER, json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_vessels_with_bbox(client):
    mock_vessels = [
        {"mmsi": 111, "name": "Vessel A", "lat": 35.0, "lng": 15.0, "sog": 2.0},
        {"mmsi": 222, "name": "Vessel B", "lat": 45.0, "lng": 25.0, "sog": 3.0},
        {"mmsi": 333, "name": "Vessel C", "lat": 55.0, "lng": 35.0, "sog": 4.0},
    ]

    with patch("app.services.ais_service.ais_service.get_all_vessels", return_value=mock_vessels):
        # 1. Test standard response (all vessels)
        res_all = await client.get("/vessels")
        assert res_all.status_code == 200
        assert res_all.json()["count"] == 3

        # 2. Test bbox filtering (should only match A and B)
        res_filtered = await client.get("/vessels?bbox=30.0,10.0,50.0,30.0")
        assert res_filtered.status_code == 200
        assert res_filtered.json()["count"] == 2
        mmsis = [v["mmsi"] for v in res_filtered.json()["vessels"]]
        assert 111 in mmsis
        assert 222 in mmsis

        # 3. Test invalid bbox format
        res_invalid = await client.get("/vessels?bbox=invalid")
        assert res_invalid.status_code == 400


@pytest.mark.asyncio
async def test_favorite_regions_crud(client, mock_firebase_admin):
    # 1. Sync user
    sync_res = await client.post("/auth/sync", headers=AUTH_HEADER, json={"name": "Test User"})
    assert sync_res.status_code == 201

    # 2. Add a favorite region
    payload = {"name": "Test Region", "bbox": [35.0, 10.0, 45.0, 20.0]}
    res_post = await client.post("/favorites/regions", headers=AUTH_HEADER, json=payload)
    assert res_post.status_code == 201
    data_post = res_post.json()
    assert data_post["name"] == "Test Region"
    assert data_post["bbox"] == [35.0, 10.0, 45.0, 20.0]

    # 3. Get favorite regions (verifies name serialization works)
    res_get = await client.get("/favorites/regions", headers=AUTH_HEADER)
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert len(data_get) >= 1
    assert data_get[0]["name"] == "Test Region"
    assert data_get[0]["bbox"] == [35.0, 10.0, 45.0, 20.0]


@pytest.mark.asyncio
async def test_species_hateoas(client, db_session):
    # Seed species
    from app.models.species import Species
    species = Species(
        id="thunnus-thynnus",
        common_name="Roter Thun",
        scientific_name="Thunnus thynnus",
        region="Mittelmeer",
        temp_min=15.0,
        temp_max=25.0,
        temp_mid=22.0,
        temp_range=10.0,
        radius_km=200,
        active=True
    )
    db_session.add(species)
    await db_session.commit()

    # Test list endpoint
    res_list = await client.get("/species/")
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert len(data_list) > 0
    for item in data_list:
        assert "links" in item
        links = item["links"]
        assert "self" in links
        assert "href" in links["self"]
        assert "method" in links["self"]
        assert "migration" in links
        assert "vessels" in links
        assert "overlap" in links
        assert "alerts" in links

    # Test detail endpoint
    species_id = data_list[0]["id"]
    res_detail = await client.get(f"/species/{species_id}")
    assert res_detail.status_code == 200
    data_detail = res_detail.json()
    assert "links" in data_detail
    links = data_detail["links"]
    assert links["self"]["href"] == f"/species/{species_id}"
    assert links["self"]["method"] == "GET"
    assert "migration" in links


@pytest.mark.asyncio
async def test_species_caching_and_etag(client, db_session):
    # Seed species
    from app.models.species import Species
    species = Species(
        id="thunnus-thynnus",
        common_name="Roter Thun",
        scientific_name="Thunnus thynnus",
        region="Mittelmeer",
        temp_min=15.0,
        temp_max=25.0,
        temp_mid=22.0,
        temp_range=10.0,
        radius_km=200,
        active=True
    )
    db_session.add(species)
    await db_session.commit()

    # 1. Fetch species and expect caching headers
    res = await client.get("/species/")
    assert res.status_code == 200
    assert "etag" in res.headers
    assert res.headers["cache-control"] == "public, max-age=86400"
    etag = res.headers["etag"]

    # 2. Re-request with If-None-Match header
    res_cached = await client.get("/species/", headers={"if-none-match": etag})
    assert res_cached.status_code == 304
    assert res_cached.text == ""


@pytest.mark.asyncio
async def test_migration_caching_and_etag(client, db_session):
    # Seed species
    from app.models.species import Species
    species = Species(
        id="thunnus-thynnus",
        common_name="Roter Thun",
        scientific_name="Thunnus thynnus",
        region="Mittelmeer",
        temp_min=15.0,
        temp_max=25.0,
        temp_mid=22.0,
        temp_range=10.0,
        radius_km=200,
        active=True
    )
    db_session.add(species)
    await db_session.commit()

    # Mock OBIS zone cache
    from app.services.obis_service import obis_service
    obis_service._zone_cache["thunnus-thynnus"] = {
        6: [
            {
                "center": {"lat": 40.0, "lng": 6.0},
                "radius_km": 200,
                "sighting_count": 100
            }
        ]
    }

    # 1. Fetch migration and expect caching headers
    res = await client.get("/species/thunnus-thynnus/migration?month=6")
    assert res.status_code == 200
    assert "etag" in res.headers
    assert res.headers["cache-control"] == "public, max-age=86400"
    etag = res.headers["etag"]

    # 2. Re-request with If-None-Match header
    res_cached = await client.get("/species/thunnus-thynnus/migration?month=6", headers={"if-none-match": etag})
    assert res_cached.status_code == 304
    assert res_cached.text == ""


