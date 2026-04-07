from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    assessments: Mapped[List["Assessment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)

    age: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    study_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    class_attendance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exam_frequency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    assignment_load: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sleep_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    physical_exercise: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    social_media_use: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    screen_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    peer_pressure: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    family_support: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    anxiety_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    predicted_stress_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    stress_score_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_used: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="assessments")
