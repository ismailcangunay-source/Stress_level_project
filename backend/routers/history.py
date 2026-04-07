from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Assessment, User
from schemas import AssessmentPublic, HistoryStats


router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[AssessmentPublic])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .all()
    )
    return rows


@router.get("/stats", response_model=HistoryStats)
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(func.count(Assessment.id)).filter(Assessment.user_id == current_user.id).scalar() or 0
    avg = (
        db.query(func.avg(Assessment.stress_score_numeric))
        .filter(Assessment.user_id == current_user.id)
        .scalar()
    )
    latest = (
        db.query(Assessment.stress_score_numeric)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .limit(1)
        .scalar()
    )
    return HistoryStats(
        total_assessments=int(total),
        average_score=float(avg) if avg is not None else None,
        latest_score=float(latest) if latest is not None else None,
    )

