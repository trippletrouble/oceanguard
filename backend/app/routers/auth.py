from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import firebase_admin.auth

from app.database import get_db
from app.models.user import User
from app.schemas.auth import SyncRequest, UserResponse
from app.auth.dependencies import oauth2_scheme

router = APIRouter()

@router.post("/sync", response_model=UserResponse, summary="User synchronisieren")
async def sync_user(
    req: SyncRequest, 
    response: Response, 
    token: ***ENTFERNT*** = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
):
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
        role="user" # Standard-Rolle
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    response.status_code = status.HTTP_201_CREATED
    return new_user