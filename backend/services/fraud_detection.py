"""
Fraud Detection checks run before a claim is approved:
1. Rate limit: max N claims per day per partner
2. Location match: partner's zone vs incident zone
3. Ring detection: cluster of claims from same device subnet (heuristic)
4. Velocity: same trigger type claimed multiple times in 1hr
5. Weather validation: compare claim with actual weather data
6. GPS mismatch: verify claim location against expected zone
"""
from datetime import datetime, timedelta
from database import get_supabase
from cache import get_redis
from config import get_settings
from typing import Optional, Dict, Any
from services.ml_service import MLService
from services.telemetry_service import TelemetryService

settings = get_settings()


async def run_fraud_checks(
    partner_id: str,
    zone: str,
    trigger_type: str,
    claim_id: Optional[str] = None,
    location: Optional[dict] = None,
    weather_data: Optional[dict] = None,
    device_signals: Optional[Dict[str, Any]] = None
) -> tuple[bool, str, Dict[str, Any]]:
    """
    Returns (is_fraud, reason, ml_metadata). If is_fraud=True, claim is rejected.
    Enhanced with ML-based fraud detection and device telemetry.
    """
    db = get_supabase()
    redis = await get_redis()

    # 1. Weekly claim rate limit (max 1 per week)
    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday())
    weekly_key = f"claims:weekly:{partner_id}:{monday.isoformat()}"
    weekly_count = await redis.get(weekly_key)
    if weekly_count and int(weekly_count) >= 1:
        return True, "weekly_limit_exceeded", {}

    # 2. Velocity check: same trigger type in last 60 min
    velocity_key = f"claims:velocity:{partner_id}:{trigger_type}"
    if await redis.get(velocity_key):
        return True, "high_velocity", {}

    # 3. Location check: partner's registered zone must match incident zone
    partner = db.table("partners").select("zone").eq("id", partner_id).execute()
    if partner.data and partner.data[0]["zone"] != zone:
        return True, "gps_mismatch", {}

    # 4. Weather validation
    if weather_data and not validate_weather_claim(trigger_type, weather_data):
        return True, "weather_mismatch", {}

    # 5. GPS location validation (if coordinates provided)
    if location and partner.data:
        if not validate_gps_location(location, zone):
            return True, "gps_mismatch", {}

    # 6. Ring detection: if >50 partners in same zone claimed same trigger in last 10 min
    ring_key = f"ring:{zone}:{trigger_type}"
    ring_count = await redis.incr(ring_key)
    if ring_count == 1:
        await redis.expire(ring_key, 600)  # 10 min window
    if ring_count > 50:
        # Too many claims — not necessarily fraud (could be real event),
        # but flag for manual review instead of auto-approve
        return False, "ring_detection"  # let claim through but flagged

    # 7. Duplicate claim check
    if await check_duplicate_claim(partner_id, trigger_type):
        return True, "duplicate_claim", {}

    # 8. ML Fraud Detection
    ml_metadata = {}
    if claim_id:
        # Fetch telemetry if not provided
        if not device_signals:
            device_signals = await TelemetryService.get_device_telemetry(partner_id)
            
        ml_res = await MLService.predict_fraud(claim_id, device_signals)
        if ml_res:
            ml_metadata = ml_res
            # If ML decision is BLOCK, reject the claim
            if ml_res.get("decision") == "BLOCK":
                return True, f"ml_fraud_detected: {ml_res.get('explanation')}", ml_metadata
            # If high anomaly score, flag for review
            if ml_res.get("anomaly_score", 0) > 0.8:
                ml_metadata["flagged"] = True

    return False, "", ml_metadata


