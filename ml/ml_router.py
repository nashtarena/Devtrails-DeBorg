"""
GigShield - ML FastAPI Router
Mount this into your main FastAPI app:

    from ml_router import router as ml_router
    app.include_router(ml_router, prefix="/ml", tags=["ML"])

Endpoints:
    POST /ml/score/premium       → dynamic weekly premium
    POST /ml/score/fraud         → fraud probability + claim decision
    POST /ml/validate/location   → lightweight GPS spoofing pre-check
                                   (call this BEFORE submitting a full claim)
"""

from __future__ import annotations

import logging
import time
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from premium_model import PremiumResult, predict_premium, load_premium_model
from fraud_model   import FraudResult,   predict_fraud,   load_fraud_models, ClaimDecision

logger = logging.getLogger("gigshield.ml")
router = APIRouter()


# ---------------------------------------------------------------------------
# Model singletons — loaded once on first request, cached for lifetime of process
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _get_premium_models():
    logger.info("Loading premium model from disk...")
    return load_premium_model()


@lru_cache(maxsize=1)
def _get_fraud_models():
    logger.info("Loading fraud models from disk...")
    return load_fraud_models()


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

# ---- Premium ---------------------------------------------------------------
class PremiumRequest(BaseModel):
    zone:                 str   = Field(..., example="Velachery")
    month:                int   = Field(..., ge=1, le=12, example=11)
    weather_severity:     float = Field(..., ge=0.0, le=1.0)
    aqi_level:            float = Field(..., ge=0.0, le=1.0)
    traffic_disruption:   float = Field(..., ge=0.0, le=1.0)
    worker_tenure_weeks:  int   = Field(..., ge=0, example=24)
    worker_claim_ratio:   float = Field(0.0, ge=0.0, le=1.0)
    weekly_income_inr:    float = Field(5000.0, ge=0, description="Worker's weekly income in INR")


class PremiumResponse(BaseModel):
    zone:               str
    month:              int
    risk_score:         float
    weekly_premium_inr: float
    risk_tier:          str
    breakdown:          dict


# ---- Fraud -----------------------------------------------------------------
class FraudRequest(BaseModel):
    claim_id:                   str
    gps_accuracy_m:             float = Field(..., ge=0,
                                              description="Reported GPS accuracy radius in metres")
    accel_norm:                 float = Field(...,
                                              description="Accelerometer vector magnitude (m/s²)")
    location_velocity_kmh:      float = Field(..., ge=0,
                                              description="km/h between last two location pings")
    network_type:               int   = Field(..., ge=0, le=1,
                                              description="0=WiFi, 1=cellular (4G/5G)")
    order_acceptance_latency_s: float = Field(..., ge=0,
                                              description="Seconds from order push to acceptance")
    battery_drain_pct_per_hr:   float = Field(..., ge=0,
                                              description="Battery % drained per hour")
    peer_claims_same_window:    int   = Field(..., ge=0,
                                              description="Other workers claiming in same zone ±10 min")
    zone_claim_spike_ratio:     float = Field(..., ge=0,
                                              description="Current claims vs historical hourly average")
    device_subnet_overlap:      int   = Field(..., ge=0,
                                              description="Claimants sharing same ISP subnet")
    claim_time_std_minutes:     float = Field(..., ge=0,
                                              description="Std-dev of claim timestamps in zone cluster")


class FraudResponse(BaseModel):
    claim_id:            str
    fraud_probability:   float
    anomaly_score:       float
    decision:            str        # ClaimDecision value
    triggered_signals:   list[str]
    grace_window_hours:  int
    explanation:         str


# ---- Location pre-check ----------------------------------------------------
class LocationRequest(BaseModel):
    worker_id:             str
    gps_accuracy_m:        float = Field(..., ge=0)
    accel_norm:            float
    network_type:          int   = Field(..., ge=0, le=1)
    battery_drain_pct_per_hr: float = Field(..., ge=0)


class LocationResponse(BaseModel):
    worker_id:      str
    suspicious:     bool
    signals:        list[str]
    recommendation: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/score/premium", response_model=PremiumResponse, summary="Dynamic weekly premium")
async def score_premium(req: PremiumRequest):
    """
    Returns the ML-computed risk score and weekly premium for a worker.
    Call this during policy creation and at every weekly renewal.
    """
    try:
        t0 = time.perf_counter()
        model, encoder = _get_premium_models()
        result: PremiumResult = predict_premium(
            zone                = req.zone,
            month               = req.month,
            weather_severity    = req.weather_severity,
            aqi_level           = req.aqi_level,
            traffic_disruption  = req.traffic_disruption,
            worker_tenure_weeks = req.worker_tenure_weeks,
            worker_claim_ratio  = req.worker_claim_ratio,
            weekly_income_inr   = req.weekly_income_inr,
            model               = model,
            encoder             = encoder,
        )
        logger.info("premium | zone=%s month=%d score=%.3f premium=₹%.2f latency=%.1fms",
                    req.zone, req.month, result.risk_score,
                    result.weekly_premium_inr, (time.perf_counter() - t0) * 1000)
        return PremiumResponse(
            zone               = result.zone,
            month              = result.month,
            risk_score         = result.risk_score,
            weekly_premium_inr = result.weekly_premium_inr,
            risk_tier          = result.risk_tier,
            breakdown          = result.breakdown,
        )
    except Exception as e:
        logger.exception("Premium scoring failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score/fraud", response_model=FraudResponse, summary="Fraud detection + claim decision")
