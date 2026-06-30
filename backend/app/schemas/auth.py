from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SyncRequest(BaseModel):
    name: str

class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: str
    name: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)