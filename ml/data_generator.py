"""
GigShield - Synthetic Training Data Generator

Two models:
  1. Premium model  — what the worker pays weekly (based on income + zone + work type)
  2. Claim model    — how much they receive when a disruption triggers (based on severity + income)
  3. Fraud model    — anti-spoofing pipeline
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)

ZONES = {
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
ZONE_NAMES = list(ZONES.keys())

INCOME_MIN = 1500
INCOME_MAX = 15000
BASE_PREMIUM = 29.0
MAX_PREMIUM  = 89.0


def normalise_income(weekly_income_inr: float) -> float:
    return float(np.clip((weekly_income_inr - INCOME_MIN) / (INCOME_MAX - INCOME_MIN), 0.0, 1.0))


def generate_premium_data(n: int = 6000) -> pd.DataFrame:
    """
    Premium = f(income, zone_risk, work_type, claim_history)
    Weather/traffic do NOT affect premium — they affect claim amount.
    """
    zones      = RNG.choice(ZONE_NAMES, size=n)
    work_types = RNG.choice([0, 1], size=n, p=[0.6, 0.4])  # 0=full-time, 1=part-time

    disruption_freq = np.array([ZONES[z]["disruption_freq"] for z in zones])
    flood_risk      = np.array([ZONES[z]["flood_risk"]      for z in zones])
    heat_risk       = np.array([ZONES[z]["heat_risk"]       for z in zones])

    weekly_income   = np.clip(RNG.lognormal(8.3, 0.5, n), INCOME_MIN, INCOME_MAX)
    income_norm     = (weekly_income - INCOME_MIN) / (INCOME_MAX - INCOME_MIN)

    tenure_weeks    = RNG.integers(1, 105, size=n)
    claim_ratio     = RNG.beta(1.5, 6, n) * (tenure_weeks > 4)

    # Premium is primarily driven by income (coverage amount) + zone risk
    # Part-time workers pay slightly less (less exposure)
    work_factor = np.where(work_types == 0, 1.0, 0.75)

    premium_score = np.clip(
        0.50 * income_norm
        + 0.20 * disruption_freq
        + 0.15 * flood_risk
        + 0.10 * claim_ratio
        + 0.05 * heat_risk
        + RNG.normal(0, 0.02, n),
        0.0, 1.0
    ) * work_factor

    weekly_premium = np.round(BASE_PREMIUM + premium_score * (MAX_PREMIUM - BASE_PREMIUM), 2)

    return pd.DataFrame({
        "zone":             zones,
        "work_type":        work_types,
        "disruption_freq":  disruption_freq.round(4),
        "flood_risk":       flood_risk.round(4),
        "heat_risk":        heat_risk.round(4),
        "weekly_income":    weekly_income.round(2),
        "income_norm":      income_norm.round(4),
        "tenure_weeks":     tenure_weeks,
        "claim_ratio":      claim_ratio.round(4),
        "premium_score":    premium_score.round(4),
        "weekly_premium":   weekly_premium,
    })


def generate_claim_data(n: int = 5000) -> pd.DataFrame:
    """
    Claim amount = f(trigger_type, severity, weekly_income)
    Higher income → higher payout (income replacement logic).
    """
    trigger_types = RNG.choice(
        ["heavy_rain", "extreme_heat", "traffic", "aqi"], size=n,
        p=[0.35, 0.25, 0.25, 0.15]
    )
    # Severity of the event (0-1)
    severity      = RNG.beta(2, 2, n)
    weekly_income = np.clip(RNG.lognormal(8.3, 0.5, n), INCOME_MIN, INCOME_MAX)
    income_norm   = (weekly_income - INCOME_MIN) / (INCOME_MAX - INCOME_MIN)

    # Base payout per trigger type (% of daily income)
    base_pct = {
        "heavy_rain":   0.40,
        "extreme_heat": 0.30,
        "traffic":      0.25,
        "aqi":          0.20,
    }
    daily_income = weekly_income / 6  # 6 working days
    base_payout  = np.array([base_pct[t] for t in trigger_types]) * daily_income

    # Scale by severity + income factor
    claim_amount = np.clip(
        base_payout * (0.5 + severity) * (0.8 + 0.4 * income_norm)
        + RNG.normal(0, 5, n),
        50, 500
    ).round(2)

    return pd.DataFrame({
        "trigger_type":  trigger_types,
        "severity":      severity.round(4),
        "weekly_income": weekly_income.round(2),
        "income_norm":   income_norm.round(4),
        "claim_amount":  claim_amount,
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
        "location_velocity_kmh":      RNG.choice(np.concatenate([
                                          RNG.uniform(0, 2, n_fraud // 2),
                                          RNG.uniform(180, 400, n_fraud // 2),
                                      ])),
        "network_type":               RNG.choice([0, 1], n_fraud, p=[0.80, 0.20]),
        "order_acceptance_latency_s": RNG.uniform(0.5, 4.0, n_fraud),
        "peer_claims_same_window":    RNG.integers(15, 60, n_fraud),
        "zone_claim_spike_ratio":     RNG.uniform(4.0, 12.0, n_fraud),
        "device_subnet_overlap":      RNG.integers(4, 20, n_fraud),
        "claim_time_std_minutes":     RNG.uniform(0, 5, n_fraud),
        "battery_drain_pct_per_hr":   RNG.uniform(35, 70, n_fraud),
        "is_fraud": np.ones(n_fraud, dtype=int),
    }

    df = pd.concat([pd.DataFrame(legit), pd.DataFrame(fraud)], ignore_index=True).sample(frac=1, random_state=42)
    df[df.select_dtypes("float64").columns] = df.select_dtypes("float64").round(4)
    return df


if __name__ == "__main__":
    out = Path("data")
    out.mkdir(exist_ok=True)

    print("Generating premium data...")
    prem = generate_premium_data(6000)
    prem.to_csv(out / "premium_train.csv", index=False)
    print(f"  premium range: ₹{prem.weekly_premium.min()} – ₹{prem.weekly_premium.max()}")

    print("Generating claim amount data...")
    claim = generate_claim_data(5000)
    claim.to_csv(out / "claim_train.csv", index=False)
    print(f"  claim range: ₹{claim.claim_amount.min()} – ₹{claim.claim_amount.max()}")

    print("Generating fraud data...")
    fraud = generate_fraud_data(8000)
    fraud.to_csv(out / "fraud_train.csv", index=False)
    print(f"  fraud rate: {fraud.is_fraud.mean():.1%}")
    print("Done.")
