from pydantic import BaseModel, ConfigDict

class FavoriteSpeciesCreate(BaseModel):
    species_id: str

class FavoriteSpeciesResponse(BaseModel):
    id: int
    species_id: str
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class FavoriteRegionCreate(BaseModel):
    name: str
    bbox: list[float] # [min_lat, min_lon, max_lat, max_lon]

class FavoriteRegionResponse(BaseModel):
    id: int
    name: str
    user_id: int
    bbox: list[float]

    model_config = ConfigDict(from_attributes=True)