"""
Admin Dashboard API Router
Endpoints for admin dashboard statistics, claims management, fraud detection, and payouts
"""
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from services.admin_service import (
    get_admin_stats,
    get_all_claims_admin,
    get_flagged_claims,
    get_analytics_data,
    get_risk_prediction
)
from services.payout_service import process_admin_payout, get_payout_summary
from schemas.admin import (
    AdminStatsResponse,
    ClaimsListResponse,
    AnalyticsDataResponse,
    PayoutResponse,
    ClaimCreateRequest
)
from database import get_supabase
from services.fraud_detection import run_fraud_checks, record_approved_claim
from datetime import datetime
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_dashboard_stats():
    """
    Get admin dashboard statistics
    Returns: total policies, claims, fraud detected, financials, loss ratio
    """
    return await get_admin_stats()


@router.get("/claims", response_model=dict)
async def list_all_claims(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, regex="^(approved|rejected|fraud|processing)$")
):
    """
    Get paginated list of all claims in the system
    Optional filtering by status
    """
    db = get_supabase()
    offset = (page - 1) * limit
    
    query = db.table("claims").select("*")
    
    if status:
        query = query.eq("status", status)
    
    result = query.order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    claims = result.data or []
    
    # Get total count
    if status:
        count_query = db.table("claims").select("id", count="exact").eq("status", status)
    else:
        count_query = db.table("claims").select("id", count="exact")
    
    count_result = count_query.execute()
    total = count_result.count or 0
    
    # Enrich with user names
    enriched = []
    for claim in claims:
        enriched.append({
            "id": claim.get("id"),
            "user_id": claim.get("partner_id"),
            "user_name": f"Driver {claim.get('partner_id', 'Unknown')[:6].upper()}",
            "disruption_type": claim.get("trigger_type", "unknown"),
            "amount": claim.get("amount", 0),
            "status": claim.get("status", "processing"),
            "created_at": claim.get("created_at"),
            "verified_at": claim.get("verified_at"),
            "paid_at": claim.get("paid_at"),
            "location": claim.get("location"),
        })
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "claims": enriched
    }


@router.get("/fraud")
async def get_fraud_claims(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get list of flagged fraud claims
    Shows reason for each fraud flag
    """
    return await get_flagged_claims(page, limit)


@router.get("/analytics", response_model=AnalyticsDataResponse)
async def get_dashboard_analytics():
    """
    Get detailed analytics for admin dashboard
    Includes loss ratio, claims breakdown, approval rate, fraud rate
    """
    return await get_analytics_data()


@router.get("/predictions")
async def get_predictions():
    """
    Get next week risk predictions
    Shows expected disruptions and claim volume changes
    """
    prediction = await get_risk_prediction()
    return prediction.model_dump()


@router.post("/claims", response_model=dict)
async def create_claim(data: ClaimCreateRequest):
    """
    Simulate claim creation for admin testing
    Automatically runs fraud checks
    
    Request:
    {
        "user_id": "partner_123",
        "user_name": "John Driver",
        "location": {"lat": 13.0, "lng": 80.2, "zone": "Chennai"},
        "disruption_type": "rain",
        "amount": 150.0
    }
    """
    db = get_supabase()
    
    claim_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Run fraud checks
    is_fraud, fraud_reason = await run_fraud_checks(
        partner_id=data.user_id,
        zone=data.location.get("zone", "unknown"),
        trigger_type=data.disruption_type,
        location=data.location
    )
    
    claim_status = "fraud" if is_fraud else "approved"
    
    # Create claim in database
    claim_payload = {
        "id": claim_id,
        "partner_id": data.user_id,
        "trigger_type": data.disruption_type,
        "amount": data.amount,
        "status": claim_status,
        "fraud_reason": fraud_reason if is_fraud else None,
        "created_at": now.isoformat(),
        "location": data.location,
        "user_name": data.user_name
    }
    
    try:
        result = db.table("claims").insert(claim_payload).execute()
        if result.data:
            # If not fraud, record as approved
            if not is_fraud:
                await record_approved_claim(data.user_id, data.disruption_type)
            
            return {
                "success": True,
                "claim_id": claim_id,
                "status": claim_status,
                "message": "Claim created",
                "fraud_reason": fraud_reason if is_fraud else None
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create claim: {str(e)}")


@router.post("/payout", response_model=dict)
async def trigger_payout(claim_id: str, amount: float):
    """
    Manually trigger payout for approved claim
    
    Query params:
    - claim_id: The claim ID to pay out
    - amount: Amount to pay (in INR)
    
    Returns:
    {
        "status": "success",
        "amount": 200.0,
        "transaction_id": "TXN-...",
        "message": "Payout processed instantly"
    }
    """
    result = await process_admin_payout(claim_id, amount)
    
    if result["status"] == "failed":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.get("/payout-summary")
async def get_payouts_today():
    """
    Get today's payout summary
    Total payouts processed and amounts
    """
    return await get_payout_summary()


@router.post("/claim/{claim_id}/approve")
async def approve_claim_admin(claim_id: str):
    """
    Admin manually approves a flagged/processing claim
    """
    db = get_supabase()
    
    try:
        result = db.table("claims").update({
            "status": "approved",
            "verified_at": datetime.utcnow().isoformat()
        }).eq("id", claim_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        return {"success": True, "message": "Claim approved", "claim_id": claim_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/claim/{claim_id}/reject")
async def reject_claim_admin(claim_id: str, reason: str = "Admin decision"):
    """
    Admin manually rejects a claim
    """
    db = get_supabase()
    
    try:
        result = db.table("claims").update({
            "status": "rejected",
            "fraud_reason": reason,
            "verified_at": datetime.utcnow().isoformat()
        }).eq("id", claim_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        return {"success": True, "message": "Claim rejected", "claim_id": claim_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/admin")
async def admin_health():
    """Health check for admin service"""
    return {"status": "ok", "service": "admin_dashboard"}
