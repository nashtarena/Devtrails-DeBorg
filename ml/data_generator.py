"""
GigShield - Synthetic Training Data Generator (Delhi NCR)
Generates realistic worker-week records for:
  1. Premium risk model (regression)
  2. Fraud / anti-spoofing model (anomaly + classification)
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)

ZONES = {
    "Connaught Place":    {"base_disruption_freq": 0.28, "flood_risk": 0.30, "fog_risk": 0.55, "heat_risk": 0.70, "aqi_base": 0.72},
    "Lajpat Nagar":       {"base_disruption_freq": 0.32, "flood_risk": 0.45, "fog_risk": 0.50, "heat_risk": 0.68, "aqi_base": 0.75},
    "Rohini":             {"base_disruption_freq": 0.35, "flood_risk": 0.50, "fog_risk": 0.70, "heat_risk": 0.72, "aqi_base": 0.80},
    "Dwarka":             {"base_disruption_freq": 0.38, "flood_risk": 0.60, "fog_risk": 0.65, "heat_risk": 0.70, "aqi_base": 0.78},
    "Saket":              {"base_disruption_freq": 0.25, "flood_risk": 0.35, "fog_risk": 0.50, "heat_risk": 0.65, "aqi_base": 0.70},
    "Janakpuri":          {"base_disruption_freq": 0.30, "flood_risk": 0.40, "fog_risk": 0.60, "heat_risk": 0.68, "aqi_base": 0.76},
    "Shahdara":           {"base_disruption_freq": 0.40, "flood_risk": 0.65, "fog_risk": 0.60, "heat_risk": 0.72, "aqi_base": 0.85},
    "Noida Sector 18":    {"base_disruption_freq": 0.30, "flood_risk": 0.45, "fog_risk": 0.58, "heat_risk": 0.70, "aqi_base": 0.74},
    "Gurugram Sector 29": {"base_disruption_freq": 0.28, "flood_risk": 0.50, "fog_risk": 0.55, "heat_risk": 0.68, "aqi_base": 0.72},
    "Mayur Vihar":        {"base_disruption_freq": 0.35, "flood_risk": 0.55, "fog_risk": 0.58, "heat_risk": 0.70, "aqi_base": 0.80},
    "Karol Bagh":         {"base_disruption_freq": 0.33, "flood_risk": 0.42, "fog_risk": 0.55, "heat_risk": 0.72, "aqi_base": 0.82},
    "Vasant Kunj":        {"base_disruption_freq": 0.22, "flood_risk": 0.30, "fog_risk": 0.48, "heat_risk": 0.65, "aqi_base": 0.68},
}

ZONE_NAMES = list(ZONES.keys())

MONTH_RISK = {
    1: 0.70, 2: 0.65, 3: 0.20, 4: 0.25,
    5: 0.75, 6: 0.80, 7: 0.70, 8: 0.75,
    9: 0.60, 10: 0.65, 11: 0.80, 12: 0.75,
}

# Weekly income brackets for gig workers (INR)
# Low: <3000, Mid: 3000-7000, High: >7000
INCOME_MIN = 1500
INCOME_MAX = 15000


def normalise_income(weekly_income_inr: float) -> float:
    """Normalise weekly income to 0-1. Higher income → higher premium."""
    return float(np.clip((weekly_income_inr - INCOME_MIN) / (INCOME_MAX - INCOME_MIN), 0.0, 1.0))


def generate_premium_data(n: int = 6000) -> pd.DataFrame:
    zones  = RNG.choice(ZONE_NAMES, size=n)
    months = RNG.integers(1, 13, size=n)

    zone_disruption_freq = np.array([ZONES[z]["base_disruption_freq"] for z in zones])
    flood_risk           = np.array([ZONES[z]["flood_risk"]           for z in zones])
    fog_risk             = np.array([ZONES[z]["fog_risk"]             for z in zones])
    heat_risk            = np.array([ZONES[z]["heat_risk"]            for z in zones])
    aqi_base             = np.array([ZONES[z]["aqi_base"]             for z in zones])
    month_risk           = np.array([MONTH_RISK[m]                    for m in months])

    is_fog_month  = np.array([m in (12, 1, 2)  for m in months], dtype=float)
    is_heat_month = np.array([m in (5, 6)       for m in months], dtype=float)
    is_monsoon    = np.array([m in (7, 8, 9)    for m in months], dtype=float)
    is_aqi_spike  = np.array([m in (10, 11, 12) for m in months], dtype=float)

    weather_severity = np.clip(
        RNG.beta(2, 2, n) * (0.4 + 0.6 * month_risk)
        + 0.20 * is_fog_month  * fog_risk
        + 0.15 * is_heat_month * heat_risk
        + 0.15 * is_monsoon    * flood_risk,
        0.0, 1.0
    )
    aqi_level = np.clip(
        aqi_base * RNG.beta(3, 2, n) + 0.20 * is_aqi_spike,
        0.0, 1.0
    )
    traffic_disruption = RNG.beta(1.5, 3, n) * zone_disruption_freq

    worker_tenure_weeks = RNG.integers(1, 105, size=n)
    raw_claim_rate      = RNG.beta(1.5, 6, n)
    has_history         = (worker_tenure_weeks > 4).astype(float)
    worker_claim_ratio  = (has_history * raw_claim_rate
                           + (1 - has_history) * zone_disruption_freq * 0.4)

    # Weekly income: realistic gig worker distribution (skewed low)
    weekly_income_inr   = np.clip(RNG.lognormal(8.3, 0.5, n), INCOME_MIN, INCOME_MAX)
    income_norm         = (weekly_income_inr - INCOME_MIN) / (INCOME_MAX - INCOME_MIN)

    base_score = (
        0.25 * weather_severity
        + 0.25 * aqi_level
        + 0.15 * zone_disruption_freq
        + 0.15 * worker_claim_ratio
        + 0.20 * income_norm          # higher income → higher risk score → higher premium
    )
    seasonal_boost = (
        0.25 * flood_risk * is_monsoon
        + 0.20 * fog_risk  * is_fog_month
        + 0.20 * heat_risk * is_heat_month
        + 0.15 * aqi_base  * is_aqi_spike
    )
    risk_score = np.clip(
        base_score + seasonal_boost + RNG.normal(0, 0.03, n),
        0.0, 1.0
    )

    weekly_premium = np.round(49 + risk_score * 40, 2)

    return pd.DataFrame({
        "zone":                  zones,
        "month":                 months,
        "zone_disruption_freq":  zone_disruption_freq,
        "flood_risk":            flood_risk,
        "fog_risk":              fog_risk.round(4),
        "heat_risk":             heat_risk.round(4),
        "aqi_base":              aqi_base.round(4),
        "month_risk":            month_risk,
        "weather_severity":      weather_severity.round(4),
        "aqi_level":             aqi_level.round(4),
        "traffic_disruption":    traffic_disruption.round(4),
        "worker_tenure_weeks":   worker_tenure_weeks,
        "worker_claim_ratio":    worker_claim_ratio.round(4),
        "weekly_income_norm":    income_norm.round(4),
        "risk_score":            risk_score.round(4),
        "weekly_premium_inr":    weekly_premium,
    })


def generate_fraud_data(n: int = 8000, fraud_rate: float = 0.08) -> pd.DataFrame:
    n_fraud = int(n * fraud_rate)
    n_legit = n - n_fraud

    legit = {
        "gps_accuracy_m":             RNG.uniform(5, 25, n_legit),
        "accel_norm":                 RNG.uniform(8.0, 13.5, n_legit),
        "location_velocity_kmh":      RNG.uniform(0, 40, n_legit),
        "network_type":               RNG.choice([0, 1], n_legit, p=[0.15, 0.85]),
        "order_acceptance_latency_s": RNG.uniform(8, 90, n_legit),
        "peer_claims_same_window":    RNG.integers(0, 8, n_legit),
        "zone_claim_spike_ratio":     RNG.uniform(0.8, 2.5, n_legit),
        "device_subnet_overlap":      RNG.integers(0, 3, n_legit),
        "claim_time_std_minutes":     RNG.uniform(15, 120, n_legit),
        "battery_drain_pct_per_hr":   RNG.uniform(8, 25, n_legit),
        "is_fraud": np.zeros(n_legit, dtype=int),
    }

    fraud = {
        "gps_accuracy_m":             RNG.uniform(0.5, 4.0, n_fraud),
        "accel_norm":                 RNG.uniform(9.6, 9.9, n_fraud),
        "location_velocity_kmh":      RNG.choice(
                                          np.concatenate([
                                              RNG.uniform(0, 2, n_fraud // 2),
                                              RNG.uniform(180, 400, n_fraud // 2),
                                          ])
                                      ),
        "network_type":               RNG.choice([0, 1], n_fraud, p=[0.80, 0.20]),
        "order_acceptance_latency_s": RNG.uniform(0.5, 4.0, n_fraud),
        "peer_claims_same_window":    RNG.integers(15, 60, n_fraud),
        "zone_claim_spike_ratio":     RNG.uniform(4.0, 12.0, n_fraud),
        "device_subnet_overlap":      RNG.integers(4, 20, n_fraud),
        "claim_time_std_minutes":     RNG.uniform(0, 5, n_fraud),
        "battery_drain_pct_per_hr":   RNG.uniform(35, 70, n_fraud),
        "is_fraud": np.ones(n_fraud, dtype=int),
    }

    df = pd.concat(
        [pd.DataFrame(legit), pd.DataFrame(fraud)],
        ignore_index=True
    ).sample(frac=1, random_state=42)

    float_cols = df.select_dtypes(include="float64").columns
    df[float_cols] = df[float_cols].round(4)
    return df


if __name__ == "__main__":
    out = Path("data")
    out.mkdir(exist_ok=True)

    print("Generating premium training data (Delhi NCR)...")
    premium_df = generate_premium_data(6000)
    premium_df.to_csv(out / "premium_train.csv", index=False)
    print(f"  Saved {len(premium_df)} rows → data/premium_train.csv")
    print(f"  risk_score range: {premium_df.risk_score.min():.3f} – {premium_df.risk_score.max():.3f}")
    print(f"  premium range: ₹{premium_df.weekly_premium_inr.min()} – ₹{premium_df.weekly_premium_inr.max()}")

    print("\nGenerating fraud training data...")
    fraud_df = generate_fraud_data(8000, fraud_rate=0.08)
    fraud_df.to_csv(out / "fraud_train.csv", index=False)
    print(f"  Saved {len(fraud_df)} rows → data/fraud_train.csv")
    print(f"  Fraud rate: {fraud_df.is_fraud.mean():.1%}")
    print("\nDone.")
