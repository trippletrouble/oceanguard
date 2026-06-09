from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.services.overlap_service import compute_overlap

router = APIRouter(prefix="/alerts", tags=["Threat Alerts"])


@router.get(
    "",
    summary="Aktive Warnungen abrufen",
    description="Gibt nur Schiffe mit Score >= 0.4 zurück (WARNUNG + KRITISCH). Parameter: species (Pflicht). **Rolle: Gast.**",
    responses={
        200: {"description": "Alert-Liste (kann leer sein)"},
        404: {"description": "Art nicht gefunden"}
    }
)
async def get_active_threat_alerts(
        species_id: str = Query(..., description="The species ID (e.g., 'sardina-pilchardus')"),
        db: AsyncSession = Depends(get_db)
):
    current_month = datetime.now().month

    try:
        analysis_payload = await compute_overlap(
            species_id=species_id,
            month=current_month,
            db=db
        )

        tracked_vessels = analysis_payload.get("tracked_vessels", [])

        actionable_alerts = [
            {
                "mmsi": str(vessel["mmsi"]),
                "vessel_name": vessel["vessel_name"],
                "species_id": species_id,
                "score": vessel["score"],
                "risk_level": vessel["level"],
                "message": f"Fishing vessel operating inside critical distribution zone of species: {species_id}"
            }
            for vessel in tracked_vessels
            if vessel.get("score", 0.0) >= 0.4 or vessel.get("level") in ["WARNING", "CRITICAL"]
        ]

        return actionable_alerts

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compile the active threat intelligence feed: {str(e)}"
        )