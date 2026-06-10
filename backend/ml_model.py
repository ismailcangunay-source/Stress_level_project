from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np

from schemas import AssessmentInput, PredictionResponse


class StressPredictor:
    """
    Loads trained artifacts when available; otherwise falls back to a deterministic mock.
    Supports SHAP-based feature importance for explanation.
    """

    def __init__(self) -> None:
        self._loaded = False
        self._model = None
        self._scaler = None
        self._label_encoder = None
        self._feature_names: list[str] = []
        self._shap_importance: dict[str, float] = {}

    def try_load(self) -> None:
        model_dir = Path(
            os.getenv("MODEL_DIR", Path(__file__).resolve().parent.parent / "ml" / "models")
        )
        model_path = model_dir / "best_model.joblib"
        scaler_path = model_dir / "scaler.joblib"
        le_path = model_dir / "label_encoder.joblib"
        features_path = model_dir / "feature_names.json"
        shap_path = model_dir / "shap_importance.json"

        if model_path.exists() and scaler_path.exists() and le_path.exists():
            self._model = joblib.load(model_path)
            self._scaler = joblib.load(scaler_path)
            self._label_encoder = joblib.load(le_path)
            self._loaded = True
            print(f"[ml_model] Loaded model: {type(self._model).__name__}")

        if features_path.exists():
            with open(features_path, encoding="utf-8") as f:
                self._feature_names = json.load(f)
            print(f"[ml_model] Features: {self._feature_names}")

        if shap_path.exists():
            with open(shap_path, encoding="utf-8") as f:
                self._shap_importance = json.load(f)
            print(f"[ml_model] SHAP importance loaded: {list(self._shap_importance.keys())[:5]}")

    def _build_feature_array(self, data: AssessmentInput) -> np.ndarray:
        """Build feature array matching training feature order."""
        # Mapping from feature_names.json keys to AssessmentInput fields
        field_map = {
            "Age": data.age,
            "Study_Hours": data.study_hours,
            "Class_Attendance": data.class_attendance,
            "Exam_Frequency": data.exam_frequency,
            "Assignment_Load": data.assignment_load,
            "Sleep_Hours": data.sleep_hours,
            "Physical_Exercise": data.physical_exercise,
            "Social_Media_Use": data.social_media_use,
            "Screen_Time": data.screen_time,
            "Peer_Pressure": data.peer_pressure,
            "Family_Support": data.family_support,
            "Anxiety_Level": data.anxiety_level,
        }

        if self._feature_names:
            vals = [float(field_map.get(fn, 0.0) or 0.0) for fn in self._feature_names]
        else:
            # Fallback: fixed order
            vals = [
                data.age or 0.0,
                data.study_hours or 0.0,
                data.class_attendance or 0.0,
                data.exam_frequency or 0.0,
                data.assignment_load or 0.0,
                data.sleep_hours or 0.0,
                data.physical_exercise or 0.0,
                data.social_media_use or 0.0,
                data.screen_time or 0.0,
                data.peer_pressure or 0.0,
                data.family_support or 0.0,
                data.anxiety_level or 0.0,
            ]

        arr = np.array([vals], dtype=float)
        return np.nan_to_num(arr, nan=0.0)

    def _compute_live_shap(self, X_scaled: np.ndarray) -> dict[str, float]:
        """Compute SHAP values for a single prediction using the loaded model."""
        try:
            import shap

            model_name = type(self._model).__name__
            if model_name in ("RandomForestClassifier", "XGBClassifier"):
                explainer = shap.TreeExplainer(self._model)
            else:
                # For LinearExplainer we need background data; use a zero-baseline
                background = np.zeros((1, X_scaled.shape[1]))
                explainer = shap.LinearExplainer(self._model, background)

            shap_values = explainer.shap_values(X_scaled)

            # Handle multi-class: pick the class with highest probability
            proba = getattr(self._model, "predict_proba", None)
            if proba:
                probs = proba(X_scaled)[0]
                best_class = int(np.argmax(probs))
            else:
                best_class = 0

            if isinstance(shap_values, list):
                sv = np.array(shap_values[best_class])[0]
            elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                sv = shap_values[0, best_class, :]
            else:
                sv = np.array(shap_values)[0]

            feat_names = self._feature_names if self._feature_names else [f"f{i}" for i in range(len(sv))]
            return {feat: float(val) for feat, val in zip(feat_names, sv)}

        except Exception as exc:
            print(f"[ml_model] Live SHAP failed: {exc}")
            # Fall back to pre-computed global importance
            return self._shap_importance.copy()

    def predict(self, data: AssessmentInput) -> PredictionResponse:
        if self._loaded:
            features = self._build_feature_array(data)
            X = self._scaler.transform(features)

            proba_fn = getattr(self._model, "predict_proba", None)
            if proba_fn:
                probs = proba_fn(X)[0]
                idx = int(np.argmax(probs))
                confidence = float(probs[idx])
            else:
                idx = int(self._model.predict(X)[0])
                confidence = 0.6

            label = self._label_encoder.inverse_transform([idx])[0]
            stress_level = str(label)

            # Map label index to 0-100 score (High=2→100, Medium=1→50, Low=0→0)
            classes = list(self._label_encoder.classes_)
            label_to_score = {"Low": 20.0, "Medium": 55.0, "High": 85.0}
            score = label_to_score.get(stress_level, float((idx / max(len(classes) - 1, 1)) * 100))

            # Refine score using class probability
            if proba_fn and confidence > 0:
                score = float(min(100.0, max(0.0, score + (confidence - 0.5) * 20.0)))

            shap_values = self._compute_live_shap(X)
            model_used = type(self._model).__name__

            # Safety clamping for API validation
            score = float(max(0.0, min(100.0, score)))
            confidence = float(max(0.0, min(1.0, confidence)))
        else:
            # Mock heuristic — deterministic until model artifacts exist
            anxiety = (data.anxiety_level or 0) / 10.0
            sleep = (data.sleep_hours or 0) / 10.0
            study = min((data.study_hours or 0) / 10.0, 1.0)
            exercise = min((data.physical_exercise or 0) / 7.0, 1.0)

            raw = 0.55 * anxiety + 0.25 * study + 0.25 * (1 - sleep) + 0.15 * (1 - exercise)
            score = float(min(100.0, max(0.0, raw * 100.0)))
            if score >= 70:
                stress_level = "High"
            elif score >= 40:
                stress_level = "Medium"
            else:
                stress_level = "Low"
            confidence = 0.55
            model_used = "MockHeuristic"
            shap_values = {
                "Anxiety_Level": float(0.55 * anxiety),
                "Sleep_Hours": float(-0.25 * sleep),
                "Study_Hours": float(0.25 * study),
                "Physical_Exercise": float(-0.15 * exercise),
            }

        recommendations = _recommend(stress_level, data)

        # Final safety check before serialization
        final_score = float(max(0.0, min(100.0, score)))
        final_confidence = float(max(0.0, min(1.0, confidence)))

        return PredictionResponse(
            stress_level=stress_level,
            stress_score=round(final_score, 2),
            confidence=round(final_confidence, 2),
            model_used=model_used,
            shap_values=_top5(shap_values),
            recommendations=recommendations,
        )


