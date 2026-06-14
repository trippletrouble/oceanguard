import asyncio
from sqlalchemy import select
from app.database import async_session
from app.models.user import User

async def main():
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == "naren@test.de"))
        user = result.scalar_one_or_none()
        if user:
            user.role = "admin"
            await session.commit()
            print("✅ naren@test.de is now admin")
        else:
            print("❌ naren@test.de not found")

if __name__ == "__main__":
    asyncio.run(main())
