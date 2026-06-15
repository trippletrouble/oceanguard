from pydantic import BaseModel

class FavoriteSpeciesCreate(BaseModel):
    species_id: str

class FavoriteSpeciesResponse(BaseModel):
    id: int
    species_id: str
    user_id: int

    class Config:
        from_attributes = True

class FavoriteRegionCreate(BaseModel):
    name: str
    bbox: list[float] # [min_lat, min_lon, max_lat, max_lon]

class FavoriteRegionResponse(BaseModel):
    id: int
    name: str
    user_id: int
    bbox: list[float]

    class Config:
        from_attributes = True