def _top5(values: dict[str, float]) -> dict[str, float]:
    return dict(sorted(values.items(), key=lambda kv: abs(kv[1]), reverse=True)[:5])


def _recommend(stress_level: str, data: AssessmentInput) -> list[str]:
    recs: list[str] = []
    if stress_level == "High":
        if (data.sleep_hours or 0) < 6:
            recs.append("Uyku sürenizi 7 saatin üzerine çıkarmanız stres yönetiminde en etkili adımdır.")
        if (data.anxiety_level or 0) > 7:
            recs.append("Kaygı düzeyiniz yüksek görünüyor; bir danışman veya psikologla görüşmeyi değerlendirin.")
        if (data.physical_exercise or 0) < 2:
            recs.append("Haftada en az 3 gün 30 dakika egzersiz yapmak stres hormonu kortizolü düşürür.")
        recs.append("Çalışma seanslarınızı 50 dakika çalış / 10 dakika mola şeklinde düzenleyin (Pomodoro).")
        recs.append("Günlük 5 dakika nefes egzersizi veya meditasyon deneyin.")
    elif stress_level == "Medium":
        if (data.study_hours or 0) > 8:
            recs.append("Uzun çalışma sürelerini bloklara bölerek düzenli mola verin.")
        if (data.social_media_use or 0) > 4:
            recs.append("Sosyal medya kullanımını günde 2 saatle sınırlandırmayı deneyin.")
        recs.append("Küçük bir günlük rutin oluşturun: su içmek, kısa yürüyüş, sabit uyku saati.")
        recs.append("Arkadaşlarınızla sosyal zaman geçirmek stresi hafifletebilir.")
    else:
        recs.append("Stres göstergeleriniz iyi görünüyor — mevcut alışkanlıklarınızı sürdürün.")
        recs.append("Düzenli uyku ve egzersiz rutininizi koruyarak bu dengeyi devam ettirin.")
    return recs


predictor = StressPredictor()
