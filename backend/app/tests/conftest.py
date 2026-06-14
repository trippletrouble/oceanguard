import pytest
import pytest_asyncio
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import Base, get_db
from app.main import app

# Separate Test-DB (in-memory)
TEST_DATABASE_URL = "sqlite+aiosqlite://"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Erstellt alle Tabellen vor jedem Test, löscht sie danach."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as c:
        yield c


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


def _mock_firebase_token(uid="test-uid-123", email="test@test.de", name="Test User"):
    """Helper: gibt ein Mock-Firebase-Token-Dict zurück."""
    return {"uid": uid, "email": email, "name": name, "email_verified": True}


@pytest.fixture
def mock_firebase():
    """Mockt firebase_admin.auth.verify_id_token für einen Standard-User."""
    with patch("firebase_admin.auth.verify_id_token") as mock:
        mock.return_value = _mock_firebase_token()
        yield mock


@pytest.fixture
def mock_firebase_admin():
    """Mockt firebase_admin.auth.verify_id_token für einen Admin-User."""
    with patch("firebase_admin.auth.verify_id_token") as mock:
        mock.return_value = _mock_firebase_token(uid="admin-uid-456", email="admin@test.de", name="Admin User")
        yield mock


AUTH_HEADER = {"Authorization": "Bearer fake-token-for-testing"}
