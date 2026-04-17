from fastapi import APIRouter, Depends, HTTPException, Query
from dependencies import get_current_partner
from database import get_supabase
from schemas.partner import ClaimsListResponse, ClaimOut, ClaimTimelineEvent
from services.risk_engine import evaluate_risk, get_live_conditions
from config import get_settings

settings = get_settings()

router = APIRouter(prefix="/partner", tags=["claims"])


def _build_timeline(claim: dict) -> list[ClaimTimelineEvent]:
    events = [
        ClaimTimelineEvent(event="Event Detected", timestamp=claim["created_at"], completed=True),
        ClaimTimelineEvent(event="Claim Auto-Triggered", timestamp=claim.get("triggered_at") or claim["created_at"], completed=True),
        ClaimTimelineEvent(event="Verified by AI", timestamp=claim.get("verified_at") or claim["created_at"], completed=claim["status"] in ("paid", "processing")),
        ClaimTimelineEvent(event="Payout Sent", timestamp=claim.get("paid_at") or claim["created_at"], completed=claim["status"] == "paid"),
    ]
    return events

@router.get("/claims", response_model=ClaimsListResponse)
async def list_claims(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=50),
    current: dict = Depends(get_current_partner),
):
    db = get_supabase()
    offset = (page - 1) * limit
    result = db.table("claims") \
        .select("*") \
        .eq("partner_id", current["partner_id"]) \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()

    claims = result.data or []
    total_claims = [ClaimOut(
        id=c["id"], partner_id=c["partner_id"], trigger_type=c.get("trigger_type", ""),
        status=c.get("status", "processing"), amount=c.get("amount", 0),
        created_at=c["created_at"], timeline=_build_timeline(c)
    ) for c in claims]
    amount_received = sum(c["amount"] for c in claims if c["status"] == "paid")
    pending = sum(1 for c in claims if c["status"] == "processing")

    return ClaimsListResponse(
        total=len(claims),
        amount_received=amount_received,
        pending=pending,
        claims=total_claims,
    )


@router.get("/claims/{claim_id}", response_model=ClaimOut)
async def get_claim(claim_id: str, current: dict = Depends(get_current_partner)):
    db = get_supabase()
    result = db.table("claims") \
        .select("*") \
        .eq("id", claim_id) \
        .eq("partner_id", current["partner_id"]) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(404, "Claim not found")

    c = result.data
    return ClaimOut(
        id=c["id"], partner_id=c["partner_id"], trigger_type=c.get("trigger_type", ""),
        status=c.get("status", "processing"), amount=c.get("amount", 0),
        created_at=c["created_at"], timeline=_build_timeline(c)
    )


