from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import OTPRequest, OTPVerify, PartnerRegister, LoginRequest, TokenResponse
from app.services.otp_service import send_otp, verify_otp
from app.dependencies import create_access_token
from app.database import get_supabase
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp-request", status_code=202)
async def request_otp(body: OTPRequest):
    sent = await send_otp(body.mobile)
    if not sent:
        raise HTTPException(500, "Failed to send OTP")
    return {"message": "OTP sent"}


@router.post("/otp-verify")
async def verify_otp_endpoint(body: OTPVerify):
    valid = await verify_otp(body.mobile, body.otp)
    if not valid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")
    return {"verified": True}


@router.post("/register", response_model=TokenResponse)
async def register(body: PartnerRegister):
    valid = await verify_otp(body.mobile, body.otp)
    if not valid:
        raise HTTPException(400, "Invalid OTP")

    db = get_supabase()

    # Check duplicate
    existing = db.table("partners").select("id").eq("mobile", body.mobile).execute()
    if existing.data:
        raise HTTPException(409, "Partner already registered")

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

    # Create default coverage (Plus plan)
    from datetime import datetime, timedelta
    db.table("coverage").insert({
        "partner_id": partner_id,
        "plan": "plus",
        "weekly_premium": 29.0,
        "is_active": True,
        "coverage_since": datetime.utcnow().isoformat(),
        "renewal_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
    }).execute()

    token = create_access_token({"sub": partner_id, "mobile": body.mobile})
    return TokenResponse(access_token=token, partner_id=partner_id)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    # Step 1 of login — validate partner exists, then OTP is sent separately
    db = get_supabase()
    result = db.table("partners") \
        .select("id") \
        .eq("mobile", body.mobile) \
        .eq("swiggy_partner_id", body.swiggy_partner_id) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(404, "Partner not found")

    await send_otp(body.mobile)
    return {"message": "OTP sent for verification", "next": "POST /auth/otp-verify"}


@router.post("/login/verify", response_model=TokenResponse)
async def login_verify(body: OTPVerify):
    valid = await verify_otp(body.mobile, body.otp)
    if not valid:
        raise HTTPException(400, "Invalid OTP")

    db = get_supabase()
    result = db.table("partners").select("id").eq("mobile", body.mobile).single().execute()
    if not result.data:
        raise HTTPException(404, "Partner not found")

    partner_id = result.data["id"]
    token = create_access_token({"sub": partner_id, "mobile": body.mobile})
    return TokenResponse(access_token=token, partner_id=partner_id)