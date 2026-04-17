"""
Admin service layer for dashboard operations
"""
from datetime import datetime, timedelta
from database import get_supabase
from schemas.admin import (
    AdminStatsResponse, FlaggedClaimResponse, FraudReason,
    RiskPredictionResponse, AnalyticsDataResponse
)
from typing import Optional
import random


async def get_admin_stats() -> AdminStatsResponse:
    """
    Fetch all dashboard statistics
    """
    db = get_supabase()
    
    # Get all claims
    claims_result = db.table("claims").select("*").execute()
    claims = claims_result.data or []
    
    total_claims = len(claims)
    approved_claims = sum(1 for c in claims if c.get("status") == "approved")
    fraud_detected = sum(1 for c in claims if c.get("status") == "fraud")
    
    # Calculate financials
    total_payout = sum(c.get("amount", 0) for c in claims if c.get("status") in ("approved", "paid"))
    
    # Get total premium (from partners' weekly income as proxy)
    partners_result = db.table("partners").select("weekly_income").execute()
    partners = partners_result.data or []
    total_premium = sum(p.get("weekly_income", 0) for p in partners)
    
    # Calculate loss ratio
    loss_ratio = (total_payout / total_premium * 100) if total_premium > 0 else 0.0
    
    # Get total policies (unique partners)
    total_policies = len(partners)
    
    # Generate risk prediction
    risk_prediction = generate_risk_prediction()
    
    return AdminStatsResponse(
        total_policies=total_policies,
        total_claims=total_claims,
        approved_claims=approved_claims,
        fraud_detected=fraud_detected,
        total_payout=total_payout,
        total_premium=total_premium,
        loss_ratio=round(loss_ratio, 2),
        risk_prediction=risk_prediction
    )


async def get_all_claims_admin(page: int = 1, limit: int = 20) -> dict:
    """
    Get paginated list of all claims for admin dashboard
    """
    db = get_supabase()
    offset = (page - 1) * limit
    
    result = db.table("claims") \
        .select("*") \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    claims = result.data or []
    
    # Count total claims
    total_result = db.table("claims").select("id", count="exact").execute()
    total = total_result.count or 0
    
    # Enrich claims with user names (mock for now)
    enriched_claims = []
    for claim in claims:
        enriched_claims.append({
            "id": claim.get("id"),
            "user_id": claim.get("partner_id"),
            "user_name": f"Driver {claim.get('partner_id', 'Unknown')[:6].upper()}",
            "partner_id": claim.get("partner_id"),
            "disruption_type": claim.get("trigger_type", "unknown"),
            "amount": claim.get("amount", 0),
            "status": claim.get("status", "processing"),
            "created_at": claim.get("created_at"),
            "verified_at": claim.get("verified_at"),
            "paid_at": claim.get("paid_at"),
            "location": claim.get("location"),
            "fraud_reason": None,
            "weather_data": claim.get("weather_data")
        })
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "claims": enriched_claims
    }


async def get_flagged_claims(page: int = 1, limit: int = 10) -> dict:
    """
    Get list of flagged fraud claims
    """
    db = get_supabase()
    offset = (page - 1) * limit
    
    result = db.table("claims") \
        .select("*") \
        .eq("status", "fraud") \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    fraud_claims = result.data or []
    
    # Count total fraud claims
    total_result = db.table("claims") \
        .select("id", count="exact") \
        .eq("status", "fraud") \
        .execute()
    total_fraud = total_result.count or 0
    
    flagged = []
    for claim in fraud_claims:
        fraud_reason = parse_fraud_reason(claim.get("fraud_reason", "duplicate_claim"))
        flagged.append({
            "id": claim.get("id"),
            "user_name": f"Driver {claim.get('partner_id', 'Unknown')[:6].upper()}",
            "disruption_type": claim.get("trigger_type", "unknown"),
            "amount": claim.get("amount", 0),
            "reason": fraud_reason,
            "created_at": claim.get("created_at"),
            "location": claim.get("location")
        })
    
    return {
        "total": total_fraud,
        "page": page,
        "limit": limit,
        "claims": flagged
    }


