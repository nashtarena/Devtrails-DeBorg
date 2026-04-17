from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal


class AdminStatsResponse(BaseModel):
    """Admin dashboard statistics"""
    total_policies: int
    total_claims: int
    approved_claims: int
    fraud_detected: int
    total_payout: float
    total_premium: float
    loss_ratio: float
    risk_prediction: str


class FraudReason(BaseModel):
    """Reason for flagged claim"""
    type: Literal["gps_mismatch", "weather_mismatch", "duplicate_claim", "high_velocity", "ring_detection"]
    description: str


class ClaimRecord(BaseModel):
    """Complete claim record for admin view"""
    id: str
    user_id: str
    user_name: str
    partner_id: str
    disruption_type: str
    amount: float
    status: Literal["approved", "rejected", "fraud", "processing"]
    created_at: datetime
    verified_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    location: Optional[dict] = None  # {lat, lng, zone}
    fraud_reason: Optional[FraudReason] = None
    weather_data: Optional[dict] = None
    

class ClaimsListResponse(BaseModel):
    """Paginated claims list"""
    total: int
    page: int
    limit: int
    claims: list[ClaimRecord]


class FlaggedClaimResponse(BaseModel):
    """Flagged claim for fraud panel"""
    id: str
    user_name: str
    disruption_type: str
    amount: float
    reason: FraudReason
    created_at: datetime
    location: Optional[dict] = None


class RiskPredictionResponse(BaseModel):
    """Risk prediction for next week"""
    region: str
    predicted_claims_increase: int  # percentage
    expected_disruption: str  # rain, heat, pollution, etc.
    confidence: float  # 0-1
    recommendation: str


class PayoutResponse(BaseModel):
    """Payout result"""
    status: Literal["success", "failed", "pending"]
    amount: float
    claim_id: str
    transaction_id: Optional[str] = None
    message: str
    timestamp: datetime


class ClaimCreateRequest(BaseModel):
    """Claim creation request"""
    user_id: str
    user_name: str
    location: dict  # {lat, lng, zone}
    disruption_type: str  # rain, heat, pollution, traffic
    amount: float = Field(..., gt=0, le=500)


class AnalyticsDataResponse(BaseModel):
    """Analytics dashboard data"""
    loss_ratio: float
    claims_by_type: dict  # {disruption_type: count}
    approval_rate: float  # 0-100%
    fraud_rate: float  # 0-100%
    average_payout_time_hours: float
    top_disruption_zones: list[dict]  # {zone: str, count: int}
