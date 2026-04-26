from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import firebase_admin.auth

from app.database import get_db
from app.models.user import User

# OAuth2-Standard für den Professor. 
# tokenUrl zeigt auf sync, damit Swagger den Pfad findet.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/sync")

async def get_current_user(
    token: ***ENTFERNT*** = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        # 1. Token direkt gegen Firebase prüfen
        decoded_token = firebase_admin.auth.verify_id_token(token)
        uid = decoded_token.get("uid")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Token: {str(e)}"
        )

    # 2. User in lokaler DB suchen
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User verified but not synced to local database."
        )

    return user

def require_role(role: str):
    """Factory für Rollen-Prüfung (z.B. für Admin-Bereiche)."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role != role and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Access denied"
            )
        return user
    return role_checker