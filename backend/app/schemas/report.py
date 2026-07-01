from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, List, Optional

class ReportCreate(BaseModel):
    species_id: str
    month: int
    bbox: list[float]  # [min_lat, min_lon, max_lat, max_lon]

class ReportResponse(BaseModel):
    id: int
    user_id: int
    species_id: str
    species_name: Optional[str] = None
    month: int
    bbox: List[float]

    sea_surface_temp: Optional[float]=None

    vessel_count: int
    avg_score: float
    max_score: Optional[float] = None
    snapshot: Dict[str, Any]
    created_at: Any

    model_config = ConfigDict(from_attributes=True)