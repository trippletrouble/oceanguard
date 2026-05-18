from pydantic import BaseModel
from typing import Optional

class MarineResponse(BaseModel):
    lat: float
    lng: float
    
    sea_surface_temperature: Optional[float] = None