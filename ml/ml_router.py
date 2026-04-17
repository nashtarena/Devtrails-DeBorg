"""
SecInsure ML Service

Endpoints:
  POST /ml/score/premium     → weekly premium (income + zone + work_type)
  POST /ml/score/claim       → claim payout amount (severity + income)
  POST /ml/score/fraud       → fraud detection pipeline
  POST /ml/validate/location → lightweight GPS spoofing pre-check
  GET  /ml/health
"""

from __future__ import annotations
import logging, time
from functools import lru_cache
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from premium_model import predict_premium, load_premium_model
from claim_model   import predict_claim_amount, load_claim_model
from fraud_model   import predict_fraud, load_fraud_models, ClaimDecision

logger = logging.getLogger("secinsure.ml")
router = APIRouter()


@lru_cache(maxsize=1)
def _premium_models():
    return load_premium_model()

@lru_cache(maxsize=1)
def _claim_models():
    return load_claim_model()

@lru_cache(maxsize=1)
def _fraud_models():
    return load_fraud_models()


# ── Premium ────────────────────────────────────────────────────────────────
class PremiumRequest(BaseModel):
    zone:              str   = Field(..., example="Dwarka")
    work_type:         str   = Field("full-time", example="full-time")
    weekly_income_inr: float = Field(5000.0, ge=0)
    tenure_weeks:      int   = Field(10, ge=0)
    claim_ratio:       float = Field(0.0, ge=0.0, le=1.0)

class PremiumResponse(BaseModel):
    zone:               str
    weekly_premium_inr: float
    risk_tier:          str
    breakdown:          dict


@router.post("/score/premium", response_model=PremiumResponse)
async def score_premium(req: PremiumRequest):
    try:
        model, encoder = _premium_models()
        result = predict_premium(
            zone=req.zone, work_type=req.work_type,
            weekly_income_inr=req.weekly_income_inr,
            tenure_weeks=req.tenure_weeks, claim_ratio=req.claim_ratio,
            model=model, encoder=encoder,
        )
        return PremiumResponse(
            zone=result.zone, weekly_premium_inr=result.weekly_premium_inr,
            risk_tier=result.risk_tier, breakdown=result.breakdown,
        )
    except Exception as e:
        logger.exception("Premium scoring failed")
        raise HTTPException(500, str(e))


# ── Claim Amount ───────────────────────────────────────────────────────────
class ClaimRequest(BaseModel):
    trigger_type:      str   = Field(..., example="heavy_rain")
    severity:          float = Field(..., ge=0.0, le=1.0, description="0=mild, 1=extreme")
    weekly_income_inr: float = Field(5000.0, ge=0)

class ClaimResponse(BaseModel):
    trigger_type:  str
    severity:      float
    claim_amount:  float
    explanation:   str


@router.post("/score/claim", response_model=ClaimResponse)
async def score_claim(req: ClaimRequest):
    try:
        model, encoder = _claim_models()
        result = predict_claim_amount(
            trigger_type=req.trigger_type, severity=req.severity,
            weekly_income_inr=req.weekly_income_inr,
            model=model, encoder=encoder,
        )
        return ClaimResponse(
            trigger_type=result.trigger_type, severity=result.severity,
            claim_amount=result.claim_amount, explanation=result.explanation,
        )
    except Exception as e:
        logger.exception("Claim scoring failed")
        raise HTTPException(500, str(e))


# ── Fraud ──────────────────────────────────────────────────────────────────
class FraudRequest(BaseModel):
    claim_id:                   str
    gps_accuracy_m:             float = Field(..., ge=0)
    accel_norm:                 float
    location_velocity_kmh:      float = Field(..., ge=0)
    network_type:               int   = Field(..., ge=0, le=1)
    order_acceptance_latency_s: float = Field(..., ge=0)
    battery_drain_pct_per_hr:   float = Field(..., ge=0)
    peer_claims_same_window:    int   = Field(..., ge=0)
    zone_claim_spike_ratio:     float = Field(..., ge=0)
    device_subnet_overlap:      int   = Field(..., ge=0)
    claim_time_std_minutes:     float = Field(..., ge=0)

class FraudResponse(BaseModel):
    claim_id:           str
    fraud_probability:  float
    anomaly_score:      float
    decision:           str
    triggered_signals:  list[str]
    grace_window_hours: int
    explanation:        str


@router.post("/score/fraud", response_model=FraudResponse)
async def score_fraud(req: FraudRequest):
    try:
        iso, xgb, scaler = _fraud_models()
        result = predict_fraud(
            claim_id=req.claim_id,
            gps_accuracy_m=req.gps_accuracy_m, accel_norm=req.accel_norm,
            location_velocity_kmh=req.location_velocity_kmh, network_type=req.network_type,
            order_acceptance_latency_s=req.order_acceptance_latency_s,
            battery_drain_pct_per_hr=req.battery_drain_pct_per_hr,
            peer_claims_same_window=req.peer_claims_same_window,
            zone_claim_spike_ratio=req.zone_claim_spike_ratio,
            device_subnet_overlap=req.device_subnet_overlap,
            claim_time_std_minutes=req.claim_time_std_minutes,
            iso_forest=iso, xgb=xgb, scaler=scaler,
        )
        return FraudResponse(
            claim_id=result.claim_id, fraud_probability=result.fraud_probability,
            anomaly_score=result.anomaly_score, decision=result.decision.value,
            triggered_signals=result.triggered_signals,
            grace_window_hours=result.grace_window_hours, explanation=result.explanation,
        )
    except Exception as e:
        logger.exception("Fraud scoring failed")
        raise HTTPException(500, str(e))


# ── Location pre-check ─────────────────────────────────────────────────────
class LocationRequest(BaseModel):
    worker_id:                str
    gps_accuracy_m:           float = Field(..., ge=0)
    accel_norm:               float
    network_type:             int   = Field(..., ge=0, le=1)
    battery_drain_pct_per_hr: float = Field(..., ge=0)

class LocationResponse(BaseModel):
    worker_id:      str
    suspicious:     bool
    signals:        list[str]
    recommendation: str


@router.post("/validate/location", response_model=LocationResponse)
async def validate_location(req: LocationRequest):
    signals = []
    if req.gps_accuracy_m < 4.0:
        signals.append(f"GPS accuracy {req.gps_accuracy_m:.1f}m — suspiciously precise")
    if abs(req.accel_norm - 9.8) < 0.08:
        signals.append("Accelerometer shows stationary device")
    if req.network_type == 0:
        signals.append("Device on WiFi during outdoor disruption")
    if req.battery_drain_pct_per_hr > 30:
        signals.append(f"Battery draining {req.battery_drain_pct_per_hr:.0f}%/hr")

    suspicious = len(signals) >= 2
    recommendation = (
        "Location signals look normal." if not suspicious
        else "Multiple anomalies detected. Claim will enter verification window."
    )
    return LocationResponse(worker_id=req.worker_id, suspicious=suspicious,
                            signals=signals, recommendation=recommendation)


# ── Health ─────────────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    return {"status": "ok", "models": ["premium", "claim", "fraud"]}


# ── Standalone app ─────────────────────────────────────────────────────────
from fastapi import FastAPI
app = FastAPI(title="SecInsure ML Service", version="2.0.0")
app.include_router(router, prefix="/ml", tags=["ML"])
