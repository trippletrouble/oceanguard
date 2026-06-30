from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SpeciesBase(BaseModel):
    common_name: str
    scientific_name: str
    description: str | None = None
    region: str
    temp_min: float | None = None
    temp_max: float | None = None
    temp_mid: float | None = None
    temp_range: float | None = None
    radius_km: int = 200
    active: bool = True


class SpeciesCreate(SpeciesBase):
    id: str  # Slug z.B. "thunnus-thynnus" — wird vom Admin gesetzt


class SpeciesUpdate(SpeciesBase):
    # PUT → alle Felder Pflicht (geerbt von SpeciesBase, kein Optional)
    pass


class SpeciesPatch(BaseModel):
    # PATCH → alle Felder optional
    common_name: str | None = None
    scientific_name: str | None = None
    description: str | None = None
    region: str | None = None
    temp_min: float | None = None
    temp_max: float | None = None
    temp_mid: float | None = None
    temp_range: float | None = None
    radius_km: int | None = None
    active: bool | None = None


class SpeciesResponse(SpeciesBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)