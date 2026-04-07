"""
ML Model Eğitim Scripti
========================
Üniversite Öğrencileri Stres Tahmin Sistemi — Bitirme Projesi
İstanbul Topkapı Üniversitesi, Yazılım Mühendisliği

3 model karşılaştırır: LogisticRegression, RandomForest, XGBoost
En iyi modeli + scaler + label_encoder'ı ml/models/ klasörüne kaydeder.

Kullanım:
    python train_model.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent  # Stress_level_project/
DATA_PATH = ROOT / "university_student_stress_dataset.csv"
MODELS_DIR = ROOT / "ml" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Try the ml/data/ path as fallback
if not DATA_PATH.exists():
    DATA_PATH = ROOT / "ml" / "data" / "university_student_stress_dataset.csv"


def load_and_prepare() -> tuple[pd.DataFrame, pd.Series]:
    print(f"[1/6] Veri yükleniyor: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"      Boyut: {df.shape[0]} satır × {df.shape[1]} sütun")
    print(f"      Sütunlar: {list(df.columns)}")

    # DATA LEAKAGE — Stress_Score sütununu çıkar
    if "Stress_Score" in df.columns:
        df = df.drop(columns=["Stress_Score"])
        print("        Stress_Score sütunu data-leakage riski nedeniyle çıkarıldı.")

    # Hedef değişken
    if "Stress_Level" not in df.columns:
        raise ValueError("Veri setinde 'Stress_Level' sütunu bulunamadı!")

    X = df.drop(columns=["Stress_Level"])
    y = df["Stress_Level"]

    # Yalnızca sayısal sütunları al
    X = X.select_dtypes(include=[np.number])
    print(f"      Özellik sayısı: {X.shape[1]}")
    print(f"      Hedef dağılımı:\n{y.value_counts().to_string()}")

    # Eksik değer kontrolü
    missing = X.isnull().sum().sum()
    if missing > 0:
        print(f"      ⚠  {missing} eksik değer tespit edildi — medyan ile doldurulacak.")
        X = X.fillna(X.median())

    return X, y


def preprocess(X: pd.DataFrame, y: pd.Series):
    print("\n[2/6] Ön işleme (StandardScaler + LabelEncoder)...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    print(f"      Sınıf etiketleri: {list(le.classes_)}")

    return X_scaled, y_encoded, scaler, le


def train_and_evaluate(X_scaled, y_encoded, le):
    print("\n[3/6] Modeller eğitiliyor ve karşılaştırılıyor...")

    models = {
        "LogisticRegression": LogisticRegression(
            max_iter=1000, random_state=42, class_weight="balanced"
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200, random_state=42, class_weight="balanced", n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=6,
            random_state=42,
            eval_metric="mlogloss",
            use_label_encoder=False,
        ),
    }

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    results = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in models.items():
        print(f"\n  ── {name} ──────────────────────────")
        # 5-fold cross validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro")
        print(f"     5-Fold CV F1 (macro): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

        # Final eğitim
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="macro")
        cm = confusion_matrix(y_test, y_pred)

        print(f"     Test Accuracy: {acc:.4f}")
        print(f"     Test F1 (macro): {f1:.4f}")
        print(f"     Confusion Matrix:\n{cm}")
        print(f"\n     Classification Report:")
        print(classification_report(y_test, y_pred, target_names=le.classes_))

        results[name] = {
            "model": model,
            "acc": acc,
            "f1": f1,
            "cv_f1_mean": cv_scores.mean(),
            "cv_f1_std": cv_scores.std(),
        }

    return results, X_train, X_test, y_train, y_test


def select_best(results: dict) -> tuple[str, object]:
    print("\n[4/6] En iyi model seçiliyor...")
    best_name = max(results, key=lambda k: results[k]["f1"])
    best_info = results[best_name]
    print(f"     🏆 En iyi model: {best_name}")
    print(f"        Test F1   : {best_info['f1']:.4f}")
    print(f"        Test Acc  : {best_info['acc']:.4f}")
    return best_name, best_info["model"]


def compute_shap_values(model, X_test, feature_names: list[str], model_name: str):
    """SHAP feature importance hesapla ve kaydet."""
    print("\n[5/6] SHAP analizi yapılıyor...")
    try:
        import shap

        sample = X_test[:200]

        if model_name in ("RandomForest", "XGBoost"):
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(sample)
        else:
            # LinearExplainer for multiclass returns shape (n_samples, n_features) per class
            explainer = shap.LinearExplainer(model, sample)
            shap_values = explainer.shap_values(sample)

        # Normalize to list of 2D arrays (one per class)
        if isinstance(shap_values, np.ndarray):
            if shap_values.ndim == 3:
                # shape: (n_samples, n_features, n_classes) or (n_classes, n_samples, n_features)
                if shap_values.shape[2] == len(feature_names):
                    # (n_samples, n_classes, n_features) — swap axes
                    shap_list = [shap_values[:, c, :] for c in range(shap_values.shape[1])]
                else:
                    shap_list = [shap_values[c] for c in range(shap_values.shape[0])]
            else:
                shap_list = [shap_values]
        else:
            shap_list = shap_values  # already a list

        mean_abs = np.mean([np.abs(np.array(sv)).mean(axis=0) for sv in shap_list], axis=0)

        importance = {feat: float(val) for feat, val in zip(feature_names, mean_abs)}
        importance_sorted = dict(
            sorted(importance.items(), key=lambda kv: kv[1], reverse=True)
        )

        shap_path = MODELS_DIR / "shap_importance.json"
        with open(shap_path, "w", encoding="utf-8") as f:
            json.dump(importance_sorted, f, indent=2)
        print(f"     SHAP önem sıralaması kaydedildi: {shap_path}")
        print("     Top 5 özellik:")
        for i, (feat, val) in enumerate(list(importance_sorted.items())[:5], 1):
            print(f"       {i}. {feat}: {val:.4f}")
        return importance_sorted

    except Exception as e:
        print(f"       SHAP analizi başarısız ({e}), atlanıyor.")
        return {}


def save_artifacts(model, scaler, le, feature_names: list[str], model_name: str):
    print("\n[6/6] Artifaktlar kaydediliyor...")
    model_path = MODELS_DIR / "best_model.joblib"
    scaler_path = MODELS_DIR / "scaler.joblib"
    le_path = MODELS_DIR / "label_encoder.joblib"
    features_path = MODELS_DIR / "feature_names.json"

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(le, le_path)

    with open(features_path, "w", encoding="utf-8") as f:
        json.dump(feature_names, f, indent=2)

    # Model metadatası
    meta = {
        "model_name": model_name,
        "classes": list(le.classes_),
        "feature_names": feature_names,
        "n_features": len(feature_names),
    }
    with open(MODELS_DIR / "model_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"      best_model.joblib  → {model_path}")
    print(f"      scaler.joblib       → {scaler_path}")
    print(f"      label_encoder.joblib→ {le_path}")
    print(f"      feature_names.json  → {features_path}")
    print(f"      model_meta.json      → {MODELS_DIR / 'model_meta.json'}")


def main():
    print("=" * 60)
    print(" Stres Tahmin Modeli — Eğitim")
    print("=" * 60)

    X, y = load_and_prepare()
    feature_names = list(X.columns)
    X_scaled, y_encoded, scaler, le = preprocess(X, y)
    results, X_train, X_test, y_train, y_test = train_and_evaluate(X_scaled, y_encoded, le)
    best_name, best_model = select_best(results)
    compute_shap_values(best_model, X_test, feature_names, best_name)
    save_artifacts(best_model, scaler, le, feature_names, best_name)

    print("\n" + "=" * 60)
    print("  Model eğitimi tamamlandı!")
    print(f"    Kullanılan model: {best_name}")
    print(f"    Kayıt konumu: {MODELS_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
