from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    species_id: Mapped[str] = mapped_column(String, nullable=False)
    bbox: Mapped[str] = mapped_column(String, nullable=False)       # JSON string
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[str] = mapped_column(String, nullable=False)   # JSON string
    vessel_count: Mapped[int] = mapped_column(Integer, nullable=True)
    avg_score: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
