from datetime import datetime
from pydantic import BaseModel

class SyncRequest(BaseModel):
    name: str

class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: str
    name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True