@router.get("/risk-score")
async def get_risk_score(current: dict = Depends(get_current_partner)):
    import httpx
    from datetime import datetime
    db = get_supabase()
    partner = db.table("partners").select("zone, weekly_income, work_type").eq("id", current["partner_id"]).execute()
    if not partner.data:
        raise HTTPException(404, "Partner not found")

    zone = partner.data[0]["zone"]
    weekly_income = float(partner.data[0].get("weekly_income") or 5000)

    # Get live conditions first
    live = await get_live_conditions(zone)

    # Normalize for ML
    weather_severity   = min(live.aqi / 500, 1.0)
    aqi_level          = min(live.aqi / 500, 1.0)
    traffic_disruption = min(live.traffic_delay / 60, 1.0)
    rain_severity      = min(live.rainfall / 100, 1.0)
    # Combine weather signals
    weather_severity   = max(weather_severity, rain_severity, min((live.temperature - 25) / 20, 1.0))

    # Get claims history for claim ratio
    claims_res = db.table("claims").select("status").eq("partner_id", current["partner_id"]).execute()
    total_claims = len(claims_res.data or [])
    claim_ratio  = min(total_claims / 52, 1.0)  # normalise over a year

    # Call ML premium model
    ml_result = None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/score/premium",
                json={
                    "zone":              zone,
                    "work_type":         partner.data[0].get("work_type", "full-time"),
                    "weekly_income_inr": weekly_income,
                    "tenure_weeks":      10,
                    "claim_ratio":       round(claim_ratio, 3),
                },
            )
            if resp.status_code == 200:
                ml_result = resp.json()
    except Exception as e:
        print(f"[RiskScore] ML call failed: {e}")

    # Convert ML risk_tier to 0-100 score
    tier_score = {"LOW": 20, "MEDIUM": 55, "HIGH": 85}
    ml_score = tier_score.get(ml_result["risk_tier"] if ml_result else "LOW", 20)

    # Boost score based on live conditions
    if live.rainfall > 20:   ml_score = min(ml_score + 20, 100)
    if live.temperature > 38: ml_score = min(ml_score + 15, 100)
    if live.aqi > 200:        ml_score = min(ml_score + 15, 100)
    if live.traffic_delay > 30: ml_score = min(ml_score + 10, 100)

    level_map = {"LOW": "low", "MEDIUM": "medium", "HIGH": "high"}
    level = level_map.get(ml_result["risk_tier"] if ml_result else "LOW", "low")

    # Build contributing factors from live conditions + breakdown
    factors = []
    if live.rainfall > 20:
        factors.append(f"Rainfall {live.rainfall:.1f}mm")
    if live.temperature > 38:
        factors.append(f"High temperature {live.temperature:.1f}°C")
    if live.aqi > 200:
        factors.append(f"Poor AQI {live.aqi}")
    if live.traffic_delay > 30:
        factors.append(f"Traffic delay {live.traffic_delay}min")
    if ml_result:
        bd = ml_result.get("breakdown", {})
        if bd.get("zone_risk", 0) > 0.6:
            factors.append(f"High-risk zone ({ml_result['zone']})")
        if bd.get("claim_history", 0) > 0.2:
            factors.append(f"Claim history {round(bd['claim_history']*100)}%")

    return {
        "score": ml_score,
        "level": level,
        "contributing_factors": factors,
        "ml_premium": ml_result,
        "live_conditions": {
            "temperature": live.temperature,
            "rainfall": live.rainfall,
            "aqi": live.aqi,
            "traffic_delay": live.traffic_delay,
        }
    }


@router.get("/live-conditions")
async def live_conditions(current: dict = Depends(get_current_partner)):
    db = get_supabase()
    partner = db.table("partners").select("zone").eq("id", current["partner_id"]).execute()
    if not partner.data:
        raise HTTPException(404, "Partner not found")
    zone = partner.data[0]["zone"]
    return await get_live_conditions(zone)


# ── Manual claim submission with device signals ───────────────────────────
from pydantic import BaseModel, Field
from typing import Optional
from kafka_client import publish
from datetime import datetime

class ClaimSubmitRequest(BaseModel):
    trigger_type: str                        # heavy_rain | extreme_heat | traffic | aqi
    # Device signals for fraud detection
    gps_accuracy_m: float = 15.0
    accel_norm: float = 10.5
    location_velocity_kmh: float = 20.0
    network_type: int = 1                    # 0=WiFi, 1=cellular
    order_acceptance_latency_s: float = 30.0
    battery_drain_pct_per_hr: float = 12.0
    peer_claims_same_window: int = 2
    zone_claim_spike_ratio: float = 1.5
    device_subnet_overlap: int = 0
    claim_time_std_minutes: float = 45.0


