from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_partner
from app.database import get_supabase
from app.schemas.partner import PartnerProfile, CoverageStatus
from datetime import datetime

router = APIRouter(prefix="/partner", tags=["partner"])


@router.get("/profile", response_model=PartnerProfile)
async def get_profile(current: dict = Depends(get_current_partner)):
    db = get_supabase()
    result = db.table("partners").select("*").eq("id", current["partner_id"]).single().execute()
    if not result.data:
        raise HTTPException(404, "Partner not found")
    return result.data


@router.put("/profile")
async def update_profile(updates: dict, current: dict = Depends(get_current_partner)):
    # Only allow safe fields to be updated
    allowed = {"name", "zone", "work_type", "weekly_income", "upi_id"}
    safe = {k: v for k, v in updates.items() if k in allowed}
    if not safe:
        raise HTTPException(400, "No updatable fields provided")

    db = get_supabase()
    db.table("partners").update(safe).eq("id", current["partner_id"]).execute()
    return {"updated": list(safe.keys())}


@router.get("/coverage", response_model=CoverageStatus)
async def get_coverage(current: dict = Depends(get_current_partner)):
    db = get_supabase()
    cov = db.table("coverage") \
        .select("*") \
        .eq("partner_id", current["partner_id"]) \
        .single() \
        .execute()

    if not cov.data:
        raise HTTPException(404, "No active coverage found")

    # Aggregate claims stats
    claims = db.table("claims") \
        .select("amount, status") \
        .eq("partner_id", current["partner_id"]) \
        .execute()

    total_claims = len(claims.data)
    total_payout = sum(c["amount"] for c in claims.data if c["status"] == "paid")

    return CoverageStatus(
        **cov.data,
        total_claims=total_claims,
        total_payout=total_payout,
    )