def validate_weather_claim(trigger_type: str, weather_data: dict) -> bool:
    """
    Validate if weather data supports the claim type
    Returns True if weather conditions match claim, False if mismatch
    """
    if trigger_type == "rain" or trigger_type == "heavy_rain":
        # Should have significant rainfall
        rainfall = weather_data.get("rainfall", 0)
        return rainfall >= (settings.RAIN_THRESHOLD_MM * 0.3)  # At least 30% of threshold
    
    elif trigger_type == "heat" or trigger_type == "extreme_heat":
        # Should have high temperature
        temp = weather_data.get("temperature", 0)
        return temp >= (settings.HEAT_THRESHOLD_CELSIUS * 0.9)  # At least 90% of threshold
    
    elif trigger_type == "aqi" or trigger_type == "pollution":
        # Should have degraded air quality
        aqi = weather_data.get("aqi", 0)
        return aqi >= (settings.AQI_THRESHOLD * 0.7)  # At least 70% of threshold
    
    elif trigger_type == "traffic":
        # Should have traffic delays
        delay = weather_data.get("traffic_delay_minutes", 0)
        return delay >= settings.TRAFFIC_DELAY_THRESHOLD_MIN
    
    return True  # Unknown trigger type, don't flag


def validate_gps_location(location: dict, expected_zone: str) -> bool:
    """
    Validate GPS coordinates are within expected zone
    Returns True if location is valid, False if mismatch
    """
    if not location or "lat" not in location or "lng" not in location:
        return False
    
    lat = location.get("lat", 0)
    lng = location.get("lng", 0)
    
    # Mock zone boundaries (in production, use real geofencing)
    zone_bounds = {
        "Chennai": {"lat_min": 12.8, "lat_max": 13.2, "lng_min": 80.1, "lng_max": 80.3},
        "Bangalore": {"lat_min": 12.8, "lat_max": 13.1, "lng_min": 77.5, "lng_max": 77.8},
        "Mumbai": {"lat_min": 18.9, "lat_max": 19.2, "lng_min": 72.8, "lng_max": 73.0},
        "Delhi": {"lat_min": 28.4, "lat_max": 28.8, "lng_min": 77.0, "lng_max": 77.3},
    }
    
    bounds = zone_bounds.get(expected_zone)
    if not bounds:
        return True  # Unknown zone, don't validate
    
    lat_valid = bounds["lat_min"] <= lat <= bounds["lat_max"]
    lng_valid = bounds["lng_min"] <= lng <= bounds["lng_max"]
    
    return lat_valid and lng_valid


async def check_duplicate_claim(partner_id: str, trigger_type: str) -> bool:
    """
    Check if partner already has a pending/approved claim of same type
    within last 1 hour
    """
    redis = await get_redis()
    dup_key = f"claims:dup_check:{partner_id}:{trigger_type}"
    exists = await redis.get(dup_key)
    return bool(exists)


async def record_approved_claim(partner_id: str, trigger_type: str):
    """Update weekly rate limit counter after a claim is approved."""
    redis = await get_redis()
    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    weekly_key = f"claims:weekly:{partner_id}:{monday.isoformat()}"
    await redis.incr(weekly_key)
    # Expire at end of Sunday
    expire_at = int((datetime.combine(sunday, datetime.max.time())).timestamp())
    await redis.expireat(weekly_key, expire_at)

    velocity_key = f"claims:velocity:{partner_id}:{trigger_type}"
    await redis.setex(velocity_key, 3600, "1")  # block same type for 1 hour
    
    # Mark as duplicate check
    dup_key = f"claims:dup_check:{partner_id}:{trigger_type}"
    await redis.setex(dup_key, 3600, "1")  # 1 hour window


async def get_fraud_stats() -> dict:
    """
    Get fraud statistics for admin dashboard
    """
    db = get_supabase()
    
    claims_result = db.table("claims").select("*").eq("status", "fraud").execute()
    fraud_claims = claims_result.data or []
    
    fraud_reasons = {}
    for claim in fraud_claims:
        reason = claim.get("fraud_reason", "unknown")
        fraud_reasons[reason] = fraud_reasons.get(reason, 0) + 1
    
    return {
        "total_fraud_flags": len(fraud_claims),
        "fraud_reasons": fraud_reasons,
        "fraud_rate": (len(fraud_claims) / max(1, len(claims_result.data or []))) * 100 if claims_result.count else 0
    }
