from pydantic import BaseModel
from typing import Optional

class VesselResponse(BaseModel):
    mmsi: int
    name: Optional[str] = None

    shiptype: Optional[int | str] = None
    category: Optional[str] = None
    is_public: Optional[bool] = None
    classification_source: Optional[str] = None

    lat: Optional[float] = None
    lng: Optional[float] = None

    sog: Optional[float] = None
    cog: Optional[float] = None

    last_update: Optional[str] = None

class VesselListResponse(BaseModel):
    vessels: list[VesselResponse]
    count: int