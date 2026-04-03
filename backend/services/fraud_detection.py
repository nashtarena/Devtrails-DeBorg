"""
Fraud Detection checks run before a claim is approved:
1. Rate limit: max N claims per day per partner
2. Location match: partner's zone vs incident zone
3. Ring detection: cluster of claims from same device subnet (heuristic)
4. Velocity: same trigger type claimed multiple times in 1hr
"""
from datetime import datetime, timedelta
from app.database import get_supabase
from app.cache import get_redis
from app.config import get_settings

settings = get_settings()


async def run_fraud_checks(partner_id: str, zone: str, trigger_type: str) -> tuple[bool, str]:
    """
    Returns (is_fraud, reason). If is_fraud=True, claim is rejected.
    """
    db = get_supabase()
    redis = await get_redis()

    # 1. Daily claim rate limit
    today = datetime.utcnow().date().isoformat()
    daily_key = f"claims:daily:{partner_id}:{today}"
    daily_count = await redis.get(daily_key)
    if daily_count and int(daily_count) >= settings.MAX_CLAIMS_PER_DAY:
        return True, f"Daily claim limit ({settings.MAX_CLAIMS_PER_DAY}) reached"

    # 2. Velocity check: same trigger type in last 60 min
    velocity_key = f"claims:velocity:{partner_id}:{trigger_type}"
    if await redis.get(velocity_key):
        return True, f"Duplicate {trigger_type} claim within 1 hour"

    # 3. Location check: partner's registered zone must match incident zone
    partner = db.table("partners").select("zone").eq("id", partner_id).single().execute()
    if partner.data and partner.data["zone"] != zone:
        return True, "Incident zone does not match partner's registered zone"

    # 4. Ring detection: if >5 partners in same zone claimed same trigger in last 10 min
    ring_key = f"ring:{zone}:{trigger_type}"
    ring_count = await redis.incr(ring_key)
    if ring_count == 1:
        await redis.expire(ring_key, 600)  # 10 min window
    if ring_count > 50:
        # Too many claims — not necessarily fraud (could be real event),
        # but flag for manual review instead of auto-approve
        return False, "flagged_high_volume"  # let claim through but flagged

    return False, ""


async def record_approved_claim(partner_id: str, trigger_type: str):
    """Update rate limit counters after a claim is approved."""
    redis = await get_redis()
    today = datetime.utcnow().date().isoformat()

    daily_key = f"claims:daily:{partner_id}:{today}"
    await redis.incr(daily_key)
    await redis.expireat(daily_key, int((datetime.utcnow() + timedelta(days=1)).timestamp()))

    velocity_key = f"claims:velocity:{partner_id}:{trigger_type}"
    await redis.setex(velocity_key, 3600, "1")  # block same type for 1hr