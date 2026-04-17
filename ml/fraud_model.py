"""
SecInsure - Fraud Detection & Anti-Spoofing Model
Two-stage pipeline:
  Stage 1: Isolation Forest  → anomaly_score per claim (unsupervised)
  Stage 2: XGBoost Classifier → fraud_probability

Decision logic:
  fraud_probability >= 0.90  → AUTO_REJECTED
  fraud_probability >= 0.70  → FLAGGED (72-hr grace, re-check at 6h)
  fraud_probability <  0.70  → AUTO_APPROVED
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum

from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MODEL_DIR      = Path(__file__).parent / "models"
IF_MODEL_PATH  = MODEL_DIR / "fraud_isolation_forest.joblib"
XGB_MODEL_PATH = MODEL_DIR / "fraud_xgb.joblib"
SCALER_PATH    = MODEL_DIR / "fraud_scaler.joblib"

STAGE1_FEATURES = [
    "gps_accuracy_m",
    "accel_norm",
    "location_velocity_kmh",
    "network_type",
    "order_acceptance_latency_s",
    "battery_drain_pct_per_hr",
]

STAGE2_FEATURES = STAGE1_FEATURES + [
    "anomaly_score",
    "peer_claims_same_window",
    "zone_claim_spike_ratio",
    "device_subnet_overlap",
    "claim_time_std_minutes",
]

THRESHOLD_REJECT = 0.90
THRESHOLD_FLAG   = 0.70


class ClaimDecision(str, Enum):
    AUTO_APPROVED = "AUTO_APPROVED"
    FLAGGED       = "FLAGGED"
    AUTO_REJECTED = "AUTO_REJECTED"


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train_fraud_models(data_path: str = "data/fraud_train.csv") -> None:
    print("=== Training Fraud / Anti-Spoofing Models ===")
    df = pd.read_csv(data_path)

    # ---- Stage 1: Isolation Forest (fit on legit-only rows) ----
    legit_df = df[df["is_fraud"] == 0][STAGE1_FEATURES].reset_index(drop=True)
    scaler   = StandardScaler()
    X_legit  = scaler.fit_transform(legit_df.values)          # fit with numpy → no feature-name warning at inference

    iso_forest = IsolationForest(
        n_estimators=300,
        contamination=0.05,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    iso_forest.fit(X_legit)
    print("  Isolation Forest fitted on legitimate traffic.")

    # Anomaly scores for full dataset — store s_min/s_max in scaler metadata for inference
    X_all      = scaler.transform(df[STAGE1_FEATURES].values)
    raw_scores = iso_forest.score_samples(X_all)
    s_min, s_max = raw_scores.min(), raw_scores.max()
    # Persist normalisation bounds alongside scaler so inference is consistent
    scaler.anomaly_s_min_ = float(s_min)
    scaler.anomaly_s_max_ = float(s_max)

    anomaly_score = 1 - (raw_scores - s_min) / (s_max - s_min + 1e-9)
    df = df.copy()
    df["anomaly_score"] = anomaly_score.round(4)

    # ---- Stage 2: XGBoost Classifier ----
    X = df[STAGE2_FEATURES].values      # use .values → no feature-name issues
    y = df["is_fraud"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, stratify=y, random_state=42
    )

    # Fix: don't use scale_pos_weight with aucpr — it causes probability collapse.
    # Instead use a modest weight and tune via threshold, not the weight.
    xgb = XGBClassifier(
        n_estimators=600,
        learning_rate=0.03,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
        scale_pos_weight=3,             # mild boost only — avoids probability collapse
        eval_metric="logloss",          # logloss keeps probabilities well-calibrated
        early_stopping_rounds=40,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    xgb.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    y_prob = xgb.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= THRESHOLD_FLAG).astype(int)
    auc    = roc_auc_score(y_test, y_prob)

    print(f"  XGBoost AUC-ROC: {auc:.4f}")
    print(f"\n  Classification report (threshold={THRESHOLD_FLAG:.0%}):")
    print(classification_report(y_test, y_pred,
                                 target_names=["legit", "fraud"],
                                 zero_division=0))

    fi = pd.Series(xgb.feature_importances_, index=STAGE2_FEATURES).nlargest(5)
    print("  Top features:")
    for feat, imp in fi.items():
        print(f"    {feat:<38} {imp:.4f}")

    Path("models").mkdir(exist_ok=True)
    joblib.dump(iso_forest, IF_MODEL_PATH)
    joblib.dump(xgb,        XGB_MODEL_PATH)
    joblib.dump(scaler,     SCALER_PATH)
    print(f"\n  Saved → {IF_MODEL_PATH}, {XGB_MODEL_PATH}, {SCALER_PATH}")


# ---------------------------------------------------------------------------
# Inference helpers
# ---------------------------------------------------------------------------
def load_fraud_models():
    return (
        joblib.load(IF_MODEL_PATH),
        joblib.load(XGB_MODEL_PATH),
        joblib.load(SCALER_PATH),
    )


@dataclass
class FraudResult:
    claim_id:           str
    fraud_probability:  float
    anomaly_score:      float
    decision:           ClaimDecision
    triggered_signals:  list = field(default_factory=list)
    grace_window_hours: int  = 0
    explanation:        str  = ""


def _decision(prob: float) -> ClaimDecision:
    if prob >= THRESHOLD_REJECT: return ClaimDecision.AUTO_REJECTED
    if prob >= THRESHOLD_FLAG:   return ClaimDecision.FLAGGED
    return ClaimDecision.AUTO_APPROVED


def _triggered_signals(row: dict, anomaly_score: float) -> list:
    signals = []
    if row.get("gps_accuracy_m", 99) < 4:
        signals.append("GPS accuracy suspiciously perfect (<4 m)")
    if abs(row.get("accel_norm", 9.8) - 9.8) < 0.1:
        signals.append("Accelerometer shows stationary device (gravity only)")
    if row.get("location_velocity_kmh", 0) > 120:
        signals.append(f"Impossible location velocity ({row['location_velocity_kmh']:.0f} km/h)")
    if row.get("network_type", 1) == 0:
        signals.append("Device on WiFi while claiming outdoor disruption")
    if row.get("order_acceptance_latency_s", 30) < 3:
        signals.append("Order accepted in <3 s (consistent with automation)")
    if row.get("peer_claims_same_window", 0) > 12:
        signals.append(f"Coordinated ring: {row['peer_claims_same_window']} peers in same window")
    if row.get("zone_claim_spike_ratio", 1) > 4:
        signals.append(f"Zone claim spike: {row['zone_claim_spike_ratio']:.1f}x normal rate")
    if row.get("device_subnet_overlap", 0) > 3:
        signals.append(f"Subnet overlap: {row['device_subnet_overlap']} devices on same network")
    if row.get("battery_drain_pct_per_hr", 15) > 30:
        signals.append("High battery drain consistent with GPS-spoofing app")
    if anomaly_score > 0.75:
        signals.append(f"Isolation Forest anomaly score: {anomaly_score:.2f}")
    return signals


def _compute_anomaly_score(raw_score: float, scaler) -> float:
    """Normalise using bounds saved during training — consistent with training transform."""
    s_min = getattr(scaler, "anomaly_s_min_", -0.5)
    s_max = getattr(scaler, "anomaly_s_max_",  0.0)
    return float(np.clip(1 - (raw_score - s_min) / (s_max - s_min + 1e-9), 0.0, 1.0))


def predict_fraud(
    claim_id:                   str,
    gps_accuracy_m:             float,
    accel_norm:                 float,
    location_velocity_kmh:      float,
    network_type:               int,
    order_acceptance_latency_s: float,
    battery_drain_pct_per_hr:   float,
    peer_claims_same_window:    int,
    zone_claim_spike_ratio:     float,
    device_subnet_overlap:      int,
    claim_time_std_minutes:     float,
    iso_forest=None,
    xgb=None,
    scaler=None,
) -> FraudResult:
    if iso_forest is None or xgb is None or scaler is None:
        iso_forest, xgb, scaler = load_fraud_models()

    row = {
        "gps_accuracy_m":             gps_accuracy_m,
        "accel_norm":                 accel_norm,
        "location_velocity_kmh":      location_velocity_kmh,
        "network_type":               network_type,
        "order_acceptance_latency_s": order_acceptance_latency_s,
        "battery_drain_pct_per_hr":   battery_drain_pct_per_hr,
        "peer_claims_same_window":    peer_claims_same_window,
        "zone_claim_spike_ratio":     zone_claim_spike_ratio,
        "device_subnet_overlap":      device_subnet_overlap,
        "claim_time_std_minutes":     claim_time_std_minutes,
    }

    # Stage 1 — pass numpy array directly (no feature-name warning)
    stage1_arr    = np.array([[row[f] for f in STAGE1_FEATURES]])
    scaled_arr    = scaler.transform(stage1_arr)
    raw_score     = iso_forest.score_samples(scaled_arr)[0]
    anomaly_score = _compute_anomaly_score(raw_score, scaler)
    row["anomaly_score"] = anomaly_score

    # Stage 2
    stage2_arr = np.array([[row[f] for f in STAGE2_FEATURES]])
    fraud_prob  = float(xgb.predict_proba(stage2_arr)[0, 1])
    decision    = _decision(fraud_prob)
    signals     = _triggered_signals(row, anomaly_score)

    explanation = {
        ClaimDecision.AUTO_APPROVED: "No significant anomalies detected. Claim approved.",
        ClaimDecision.FLAGGED: (
            "Some signals warrant verification. Claim is in a 72-hour grace window. "
            "A secondary check runs after 6 hours using live weather API data. "
            "If the disruption trigger is still active, payout will auto-approve."
        ),
        ClaimDecision.AUTO_REJECTED: (
            "Multiple high-confidence fraud signals detected. Claim rejected. "
            "Worker may appeal via the support channel within 7 days."
        ),
    }[decision]

    return FraudResult(
        claim_id           = claim_id,
        fraud_probability  = round(fraud_prob, 4),
        anomaly_score      = round(anomaly_score, 4),
        decision           = decision,
        triggered_signals  = signals,
        grace_window_hours = 72 if decision == ClaimDecision.FLAGGED else 0,
        explanation        = explanation,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from data_generator import generate_fraud_data

    data_path = Path("data/fraud_train.csv")
    if not data_path.exists():
        Path("data").mkdir(exist_ok=True)
        generate_fraud_data(8000, fraud_rate=0.08).to_csv(data_path, index=False)

    train_fraud_models(str(data_path))

    print("\n=== Inference smoke tests ===")
    iso_forest, xgb, scaler = load_fraud_models()

    # Legitimate worker caught in Delhi fog/rain
    r1 = predict_fraud(
        claim_id="CLM001",
        gps_accuracy_m=14.2,           accel_norm=10.8,
        location_velocity_kmh=18,      network_type=1,
        order_acceptance_latency_s=42, battery_drain_pct_per_hr=11,
        peer_claims_same_window=3,     zone_claim_spike_ratio=1.6,
        device_subnet_overlap=0,       claim_time_std_minutes=52,
        iso_forest=iso_forest, xgb=xgb, scaler=scaler,
    )
    print(f"\n  Legit claim  → decision={r1.decision.value}  "
          f"fraud_prob={r1.fraud_probability}  anomaly={r1.anomaly_score}")
    print(f"  Signals: {r1.triggered_signals or ['none']}")

    # GPS spoofer — all signals maxed out
    r2 = predict_fraud(
        claim_id="CLM002",
        gps_accuracy_m=1.1,            accel_norm=9.81,
        location_velocity_kmh=320,     network_type=0,
        order_acceptance_latency_s=1.2,battery_drain_pct_per_hr=55,
        peer_claims_same_window=38,    zone_claim_spike_ratio=9.2,
        device_subnet_overlap=14,      claim_time_std_minutes=1.3,
        iso_forest=iso_forest, xgb=xgb, scaler=scaler,
    )
    print(f"\n  Fraud claim  → decision={r2.decision.value}  "
          f"fraud_prob={r2.fraud_probability}  anomaly={r2.anomaly_score}")
    print(f"  Signals ({len(r2.triggered_signals)}): {r2.triggered_signals[:3]} ...")

    # Edge case — real worker, cell tower overloaded during AQI event, barely moving
    r3 = predict_fraud(
        claim_id="CLM003",
        gps_accuracy_m=19.5,           accel_norm=9.85,
        location_velocity_kmh=4,       network_type=0,   # WiFi because towers jammed
        order_acceptance_latency_s=15, battery_drain_pct_per_hr=17,
        peer_claims_same_window=5,     zone_claim_spike_ratio=2.8,
        device_subnet_overlap=1,       claim_time_std_minutes=35,
        iso_forest=iso_forest, xgb=xgb, scaler=scaler,
    )
    print(f"\n  Edge case    → decision={r3.decision.value}  "
          f"fraud_prob={r3.fraud_probability}")
    print(f"  Explanation: {r3.explanation}")