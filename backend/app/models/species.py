from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Species(Base):
    __tablename__ = "species"

    id: Mapped[str] = mapped_column(String, primary_key=True)  
    common_name: Mapped[str] = mapped_column(String, nullable=False)
    scientific_name: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, nullable=False)
    temp_min: Mapped[float] = mapped_column(Float, nullable=True)
    temp_max: Mapped[float] = mapped_column(Float, nullable=True)
    temp_mid: Mapped[float] = mapped_column(Float, nullable=True)      # T_mitte für Score
    temp_range: Mapped[float] = mapped_column(Float, nullable=True)    # R für Score
    radius_km: Mapped[int] = mapped_column(Integer, default=200)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
