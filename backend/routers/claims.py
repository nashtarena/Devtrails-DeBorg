from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_partner
from app.database import get_supabase
from app.schemas.partner import ClaimsListResponse, ClaimOut, ClaimTimelineEvent
from app.services.risk_engine import evaluate_risk, get_live_conditions

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

    claims = result.data
    total_claims = [ClaimOut(**c, timeline=_build_timeline(c)) for c in claims]
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
    return ClaimOut(**c, timeline=_build_timeline(c))


@router.get("/risk-score")
async def get_risk_score(current: dict = Depends(get_current_partner)):
    db = get_supabase()
    partner = db.table("partners").select("zone").eq("id", current["partner_id"]).single().execute()
    zone = partner.data["zone"]
    return await evaluate_risk(zone, current["partner_id"])


@router.get("/live-conditions")
async def live_conditions(current: dict = Depends(get_current_partner)):
    db = get_supabase()
    partner = db.table("partners").select("zone").eq("id", current["partner_id"]).single().execute()
    zone = partner.data["zone"]
    return await get_live_conditions(zone)