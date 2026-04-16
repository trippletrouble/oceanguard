from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, species, vessels, overlap, marine, alerts, favorites, reports, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    # TODO: AISstream background task starten
    # TODO: OBIS-Daten initial laden
    yield
    # Shutdown
    pass

app = FastAPI(title="OceanGuard API", version="1.0.0", lifespan=lifespan)

# CORS für Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router einbinden
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(species.router, prefix="/api/species", tags=["Species"])
app.include_router(vessels.router, prefix="/api/vessels", tags=["Vessels"])
app.include_router(overlap.router, prefix="/api/overlap", tags=["Overlap"])
app.include_router(marine.router, prefix="/api/marine-conditions", tags=["Marine"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["Favorites"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
async def root():
    return {"message": "OceanGuard API v1.0.0"}