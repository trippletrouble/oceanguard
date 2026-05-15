from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import firebase_admin.auth
from app.database import get_db
from app.models.user import User
from app.schemas.auth import SyncRequest, UserResponse
from app.auth.dependencies import get_current_user, require_role

router = APIRouter()
security = HTTPBearer()


@router.post("/sync", response_model=UserResponse, summary="User synchronisieren")
async def sync_user(
    req: SyncRequest,
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials

    try:
        # 1. Firebase Token verifizieren
        decoded_token = firebase_admin.auth.verify_id_token(token)
        firebase_uid = decoded_token.get("uid")
        email = decoded_token.get("email")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Token: {str(e)}"
        )

    # 2. Prüfen, ob User bereits existiert
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if user:
        response.status_code = status.HTTP_200_OK
        return user

    # 3. Falls neu: User anlegen
    new_user = User(
        firebase_uid=firebase_uid,
        email=email,
        name=req.name,
        role="user"  # Standard-Rolle
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    response.status_code = status.HTTP_201_CREATED
    return new_user


@router.get("/me", response_model=UserResponse, summary="Aktuellen User abrufen")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", summary="Logout", status_code=204)
async def logout(current_user: User = Depends(get_current_user)):
    # Logout passiert client-seitig via Firebase signOut()
    return