async def score_fraud(req: FraudRequest):
    """
    Two-stage fraud pipeline:
      Stage 1 — Isolation Forest anomaly score (device + GPS signals)
      Stage 2 — XGBoost classifier (anomaly score + group/ring signals)

    Decision thresholds:
      >= 0.90 → AUTO_REJECTED
      >= 0.70 → FLAGGED (72-hr grace window, re-validates against live weather API at 6h)
      <  0.70 → AUTO_APPROVED
    """
    try:
        t0 = time.perf_counter()
        iso_forest, xgb, scaler = _get_fraud_models()
        result: FraudResult = predict_fraud(
            claim_id                   = req.claim_id,
            gps_accuracy_m             = req.gps_accuracy_m,
            accel_norm                 = req.accel_norm,
            location_velocity_kmh      = req.location_velocity_kmh,
            network_type               = req.network_type,
            order_acceptance_latency_s = req.order_acceptance_latency_s,
            battery_drain_pct_per_hr   = req.battery_drain_pct_per_hr,
            peer_claims_same_window    = req.peer_claims_same_window,
            zone_claim_spike_ratio     = req.zone_claim_spike_ratio,
            device_subnet_overlap      = req.device_subnet_overlap,
            claim_time_std_minutes     = req.claim_time_std_minutes,
            iso_forest                 = iso_forest,
            xgb                        = xgb,
            scaler                     = scaler,
        )
        logger.info(
            "fraud | claim=%s decision=%s prob=%.3f anomaly=%.3f signals=%d latency=%.1fms",
            req.claim_id, result.decision.value, result.fraud_probability,
            result.anomaly_score, len(result.triggered_signals),
            (time.perf_counter() - t0) * 1000,
        )
        return FraudResponse(
            claim_id           = result.claim_id,
            fraud_probability  = result.fraud_probability,
            anomaly_score      = result.anomaly_score,
            decision           = result.decision.value,
            triggered_signals  = result.triggered_signals,
            grace_window_hours = result.grace_window_hours,
            explanation        = result.explanation,
        )
    except Exception as e:
        logger.exception("Fraud scoring failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate/location", response_model=LocationResponse,
             summary="Lightweight GPS spoofing pre-check")
async def validate_location(req: LocationRequest):
    """
    Fast heuristic check — runs BEFORE a full claim is submitted.
    No ML inference; pure rule-based, so it's < 5 ms.
    Use this on the mobile/PWA frontend before showing the 'Submit claim' button.

    Signals checked:
      - GPS accuracy < 4 m (spoofing apps are suspiciously precise)
      - Accelerometer near gravity-only (9.75–9.85) while claiming outdoors
      - WiFi network during outdoor disruption event
      - Battery drain > 30 %/hr (spoofing app running in background)
    """
    signals: list[str] = []

    if req.gps_accuracy_m < 4.0:
        signals.append(
            f"GPS accuracy {req.gps_accuracy_m:.1f} m — "
            "real outdoor GPS is typically 5–20 m"
        )
    if abs(req.accel_norm - 9.8) < 0.08:
        signals.append(
            "Accelerometer indicates stationary device — "
            "expected movement in an outdoor disruption event"
        )
    if req.network_type == 0:
        signals.append(
            "Device connected to WiFi — "
            "outdoor delivery workers are typically on cellular data"
        )
    if req.battery_drain_pct_per_hr > 30:
        signals.append(
            f"Battery draining at {req.battery_drain_pct_per_hr:.0f}%/hr — "
            "consistent with background location-spoofing app"
        )

    suspicious = len(signals) >= 2   # two or more signals = flag

    recommendation = (
        "Location signals look normal. Proceed with claim." if not suspicious
        else (
            "Multiple location anomalies detected. The claim will be submitted "
            "but will enter a verification window. Ensure your GPS and mobile data "
            "are enabled, and that no VPN or mock-location app is running."
        )
    )

    return LocationResponse(
        worker_id      = req.worker_id,
        suspicious     = suspicious,
        signals        = signals,
        recommendation = recommendation,
    )


# ---------------------------------------------------------------------------
# Health + model metadata
# ---------------------------------------------------------------------------
@router.get("/health", summary="ML service health check")
async def health():
    return {"status": "ok", "models": ["premium", "fraud_isolation_forest", "fraud_xgb"]}


@router.get("/info", summary="Model feature info")
async def model_info():
    from fraud_model   import STAGE1_FEATURES, STAGE2_FEATURES, THRESHOLD_FLAG, THRESHOLD_REJECT
    from premium_model import FEATURE_COLS, BASE_PREMIUM, MAX_PREMIUM
    return {
        "premium": {
            "features":      FEATURE_COLS,
            "output":        "risk_score (0–1) → weekly_premium_inr",
            "premium_range": f"₹{BASE_PREMIUM}–₹{MAX_PREMIUM}",
        },
        "fraud": {
            "stage1_features":    STAGE1_FEATURES,
            "stage2_features":    STAGE2_FEATURES,
            "threshold_flag":     THRESHOLD_FLAG,
            "threshold_reject":   THRESHOLD_REJECT,
            "decisions":          ["AUTO_APPROVED", "FLAGGED", "AUTO_REJECTED"],
        },
    }

# Standalone app entry point
from fastapi import FastAPI

app = FastAPI(title="GigShield ML Service", version="1.0.0")
app.include_router(router, prefix="/ml", tags=["ML"])
