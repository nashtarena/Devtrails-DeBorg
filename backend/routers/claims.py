from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_partner
from app.database import get_supabase
from app.schemas.partner import ClaimsListResponse, ClaimOut, ClaimTimelineEvent
from app.services.risk_engine import evaluate_risk, get_live_conditions
from app.config import get_settings

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
                    "zone": zone,
                    "month": datetime.utcnow().month,
                    "weather_severity": round(weather_severity, 3),
                    "aqi_level": round(aqi_level, 3),
                    "traffic_disruption": round(traffic_disruption, 3),
                    "worker_tenure_weeks": 10,
                    "worker_claim_ratio": round(claim_ratio, 3),
                    "weekly_income_inr": weekly_income,
                },
            )
            if resp.status_code == 200:
                ml_result = resp.json()
    except Exception as e:
        print(f"[RiskScore] ML call failed: {e}")

    # Convert ML risk_score (0-1) to 0-100 scale
    ml_score = round((ml_result["risk_score"] if ml_result else 0) * 100)
    level_map = {"LOW": "low", "MEDIUM": "medium", "HIGH": "high"}
    level = level_map.get(ml_result["risk_tier"] if ml_result else "LOW", "low")

    # Build contributing factors from breakdown
    factors = []
    if ml_result:
        bd = ml_result.get("breakdown", {})
        if bd.get("weather_severity", 0) > 0.3:
            factors.append(f"Weather severity {round(bd['weather_severity']*100)}%")
        if bd.get("aqi_level", 0) > 0.3:
            factors.append(f"AQI level {round(bd['aqi_level']*100)}%")
        if bd.get("traffic_disruption", 0) > 0.2:
            factors.append(f"Traffic disruption {round(bd['traffic_disruption']*100)}%")
        if bd.get("flood_risk", 0) > 0.4:
            factors.append(f"Zone flood risk {round(bd['flood_risk']*100)}%")
        if bd.get("month_risk", 0) > 0.5:
            factors.append(f"Seasonal risk {round(bd['month_risk']*100)}%")

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
from pydantic import BaseModel
from typing import Optional
from app.kafka_client import publish
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
