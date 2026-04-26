import json
from pathlib import Path
from contextlib import asynccontextmanager

import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.database import init_db, async_session
from app.models.species import Species
from app.routers import auth

from app.routers import species

# --- FIREBASE SETUP ---
def setup_firebase():
    """Initialisiert Firebase, falls noch nicht geschehen."""
    if not firebase_admin._apps:
        # Pfad flexibel halten
        cert_path = Path(__file__).parent / "firebase-service-account.json"
        cred = credentials.Certificate(str(cert_path))
        firebase_admin.initialize_app(cred)

# --- DATABASE SEEDING ---
async def seed_database():
    """Lädt initiale Daten in die Datenbank."""
    async with async_session() as db:
        # Prüfen, ob bereits Daten vorhanden sind
        existing = await db.execute(select(Species).limit(1))
        if existing.scalar():
            return

        seed_file = Path(__file__).parent / "data" / "species_seed.json"
        if seed_file.exists():
            with open(seed_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                db.add_all([Species(**item) for item in data])
                await db.commit()
                print(f"Database seeded with {len(data)} species.")

# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup-Logik
    await init_db()
    setup_firebase()
    await seed_database()
    yield
    # Shutdown-Logik hier (falls nötig)

# --- APP INITIALIZATION ---
app = FastAPI(
    title="OceanGuard API",
    version="1.0.0",
    description="Backend for monitoring maritime conservation zones",
    lifespan=lifespan
)

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Im Production-Mode später auf eure Domain einschränken!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTERS ---
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "online",
        "message": "OceanGuard API is running smoothly."
    }

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(species.router, prefix="/api/species", tags=["Species"]) 