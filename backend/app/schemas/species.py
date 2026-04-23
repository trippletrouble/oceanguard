from datetime import datetime
from pydantic import BaseModel


class SpeciesResponse(BaseModel):
    id: str
    common_name: str
    scientific_name: str
    region: str
    temp_min: float | None
    temp_max: float | None
    temp_mid: float | None
    temp_range: float | None
    radius_km: int
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
