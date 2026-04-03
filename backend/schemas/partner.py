from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ── Partner ────────────────────────────────────────────────────────────────
class PartnerProfile(BaseModel):
    id: str
    swiggy_partner_id: str
    name: str
    mobile: str
    zone: str
    work_type: str
    weekly_income: float
    upi_id: str
    kyc_verified: bool
    created_at: datetime


class CoverageStatus(BaseModel):
    partner_id: str
    plan: str          # basic | plus | shield
    weekly_premium: float
    is_active: bool
    coverage_since: datetime
    renewal_date: datetime
    total_claims: int
    total_payout: float


# ── Claims ─────────────────────────────────────────────────────────────────
class ClaimTimelineEvent(BaseModel):
    event: str
    timestamp: datetime
    completed: bool


class ClaimOut(BaseModel):
    id: str
    partner_id: str
    trigger_type: str      # heavy_rain | extreme_heat | traffic | aqi
    status: str            # processing | paid | rejected
    amount: float
    claim_date: datetime
    timeline: list[ClaimTimelineEvent]


class ClaimsListResponse(BaseModel):
    total: int
    amount_received: float
    pending: int
    claims: list[ClaimOut]


# ── Risk ───────────────────────────────────────────────────────────────────
class RiskScore(BaseModel):
    score: int                 # 0-100
    level: str                 # low | medium | high | critical
    contributing_factors: list[str]
    timestamp: datetime


# ── Alerts ─────────────────────────────────────────────────────────────────
class AlertOut(BaseModel):
    id: str
    title: str
    description: str
    severity: str              # high | medium | low | info
    alert_type: str            # rain | heat | traffic | aqi | coverage
    zone: str
    created_at: datetime
    is_read: bool


# ── Live Data ──────────────────────────────────────────────────────────────
class LiveConditions(BaseModel):
    temperature: float
    rain_mm: float
    aqi: int
    traffic_delay_min: int
    zone: str
    updated_at: datetime