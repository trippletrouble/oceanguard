from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import json
from pathlib import Path

SQL_ECHO = True

engine = create_async_engine(settings.database_url, echo=SQL_ECHO)
async_session = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session

async def init_db():
    import app.models  # ← NEU: alle Models laden!
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_species()


async def seed_species():
    from app.models.species import Species

    seed_path = Path(__file__).parent / "data" / "species_seed.json"
    with seed_path.open(encoding="utf-8") as seed_file:
        species_payload = json.load(seed_file)

    async with async_session() as session:
        for item in species_payload:
            species = await session.get(Species, item["id"])
            if species is None:
                session.add(Species(**item))
                continue

            for field, value in item.items():
                setattr(species, field, value)

        await session.commit()
