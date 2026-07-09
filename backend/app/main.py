import json
import logging
from pathlib import Path
from contextlib import asynccontextmanager
import asyncio

# Configure logging - suppress SQLAlchemy and HTTP client noise
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Suppress verbose logs from external libraries
logging.getLogger('httpx').setLevel(logging.WARNING)  # Hide HTTP requests
logging.getLogger('httpcore').setLevel(logging.WARNING)  # Hide HTTP connection details

import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

logger = logging.getLogger(__name__)

from app.database import init_db, async_session
from app.models.species import Species
from app.routers import auth, species, marine, vessels, overlap, alerts, admin, favorites, reports
from app.services.obis_service import obis_service
from app.services.ais_service import ais_service

from datetime import datetime
app_start_time = datetime.now()  


# --- FIREBASE SETUP ---
def setup_firebase():
    """Initialisiert Firebase, falls noch nicht geschehen."""
    if not firebase_admin._apps:
        # Pfad flexibel halten
        cert_path = Path(__file__).parent / "firebase-service-account.json"
        cred = credentials.Certificate(str(cert_path))
        firebase_admin.initialize_app(cred)

# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup-Logik
    await init_db()
    setup_firebase()

    species_ids = list(obis_service.SPECIES_CONFIG.keys())
    logger.info(f"Loading {len(species_ids)} species migration data from OBIS...")
    
    # Load all species in parallel with increased timeout (45s)
    tasks = [obis_service.refresh_zones(sid) for sid in species_ids]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Log summary
    success_count = sum(1 for r in results if r is True)
    fail_count = len(results) - success_count
    
    if fail_count > 0:
        logger.warning(f"⚠️  {fail_count}/{len(results)} species failed to load. "
                      f"Some fish zones will not be visible on the map.")
        logger.warning(f"Failed species: {[sid for i, sid in enumerate(species_ids) if results[i] is not True]}")
    else:
        logger.info(f"✅ All {success_count} species loaded successfully!")

    #AIS stream
    asyncio.create_task(ais_service.connect_ais_stream())

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
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(species.router, prefix="/species", tags=["Species"])
app.include_router(marine.router, prefix="/marine-conditions", tags=["Marine"])
app.include_router(vessels.router, prefix="/vessels", tags=["Vessels"])
app.include_router(overlap.router, tags=["Overlap Analysis"])
app.include_router(alerts.router, tags=["Threat Alerts"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
