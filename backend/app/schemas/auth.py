from datetime import datetime
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: ***ENTFERNT***


class LoginRequest(BaseModel):
    email: EmailStr
    password: ***ENTFERNT***


class TokenResponse(BaseModel):
    access_token: ***ENTFERNT***
    token_type: ***ENTFERNT*** = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
