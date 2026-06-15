from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    species_id: Mapped[str] = mapped_column(String, nullable=False)
    species_name: Mapped[str] = mapped_column(String, nullable=True)

    sea_surface_temp: Mapped[float] = mapped_column(Float, nullable=True)

    bbox: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)

    vessel_count: Mapped[int] = mapped_column(Integer, nullable=True)
    avg_score: Mapped[float] = mapped_column(Float, nullable=True)
    max_score: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
