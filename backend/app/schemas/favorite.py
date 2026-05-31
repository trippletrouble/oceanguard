from pydantic import BaseModel

class FavoriteSpeciesCreate(BaseModel):
    species_id: str

class FavoriteSpeciesResponse(BaseModel):
    id: int
    species_id: str
    user_id: int

    class Config:
        from_attributes = True