"""
GigShield - Dynamic Premium Model
XGBoost Regressor: risk features → risk_score (0–1) → weekly premium (₹49–₹89)

Usage:
    train:   python premium_model.py
    import:  from premium_model import load_premium_model, predict_premium
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from dataclasses import dataclass

from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import OrdinalEncoder

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MODEL_PATH    = Path("models/premium_model.joblib")
ENCODER_PATH  = Path("models/premium_encoder.joblib")

FEATURE_COLS = [
    "zone",
    "month",
    "zone_disruption_freq",
    "flood_risk",
    "fog_risk",
    "heat_risk",
    "aqi_base",
    "month_risk",
    "weather_severity",
    "aqi_level",
    "traffic_disruption",
    "worker_tenure_weeks",
    "worker_claim_ratio",
]
TARGET_COL = "risk_score"

BASE_PREMIUM    = 49.0   # ₹ per week
MAX_PREMIUM     = 89.0   # ₹ per week
PREMIUM_RANGE   = MAX_PREMIUM - BASE_PREMIUM   # 40

# Seasonal risk by month
MONTH_RISK = {
    1: 0.25, 2: 0.20, 3: 0.25, 4: 0.30,
    5: 0.35, 6: 0.40, 7: 0.45, 8: 0.50,
    9: 0.55, 10: 0.85, 11: 0.90, 12: 0.75,
}

ZONE_DEFAULTS = {
    "Connaught Place":    {"zone_disruption_freq": 0.28, "flood_risk": 0.30, "fog_risk": 0.55, "heat_risk": 0.70, "aqi_base": 0.72},
    "Lajpat Nagar":       {"zone_disruption_freq": 0.32, "flood_risk": 0.45, "fog_risk": 0.50, "heat_risk": 0.68, "aqi_base": 0.75},
    "Rohini":             {"zone_disruption_freq": 0.35, "flood_risk": 0.50, "fog_risk": 0.70, "heat_risk": 0.72, "aqi_base": 0.80},
    "Dwarka":             {"zone_disruption_freq": 0.38, "flood_risk": 0.60, "fog_risk": 0.65, "heat_risk": 0.70, "aqi_base": 0.78},
    "Saket":              {"zone_disruption_freq": 0.25, "flood_risk": 0.35, "fog_risk": 0.50, "heat_risk": 0.65, "aqi_base": 0.70},
    "Janakpuri":          {"zone_disruption_freq": 0.30, "flood_risk": 0.40, "fog_risk": 0.60, "heat_risk": 0.68, "aqi_base": 0.76},
    "Shahdara":           {"zone_disruption_freq": 0.40, "flood_risk": 0.65, "fog_risk": 0.60, "heat_risk": 0.72, "aqi_base": 0.85},
    "Noida Sector 18":    {"zone_disruption_freq": 0.30, "flood_risk": 0.45, "fog_risk": 0.58, "heat_risk": 0.70, "aqi_base": 0.74},
    "Gurugram Sector 29": {"zone_disruption_freq": 0.28, "flood_risk": 0.50, "fog_risk": 0.55, "heat_risk": 0.68, "aqi_base": 0.72},
    "Mayur Vihar":        {"zone_disruption_freq": 0.35, "flood_risk": 0.55, "fog_risk": 0.58, "heat_risk": 0.70, "aqi_base": 0.80},
    "Karol Bagh":         {"zone_disruption_freq": 0.33, "flood_risk": 0.42, "fog_risk": 0.55, "heat_risk": 0.72, "aqi_base": 0.82},
    "Vasant Kunj":        {"zone_disruption_freq": 0.22, "flood_risk": 0.30, "fog_risk": 0.48, "heat_risk": 0.65, "aqi_base": 0.68},
}


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train_premium_model(data_path: str = "data/premium_train.csv") -> None:
    print("=== Training Premium Risk Model ===")
    df = pd.read_csv(data_path)

    # Encode zone (ordinal — XGBoost handles it fine with enable_categorical)
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    df["zone"] = encoder.fit_transform(df[["zone"]])

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42
    )

    model = XGBRegressor(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
        eval_metric="mae",
        early_stopping_rounds=30,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    preds = model.predict(X_val)
    mae   = mean_absolute_error(y_val, preds)
    r2    = r2_score(y_val, preds)
    print(f"  Validation MAE (risk_score): {mae:.4f}")
    print(f"  Validation R²:              {r2:.4f}")

    # Premium MAE in rupees
    premium_mae = mae * PREMIUM_RANGE
    print(f"  Approx premium MAE:         ₹{premium_mae:.2f}")

    Path("models").mkdir(exist_ok=True)
    joblib.dump(model,   MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    print(f"  Model saved  → {MODEL_PATH}")
    print(f"  Encoder saved→ {ENCODER_PATH}")


# ---------------------------------------------------------------------------
# Inference helpers
# ---------------------------------------------------------------------------
def load_premium_model():
    model   = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    return model, encoder


@dataclass
class PremiumResult:
    zone:               str
    month:              int
    risk_score:         float
    weekly_premium_inr: float
    risk_tier:          str       # LOW / MEDIUM / HIGH
    breakdown: dict


def risk_tier(score: float) -> str:
    if score < 0.33:  return "LOW"
    if score < 0.66:  return "MEDIUM"
    return "HIGH"


def predict_premium(
    zone:                 str,
    month:                int,
    weather_severity:     float,
    aqi_level:            float,
    traffic_disruption:   float,
    worker_tenure_weeks:  int,
    worker_claim_ratio:   float,
    model=None,
    encoder=None,
) -> PremiumResult:
    if model is None or encoder is None:
        model, encoder = load_premium_model()

    zone_info  = ZONE_DEFAULTS.get(zone, {
        "zone_disruption_freq": 0.30, "flood_risk": 0.45,
        "fog_risk": 0.58, "heat_risk": 0.70, "aqi_base": 0.76
    })
    month_risk = MONTH_RISK.get(month, 0.55)

    row = pd.DataFrame([{
        "zone":                  zone,
        "month":                 month,
        "zone_disruption_freq":  zone_info["zone_disruption_freq"],
        "flood_risk":            zone_info["flood_risk"],
        "fog_risk":              zone_info["fog_risk"],
        "heat_risk":             zone_info["heat_risk"],
        "aqi_base":              zone_info["aqi_base"],
        "month_risk":            month_risk,
        "weather_severity":      weather_severity,
        "aqi_level":             aqi_level,
        "traffic_disruption":    traffic_disruption,
        "worker_tenure_weeks":   worker_tenure_weeks,
        "worker_claim_ratio":    worker_claim_ratio,
    }])

    row["zone"] = encoder.transform(row[["zone"]])
    raw_score   = float(model.predict(row[FEATURE_COLS])[0])
    score       = float(np.clip(raw_score, 0.0, 1.0))
    premium     = round(BASE_PREMIUM + score * PREMIUM_RANGE, 2)

    return PremiumResult(
        zone               = zone,
        month              = month,
        risk_score         = round(score, 4),
        weekly_premium_inr = premium,
        risk_tier          = risk_tier(score),
        breakdown = {
            "zone_disruption_freq": zone_info["zone_disruption_freq"],
            "flood_risk":           zone_info["flood_risk"],
            "month_risk":           month_risk,
            "weather_severity":     weather_severity,
            "aqi_level":            aqi_level,
            "traffic_disruption":   traffic_disruption,
            "worker_claim_ratio":   worker_claim_ratio,
        },
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from data_generator import generate_premium_data

    data_path = Path("data/premium_train.csv")
    if not data_path.exists():
        print("Generating premium training data first...")
        Path("data").mkdir(exist_ok=True)
        generate_premium_data(6000).to_csv(data_path, index=False)

    train_premium_model(str(data_path))

    print("\n=== Inference smoke test ===")
    model, encoder = load_premium_model()

    # Low risk: mild March, Saket (cleaner zone), new worker
    r1 = predict_premium(
        zone="Saket", month=3,
        weather_severity=0.10, aqi_level=0.35,
        traffic_disruption=0.10, worker_tenure_weeks=2,
        worker_claim_ratio=0.05,
        model=model, encoder=encoder,
    )
    print(f"  Low risk  ({r1.zone}, Mar): score={r1.risk_score}  "
          f"premium=₹{r1.weekly_premium_inr}  tier={r1.risk_tier}")

    # High risk: November Shahdara — peak AQI (Diwali) + high disruption zone
    r2 = predict_premium(
        zone="Shahdara", month=11,
        weather_severity=0.75, aqi_level=0.92,
        traffic_disruption=0.70, worker_tenure_weeks=80,
        worker_claim_ratio=0.45,
        model=model, encoder=encoder,
    )
    print(f"  High risk ({r2.zone}, Nov): score={r2.risk_score}  "
          f"premium=₹{r2.weekly_premium_inr}  tier={r2.risk_tier}")

    # Mid risk: August Dwarka — monsoon floods, moderate AQI
    r3 = predict_premium(
        zone="Dwarka", month=8,
        weather_severity=0.80, aqi_level=0.55,
        traffic_disruption=0.60, worker_tenure_weeks=40,
        worker_claim_ratio=0.20,
        model=model, encoder=encoder,
    )
    print(f"  Mid risk  ({r3.zone}, Aug): score={r3.risk_score}  "
          f"premium=₹{r3.weekly_premium_inr}  tier={r3.risk_tier}")
