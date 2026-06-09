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
