import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.species import Species
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse
from app.services.overlap_service import compute_overlap

router = APIRouter()

@router.get("", response_model=list[ReportResponse])
async def get_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Report)
        .where(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
    )
    return result.scalars().all()

@router.post("", status_code=201, response_model=ReportResponse)
async def create_report(
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    overlap_result = await compute_overlap(
        species_id=data.species_id,
        month=data.month,
        db=db
    )

    species = await db.get(Species, data.species_id)
    common_name = species.common_name if species else data.species_id

    stats_data = overlap_result.get("stats", {})
    v_count = stats_data.get("vessels_tracked_count", 0)
    avg_score = stats_data.get("average_threat_score", 0.0)
    max_score = stats_data.get("maximum_threat_score", 0.0)

    metadata_list = overlap_result.get("zone_metadata", [])
    primary_zone_weather = metadata_list[0] if metadata_list else {}

    sst_val = primary_zone_weather.get("sea_surface_temperature_celsius")

    report = Report(
        user_id=current_user.id,
        species_id=data.species_id,
        species_name=common_name,

        bbox=data.bbox,
        month=data.month,

        sea_surface_temp=sst_val,

        snapshot=overlap_result,
        vessel_count=v_count,
        avg_score=avg_score,
        max_score=max_score
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report

@router.get("/compare")
async def compare_reports(
    ids: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        id1, id2 = [int(x.strip()) for x in ids.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report IDs format. ids must be two comma-separated integers.")
    
    r1 = await db.get(Report, id1)
    r2 = await db.get(Report, id2)

    if not r1 or r1.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Report with id {id1} not found or does not belong to the user.")
    if not r2 or r2.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Report with id {id2} not found or does not belong to the user.")
    if r1.species_id != r2.species_id:
        raise HTTPException(status_code=400, detail="Reports must be for the same species to compare.")
    
    return {
        "report_1": r1,
        "report_2": r2,
        "metrics_difference": {
            "vessel_count_difference": r2.vessel_count - r1.vessel_count,
            "average_threat_difference": round(r2.avg_score - r1.avg_score, 4),
            "maximum_threat_difference": round((r2.max_score or 0.0) - (r1.max_score or 0.0), 4),

            "temperature_delta_celsius": round((r2.sea_surface_temp or 0.0) - (r1.sea_surface_temp or 0.0), 2) if r1.sea_surface_temp and r2.sea_surface_temp else None,
        }
    }

@router.get("/{report_id}")
async def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report

@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    report = await db.get(Report, report_id)
    if not report or report.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Report not found.")
    
    await db.delete(report)
    await db.commit()