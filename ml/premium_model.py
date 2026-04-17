"""
SecInsure - Premium Model
Weekly premium = f(income, zone_risk, work_type, claim_history)
Weather/traffic do NOT affect premium.
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

MODEL_DIR    = Path(__file__).parent / "models"
MODEL_PATH   = MODEL_DIR / "premium_model.joblib"
ENCODER_PATH = MODEL_DIR / "premium_encoder.joblib"

FEATURE_COLS = [
    "zone", "work_type", "disruption_freq", "flood_risk",
    "heat_risk", "income_norm", "tenure_weeks", "claim_ratio",
]

BASE_PREMIUM = 29.0
MAX_PREMIUM  = 89.0
INCOME_MIN   = 1500
INCOME_MAX   = 15000

ZONE_DEFAULTS = {
    "Connaught Place":    {"disruption_freq": 0.28, "flood_risk": 0.30, "heat_risk": 0.70},
    "Lajpat Nagar":       {"disruption_freq": 0.32, "flood_risk": 0.45, "heat_risk": 0.68},
    "Rohini":             {"disruption_freq": 0.35, "flood_risk": 0.50, "heat_risk": 0.72},
    "Dwarka":             {"disruption_freq": 0.38, "flood_risk": 0.60, "heat_risk": 0.70},
    "Saket":              {"disruption_freq": 0.25, "flood_risk": 0.35, "heat_risk": 0.65},
    "Janakpuri":          {"disruption_freq": 0.30, "flood_risk": 0.40, "heat_risk": 0.68},
    "Shahdara":           {"disruption_freq": 0.40, "flood_risk": 0.65, "heat_risk": 0.72},
    "Noida Sector 18":    {"disruption_freq": 0.30, "flood_risk": 0.45, "heat_risk": 0.70},
    "Gurugram Sector 29": {"disruption_freq": 0.28, "flood_risk": 0.50, "heat_risk": 0.68},
    "Mayur Vihar":        {"disruption_freq": 0.35, "flood_risk": 0.55, "heat_risk": 0.70},
    "Karol Bagh":         {"disruption_freq": 0.33, "flood_risk": 0.42, "heat_risk": 0.72},
    "Vasant Kunj":        {"disruption_freq": 0.22, "flood_risk": 0.30, "heat_risk": 0.65},
}


def normalise_income(weekly_income_inr: float) -> float:
    return float(np.clip((weekly_income_inr - INCOME_MIN) / (INCOME_MAX - INCOME_MIN), 0.0, 1.0))


def train_premium_model(data_path: str = "data/premium_train.csv") -> None:
    print("=== Training Premium Model (income + zone only) ===")
    df = pd.read_csv(data_path)

    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    df["zone"] = encoder.fit_transform(df[["zone"]])

    X = df[FEATURE_COLS]
    y = df["weekly_premium"]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.15, random_state=42)

    model = XGBRegressor(
        n_estimators=400, learning_rate=0.05, max_depth=4,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
        n_jobs=-1, eval_metric="mae", early_stopping_rounds=30, verbosity=0,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    preds = model.predict(X_val)
    print(f"  MAE: INR {mean_absolute_error(y_val, preds):.2f}  R2: {r2_score(y_val, preds):.4f}")

    fi = pd.Series(model.feature_importances_, index=FEATURE_COLS).nlargest(5)
    print("  Top features:", dict(fi.round(3)))

    Path("models").mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    print(f"  Saved -> {MODEL_PATH}")


def load_premium_model():
    return joblib.load(MODEL_PATH), joblib.load(ENCODER_PATH)


@dataclass
class PremiumResult:
    zone:               str
    weekly_premium_inr: float
    risk_tier:          str
    breakdown:          dict


def risk_tier(premium: float) -> str:
    if premium < 45: return "LOW"
    if premium < 65: return "MEDIUM"
    return "HIGH"


def predict_premium(
    zone: str,
    work_type: str,
    weekly_income_inr: float,
    tenure_weeks: int = 10,
    claim_ratio: float = 0.0,
    model=None, encoder=None,
) -> PremiumResult:
    if model is None or encoder is None:
        model, encoder = load_premium_model()

    zone_info   = ZONE_DEFAULTS.get(zone, {"disruption_freq": 0.30, "flood_risk": 0.45, "heat_risk": 0.70})
    income_norm = normalise_income(weekly_income_inr)
    work_type_n = 0 if str(work_type).lower().startswith("full") else 1

    row = pd.DataFrame([{
        "zone":            zone,
        "work_type":       work_type_n,
        "disruption_freq": zone_info["disruption_freq"],
        "flood_risk":      zone_info["flood_risk"],
        "heat_risk":       zone_info["heat_risk"],
        "income_norm":     income_norm,
        "tenure_weeks":    tenure_weeks,
        "claim_ratio":     claim_ratio,
    }])
    row["zone"] = encoder.transform(row[["zone"]])

    premium = float(np.clip(model.predict(row[FEATURE_COLS])[0], BASE_PREMIUM, MAX_PREMIUM))
    premium = round(premium, 2)

    return PremiumResult(
        zone               = zone,
        weekly_premium_inr = premium,
        risk_tier          = risk_tier(premium),
        breakdown = {
            "income_factor":   round(income_norm, 3),
            "zone_risk":       round(zone_info["disruption_freq"] + zone_info["flood_risk"], 3),
            "work_type":       "full-time" if work_type_n == 0 else "part-time",
            "claim_history":   round(claim_ratio, 3),
        },
    )


if __name__ == "__main__":
    from data_generator import generate_premium_data
    Path("data").mkdir(exist_ok=True)
    generate_premium_data(6000).to_csv("data/premium_train.csv", index=False)
    train_premium_model()

    model, encoder = load_premium_model()
    for label, kwargs in [
        ("Low  ₹2000 full-time Saket",    dict(zone="Saket",    work_type="full-time",  weekly_income_inr=2000)),
        ("Mid  ₹5000 full-time Dwarka",   dict(zone="Dwarka",   work_type="full-time",  weekly_income_inr=5000)),
        ("High ₹12000 full-time Shahdara",dict(zone="Shahdara", work_type="full-time",  weekly_income_inr=12000)),
        ("Part ₹5000 part-time Saket",    dict(zone="Saket",    work_type="part-time",  weekly_income_inr=5000)),
    ]:
        r = predict_premium(**kwargs, model=model, encoder=encoder)
        print(f"  {label}: INR {r.weekly_premium_inr}/week  tier={r.risk_tier}")