@router.post("/claims/submit")
async def submit_claim(
    body: ClaimSubmitRequest,
    current: dict = Depends(get_current_partner),
):
    """
    Manual claim submission from the app.
    Runs ML location pre-check first, then publishes to Kafka for full processing.
    """
    import httpx
    db = get_supabase()
    partner = db.table("partners").select("zone, weekly_income").eq("id", current["partner_id"]).execute()
    if not partner.data:
        raise HTTPException(404, "Partner not found")

    zone = partner.data[0]["zone"]

    # Step 1: lightweight location pre-check
    location_warning = None
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/validate/location",
                json={
                    "worker_id": current["partner_id"],
                    "gps_accuracy_m": body.gps_accuracy_m,
                    "accel_norm": body.accel_norm,
                    "network_type": body.network_type,
                    "battery_drain_pct_per_hr": body.battery_drain_pct_per_hr,
                },
            )
            if resp.status_code == 200:
                loc = resp.json()
                if loc.get("suspicious"):
                    location_warning = loc.get("recommendation")
    except Exception as e:
        print(f"[ClaimSubmit] Location pre-check failed: {e}")

    # Step 2: get live conditions to validate trigger
    live = await get_live_conditions(zone)

    # Step 3: publish to Kafka with device signals attached
    await publish(
        settings.KAFKA_TOPIC_CLAIM_TRIGGER,
        {
            "partner_id": current["partner_id"],
            "zone": zone,
            "trigger_type": body.trigger_type,
            "score": 50,
            "conditions": {
                "temperature": live.temperature,
                "rain_mm": live.rainfall,
                "aqi": live.aqi,
                "traffic_delay_min": live.traffic_delay,
            },
            # Device signals passed through for ML fraud check
            "device_signals": {
                "gps_accuracy_m": body.gps_accuracy_m,
                "accel_norm": body.accel_norm,
                "location_velocity_kmh": body.location_velocity_kmh,
                "network_type": body.network_type,
                "order_acceptance_latency_s": body.order_acceptance_latency_s,
                "battery_drain_pct_per_hr": body.battery_drain_pct_per_hr,
                "peer_claims_same_window": body.peer_claims_same_window,
                "zone_claim_spike_ratio": body.zone_claim_spike_ratio,
                "device_subnet_overlap": body.device_subnet_overlap,
                "claim_time_std_minutes": body.claim_time_std_minutes,
            },
            "timestamp": datetime.utcnow().isoformat(),
        },
        key=current["partner_id"],
    )

    return {
        "status": "submitted",
        "message": "Claim submitted for processing",
        "location_warning": location_warning,
    }


# ── Disruption Simulator (for testing) ───────────────────────────────────
class DisruptionRequest(BaseModel):
    trigger_type:     str   = "heavy_rain"
    severity:         float = Field(0.8, ge=0.0, le=1.0)
    duration_hours:   float = Field(2.0, ge=0.25, le=12.0,
                                    description="How long the disruption lasted in hours")
    zone: Optional[str] = None

