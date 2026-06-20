from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Assessment, User
from schemas import AssessmentPublic, HistoryStats

logger = logging.getLogger("history")

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[AssessmentPublic])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        rows = (
            db.query(Assessment)
            .filter(Assessment.user_id == current_user.id)
            .order_by(Assessment.created_at.desc())
            .all()
        )
        logger.info(f"[history] user={current_user.email} returned {len(rows)} assessments")
        return rows
    except Exception as e:
        logger.error(f"[history] DB read failed for user={current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load history from DB. Schema error?: {str(e)}"
        )


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        assessment = db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.user_id == current_user.id
        ).first()
        
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found or not owned by user."
            )
            
        db.delete(assessment)
        db.commit()
        logger.info(f"[history] user={current_user.email} deleted assessment {assessment_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[history] DB delete failed for user={current_user.email}, id={assessment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete history from DB: {str(e)}"
        )


@router.get("/stats", response_model=HistoryStats)
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        from datetime import datetime, timedelta

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

        # 30-day average
        cutoff = datetime.utcnow() - timedelta(days=30)
        avg_30 = (
            db.query(func.avg(Assessment.stress_score_numeric))
            .filter(
                Assessment.user_id == current_user.id,
                Assessment.created_at >= cutoff,
            )
            .scalar()
        )

        # Trend status: compare latest vs 30-day average (threshold: 5 points)
        trend_status = "insufficient_data"
        if latest is not None and avg_30 is not None:
            diff = float(latest) - float(avg_30)
            if diff < -5:
                trend_status = "improving"
            elif diff > 5:
                trend_status = "worsening"
            else:
                trend_status = "stable"

        result = HistoryStats(
            total_assessments=int(total),
            average_score=float(avg) if avg is not None else None,
            latest_score=float(latest) if latest is not None else None,
            last_30_days_average=float(avg_30) if avg_30 is not None else None,
            trend_status=trend_status,
        )
        logger.info(f"[stats] user={current_user.email} total={total} avg30={avg_30} latest={latest} trend={trend_status}")
        return result
    except Exception as e:
        logger.error(f"[stats] DB read failed for user={current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute stats from DB: {str(e)}"
        )
