from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from ml_model import predictor
from models import Assessment, User
from schemas import AssessmentInput, PredictionResponse


router = APIRouter(tags=["predict"])


@router.post("/predict", response_model=PredictionResponse)
def predict(
    payload: AssessmentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = predictor.predict(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model prediction failed: {str(e)}"
        )

    try:
        assessment = Assessment(
            user_id=current_user.id,
            age=payload.age,
            study_hours=payload.study_hours,
            class_attendance=payload.class_attendance,
            exam_frequency=payload.exam_frequency,
            assignment_load=payload.assignment_load,
            sleep_hours=payload.sleep_hours,
            physical_exercise=payload.physical_exercise,
            social_media_use=payload.social_media_use,
            screen_time=payload.screen_time,
            peer_pressure=payload.peer_pressure,
            family_support=payload.family_support,
            anxiety_level=payload.anxiety_level,
            predicted_stress_level=result.stress_level,
            stress_score_numeric=result.stress_score,
            model_used=result.model_used,
        )
        db.add(assessment)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database save failed. Ensure DB schema is updated. Trace: {str(e)}"
        )

    return result