@router.post("/simulate-disruption")
async def simulate_disruption(
    body: DisruptionRequest,
    current: dict = Depends(get_current_partner),
):
    """
    Simulates a disruption event and adds the income loss to the weekly tracker.
    Loss = (daily_income / 16 working hours) × duration_hours × productivity_loss_pct
    Only extreme events qualify (matching real thresholds).
    """
    from cache import get_redis
    from datetime import timezone, timedelta

    db = get_supabase()
    partner = db.table("partners").select("zone, weekly_income").eq("id", current["partner_id"]).execute()
    if not partner.data:
        raise HTTPException(404, "Partner not found")

    weekly_income = float(partner.data[0].get("weekly_income") or 5000)
    daily_income  = weekly_income / 6        # 6 working days/week
    hourly_income = daily_income / 16        # 16 working hours/day

    # Productivity loss % per hour for each extreme event type
    # These only apply at extreme severity — mild events = 0 loss
    productivity_loss = {
        "heavy_rain":   0.60,   # 60% loss/hr — can't ride in heavy rain
        "extreme_heat": 0.35,   # 35% loss/hr — slower, fewer orders
        "traffic":      0.25,   # 25% loss/hr — stuck in traffic
        "aqi":          0.20,   # 20% loss/hr — health risk, fewer hours
    }

    base_loss_pct = productivity_loss.get(body.trigger_type, 0.30)

    # Scale by severity (only extreme counts — below 0.5 severity = no claim)
    if body.severity < 0.5:
        return {
            "status": "below_threshold",
            "message": "Severity too low — only extreme disruptions qualify for compensation.",
            "loss_added_inr": 0,
            "total_weekly_loss_inr": 0,
        }

    # Severity 0.5→1.0 maps to 50%→100% of the base loss
    severity_factor = (body.severity - 0.5) * 2   # 0.0 to 1.0
    effective_loss_pct = base_loss_pct * severity_factor

    loss_inr = round(hourly_income * effective_loss_pct * body.duration_hours, 2)
    loss_inr = max(loss_inr, 0)

    # Add to weekly accumulator
    redis  = await get_redis()
    today  = datetime.now(timezone.utc)
    monday = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
    key    = f"weekly_loss:{current['partner_id']}:{monday}"

    await redis.incrbyfloat(key, loss_inr)
    await redis.expire(key, 8 * 24 * 3600)

    # Also store per-factor breakdown
    fkey = f"weekly_loss:{current['partner_id']}:{monday}:{body.trigger_type}"
    await redis.incrbyfloat(fkey, loss_inr)
    await redis.expire(fkey, 8 * 24 * 3600)

    # Persist to Supabase
    try:
        db.table("disruption_events").insert({
            "partner_id":     current["partner_id"],
            "factor":         body.trigger_type,
            "loss_inr":       loss_inr,
            "duration_hours": body.duration_hours,
            "severity":       body.severity,
            "week_start":     monday,
        }).execute()
    except Exception as e:
        print(f"[Simulate] Supabase persist failed (table may not exist): {e}")

    new_total = float(await redis.get(key) or 0)

    return {
        "status": "accumulated",
        "trigger_type":          body.trigger_type,
        "severity":              body.severity,
        "duration_hours":        body.duration_hours,
        "hourly_income":         round(hourly_income, 2),
        "productivity_loss_pct": round(effective_loss_pct * 100, 1),
        "loss_added_inr":        loss_inr,
        "total_weekly_loss_inr": round(new_total, 2),
        "message": f"₹{loss_inr:.0f} added ({body.duration_hours}h of {body.trigger_type.replace('_',' ')}). Week total: ₹{new_total:.0f}",
    }


# ── Weekly loss tracker ───────────────────────────────────────────────────
@router.get("/weekly-loss")
async def get_weekly_loss(current: dict = Depends(get_current_partner)):
    from cache import get_redis
    from datetime import timezone, timedelta

    redis  = await get_redis()
    today  = datetime.now(timezone.utc)
    monday = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
    pid    = current["partner_id"]

    # Try Supabase first (durable, survives Redis restart)
    factors: dict[str, float] = {}
    total_loss = 0.0
    try:
        db = get_supabase()
        events = db.table("disruption_events") \
            .select("factor, loss_inr, duration_hours, severity, created_at") \
            .eq("partner_id", pid) \
            .eq("week_start", monday) \
            .order("created_at", desc=False) \
            .execute()

        if events.data:
            for e in events.data:
                f   = e["factor"]
                amt = float(e["loss_inr"])
                factors[f] = round(factors.get(f, 0) + amt, 2)
                total_loss += amt
            total_loss = round(total_loss, 2)
    except Exception:
        # Fall back to Redis
        total_key = f"weekly_loss:{pid}:{monday}"
        loss_str  = await redis.get(total_key)
        total_loss = float(loss_str) if loss_str else 0.0
        for factor in ["heavy_rain", "extreme_heat", "traffic", "aqi"]:
            fkey = f"weekly_loss:{pid}:{monday}:{factor}"
            val  = await redis.get(fkey)
            if val and float(val) > 0:
                factors[factor] = round(float(val), 2)

    days_left = 6 - today.weekday()

    return {
        "accumulated_loss_inr":  round(total_loss, 2),
        "factors":               factors,
        "week_start":            monday,
        "days_until_settlement": days_left,
        "will_trigger_claim":    total_loss >= settings.MIN_PAYOUT_INR,
    }


# ── ML premium proxy (so mobile app doesn't need to reach port 8001) ─────
@router.post("/ml-premium")
async def ml_premium_proxy(body: dict, current: dict = Depends(get_current_partner)):
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{settings.ML_SERVICE_URL}/ml/score/premium", json=body)
            return resp.json()
    except Exception as e:
        raise HTTPException(500, str(e))
