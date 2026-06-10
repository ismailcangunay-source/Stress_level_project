from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional, Dict, List

from pydantic import BaseModel, EmailStr, Field, ConfigDict


StressLevel = Literal["Low", "Medium", "High"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AssessmentInput(BaseModel):
    age: Optional[float] = None
    study_hours: Optional[float] = None
    class_attendance: Optional[float] = None
    exam_frequency: Optional[float] = None
    assignment_load: Optional[float] = None
    sleep_hours: Optional[float] = None
    physical_exercise: Optional[float] = None
    social_media_use: Optional[float] = None
    screen_time: Optional[float] = None
    peer_pressure: Optional[float] = None
    family_support: Optional[float] = None
    anxiety_level: Optional[float] = None


class PredictionResponse(BaseModel):
    stress_level: str
    stress_score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    model_used: str
    shap_values: Dict[str, float]
    recommendations: List[str]


class AssessmentPublic(BaseModel):
    id: int
    created_at: datetime
    predicted_stress_level: Optional[str] = None
    stress_score_numeric: Optional[float] = None
    model_used: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class HistoryStats(BaseModel):
    total_assessments: int
    average_score: Optional[float] = None
    latest_score: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)
