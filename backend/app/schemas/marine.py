from pydantic import BaseModel

class MarineResponse(BaseModel):
    lat: float
    lng: float
    
    sea_surface_temperature: float