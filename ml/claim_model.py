"""
SecInsure - Claim Amount Model
Payout = f(trigger_type, severity, weekly_income)
Higher income + higher severity = higher payout.
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from dataclasses import dataclass
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import OrdinalEncoder

MODEL_DIR    = Path(__file__).parent / "models"
MODEL_PATH   = MODEL_DIR / "claim_model.joblib"
ENCODER_PATH = MODEL_DIR / "claim_encoder.joblib"

FEATURE_COLS = ["trigger_type", "severity", "income_norm"]

INCOME_MIN = 1500
INCOME_MAX = 15000
MIN_PAYOUT = 50
MAX_PAYOUT = 500


def normalise_income(weekly_income_inr: float) -> float:
    return float(np.clip((weekly_income_inr - INCOME_MIN) / (INCOME_MAX - INCOME_MIN), 0.0, 1.0))


def train_claim_model(data_path: str = "data/claim_train.csv") -> None:
    print("=== Training Claim Amount Model ===")
    df = pd.read_csv(data_path)

    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    df["trigger_type"] = encoder.fit_transform(df[["trigger_type"]])

    X = df[FEATURE_COLS]
    y = df["claim_amount"]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.15, random_state=42)

    model = XGBRegressor(
        n_estimators=300, learning_rate=0.05, max_depth=4,
        subsample=0.8, random_state=42, n_jobs=-1,
        eval_metric="mae", early_stopping_rounds=20, verbosity=0,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    preds = model.predict(X_val)
    print(f"  MAE: INR {mean_absolute_error(y_val, preds):.2f}")

    Path("models").mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    print(f"  Saved -> {MODEL_PATH}")


def load_claim_model():
    return joblib.load(MODEL_PATH), joblib.load(ENCODER_PATH)


@dataclass
class ClaimAmountResult:
    trigger_type:  str
    severity:      float
    claim_amount:  float
    explanation:   str


def predict_claim_amount(
    trigger_type: str,
    severity: float,
    weekly_income_inr: float,
    model=None, encoder=None,
) -> ClaimAmountResult:
    if model is None or encoder is None:
        model, encoder = load_claim_model()

    income_norm = normalise_income(weekly_income_inr)
    row = pd.DataFrame([{
        "trigger_type": trigger_type,
        "severity":     severity,
        "income_norm":  income_norm,
    }])
    row["trigger_type"] = encoder.transform(row[["trigger_type"]])

    amount = float(np.clip(model.predict(row[FEATURE_COLS])[0], MIN_PAYOUT, MAX_PAYOUT))
    amount = round(amount, 2)

    pct = round(severity * 100)
    daily = round(weekly_income_inr / 6, 0)
    explanation = (
        f"{pct}% severity {trigger_type.replace('_', ' ')} event. "
        f"Daily income ₹{daily:.0f} → payout ₹{amount}"
    )

    return ClaimAmountResult(
        trigger_type = trigger_type,
        severity     = round(severity, 3),
        claim_amount = amount,
        explanation  = explanation,
    )


if __name__ == "__main__":
    from data_generator import generate_claim_data
    Path("data").mkdir(exist_ok=True)
    generate_claim_data(5000).to_csv("data/claim_train.csv", index=False)
    train_claim_model()

    model, encoder = load_claim_model()
    for t, sev, inc in [
        ("heavy_rain",   0.8, 3000),
        ("heavy_rain",   0.8, 10000),
        ("extreme_heat", 0.5, 5000),
        ("traffic",      0.9, 7000),
    ]:
        r = predict_claim_amount(t, sev, inc, model=model, encoder=encoder)
        print(f"  {t} sev={sev} income=INR {inc} -> INR {r.claim_amount}  {r.explanation}")