def parse_fraud_reason(reason_str: str) -> dict:
    """Parse fraud reason string into structured format"""
    reason_map = {
        "gps_mismatch": {
            "type": "gps_mismatch",
            "description": "GPS location doesn't match disruption zone"
        },
        "weather_mismatch": {
            "type": "weather_mismatch",
            "description": "No weather disruption detected in area"
        },
        "duplicate_claim": {
            "type": "duplicate_claim",
            "description": "Multiple claims submitted in short timeframe"
        },
        "high_velocity": {
            "type": "high_velocity",
            "description": "Excessive claims from same user within 1 hour"
        },
        "ring_detection": {
            "type": "ring_detection",
            "description": "Suspicious cluster of claims from same region"
        }
    }
    
    return reason_map.get(reason_str, {
        "type": "duplicate_claim",
        "description": "Claim flagged for review"
    })


async def get_analytics_data() -> AnalyticsDataResponse:
    """
    Fetch detailed analytics for admin dashboard
    """
    db = get_supabase()
    
    claims_result = db.table("claims").select("*").execute()
    claims = claims_result.data or []
    
    total_claims = len(claims)
    approved = sum(1 for c in claims if c.get("status") == "approved")
    fraud = sum(1 for c in claims if c.get("status") == "fraud")
    
    approval_rate = (approved / total_claims * 100) if total_claims > 0 else 0.0
    fraud_rate = (fraud / total_claims * 100) if total_claims > 0 else 0.0
    
    # Claims by type
    claims_by_type = {}
    for claim in claims:
        claim_type = claim.get("trigger_type", "unknown")
        claims_by_type[claim_type] = claims_by_type.get(claim_type, 0) + 1
    
    # Top zones
    zones_count = {}
    for claim in claims:
        location = claim.get("location", {})
        zone = location.get("zone", "unknown") if isinstance(location, dict) else "unknown"
        zones_count[zone] = zones_count.get(zone, 0) + 1
    
    top_zones = sorted(
        [{"zone": z, "count": c} for z, c in zones_count.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:5]
    
    # Average payout time (mock calculation)
    paid_claims = [c for c in claims if c.get("status") == "paid"]
    avg_payout_hours = calculate_avg_payout_time(paid_claims)
    
    # Calculate loss ratio
    total_payout = sum(c.get("amount", 0) for c in paid_claims)
    partners_result = db.table("partners").select("weekly_income").execute()
    partners = partners_result.data or []
    total_premium = sum(p.get("weekly_income", 0) for p in partners)
    loss_ratio = (total_payout / total_premium * 100) if total_premium > 0 else 0.0
    
    return AnalyticsDataResponse(
        loss_ratio=round(loss_ratio, 2),
        claims_by_type=claims_by_type,
        approval_rate=round(approval_rate, 1),
        fraud_rate=round(fraud_rate, 1),
        average_payout_time_hours=avg_payout_hours,
        top_disruption_zones=top_zones
    )


def calculate_avg_payout_time(paid_claims: list) -> float:
    """Calculate average time to process payout"""
    if not paid_claims:
        return 0.0
    
    total_hours = 0
    for claim in paid_claims:
        created = datetime.fromisoformat(claim.get("created_at", datetime.now().isoformat()))
        paid = datetime.fromisoformat(claim.get("paid_at", datetime.now().isoformat()))
        hours = (paid - created).total_seconds() / 3600
        total_hours += hours
    
    return round(total_hours / len(paid_claims), 1)


def generate_risk_prediction() -> str:
    """
    Generate a mock risk prediction for next week
    In production, this would connect to ML models
    """
    regions = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Hyderabad"]
    risk_zones = random.choice(regions)
    prediction = random.randint(15, 40)
    
    conditions = [
        "heavy rain expected",
        "extreme heat warning",
        "air quality degradation",
        "traffic congestion"
    ]
    condition = random.choice(conditions)
    
    return f"High risk in {risk_zones} – {condition} – claims expected to increase by {prediction}%"


async def get_risk_prediction() -> RiskPredictionResponse:
    """Get next week's risk prediction"""
    # Mock prediction - in production, call ML service
    return RiskPredictionResponse(
        region="Chennai",
        predicted_claims_increase=25,
        expected_disruption="rain",
        confidence=0.78,
        recommendation="Prepare customer support team for higher volume of claims"
    )
