from fastapi import APIRouter, HTTPException, status
from schemas.auth import OTPRequest, OTPVerify, PartnerRegister, LoginRequest, TokenResponse
from services.otp_service import send_otp, verify_otp
from dependencies import create_access_token
from database import get_supabase
from config import get_settings
import uuid

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp-request", status_code=202)
async def request_otp(body: OTPRequest):
    await send_otp(body.mobile)
    return {"message": "OTP sent"}


@router.post("/otp-verify")
async def verify_otp_endpoint(body: OTPVerify):
    valid = await verify_otp(body.mobile, body.otp)
    if not valid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")
    return {"verified": True}


@router.post("/register", response_model=TokenResponse)
async def register(body: PartnerRegister):
    body.normalize()
    valid = await verify_otp(body.mobile, body.otp)
    if not valid:
        raise HTTPException(400, "Invalid OTP")

    db = get_supabase()

    # Check duplicate mobile
    existing = db.table("partners").select("id").eq("mobile", body.mobile).execute()
    if existing.data:
        raise HTTPException(409, "Mobile number already registered. Please login instead.")

    # Check duplicate partner ID
    existing_pid = db.table("partners").select("id").eq("swiggy_partner_id", body.swiggy_partner_id).execute()
    if existing_pid.data:
        raise HTTPException(409, f"Partner ID {body.swiggy_partner_id} already registered. Please login instead.")

    partner_id = str(uuid.uuid4())
    db.table("partners").insert({
        "id": partner_id,
        "swiggy_partner_id": body.swiggy_partner_id,
        "name": body.name,
        "mobile": body.mobile,
        "weekly_income": body.weekly_income,
        "work_type": body.work_type,
        "zone": body.zone,
        "upi_id": body.upi_id,
        "pan": body.pan,
        "aadhaar_last4": body.aadhaar_last4,
        "kyc_verified": False,
    }).execute()

    # Create coverage with ML-computed premium
    from datetime import datetime, timedelta
    import httpx as _httpx

    ml_premium = 29.0  # fallback
    risk_tier  = "MEDIUM"
    try:
        async with _httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/score/premium",
                json={
                    "zone":              body.zone,
                    "work_type":         body.work_type,
                    "weekly_income_inr": float(body.weekly_income),
                    "tenure_weeks":      1,
                    "claim_ratio":       0.0,
                },
            )
            if resp.status_code == 200:
                ml_result  = resp.json()
                ml_premium = ml_result["weekly_premium_inr"]
                risk_tier  = ml_result["risk_tier"]
    except Exception as e:
        print(f"[Register] ML premium failed, using default: {e}")

    db.table("coverage").insert({
        "partner_id": partner_id,
        "plan": "plus",
        "weekly_premium": ml_premium,
        "is_active": True,
        "coverage_since": datetime.utcnow().isoformat(),
        "renewal_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
    }).execute()

    token = create_access_token({"sub": partner_id, "mobile": body.mobile})
    return TokenResponse(access_token=token, partner_id=partner_id)


@router.post("/login", status_code=202)
async def login(body: LoginRequest):
    db = get_supabase()

    # Normalize partner ID same way as registration
    swiggy_id = body.swiggy_partner_id
    if not swiggy_id.startswith("SWG-"):
        swiggy_id = f"SWG-{swiggy_id}"

    result = db.table("partners") \
        .select("id") \
        .eq("mobile", body.mobile) \
        .eq("swiggy_partner_id", swiggy_id) \
        .execute()

    if not result.data:
        # Try without partner ID match — maybe they forgot it
        result2 = db.table("partners").select("id, swiggy_partner_id").eq("mobile", body.mobile).execute()
        print(f"[Login] mobile={body.mobile} swiggy_id={swiggy_id} found_by_mobile={result2.data}")
        raise HTTPException(404, "Partner not found. Check your mobile number and Partner ID.")

    await send_otp(body.mobile)
    return {"message": "OTP sent for verification", "next": "POST /auth/otp-verify"}


@router.post("/login/verify", response_model=TokenResponse)
async def login_verify(body: OTPVerify):
    valid = await verify_otp(body.mobile, body.otp)
    if not valid:
        raise HTTPException(400, "Invalid OTP")

    db = get_supabase()
    result = db.table("partners").select("id").eq("mobile", body.mobile).execute()
    if not result.data:
        raise HTTPException(404, "Partner not found")

    partner_id = result.data[0]["id"]
    token = create_access_token({"sub": partner_id, "mobile": body.mobile})
    return TokenResponse(access_token=token, partner_id=partner_id)


@router.get("/check-partner/{swiggy_partner_id}")
async def check_partner_exists(swiggy_partner_id: str):
    """Quick check if a partner ID is already registered."""
    db = get_supabase()
    pid = swiggy_partner_id if swiggy_partner_id.startswith("SWG-") else f"SWG-{swiggy_partner_id}"
    result = db.table("partners").select("id").eq("swiggy_partner_id", pid).execute()
    return {"exists": bool(result.data)}


@router.post("/estimate-premium")
async def estimate_premium(body: dict):
    """Unauthenticated ML premium estimate — used during onboarding."""
    import httpx as _httpx
    try:
        async with _httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{settings.ML_SERVICE_URL}/ml/score/premium", json=body)
            return resp.json()
    except Exception as e:
        raise HTTPException(500, str(e))
