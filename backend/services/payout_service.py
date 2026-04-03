"""
Payout service via Razorpay Fund Account + Payout API.
Flow: create contact → create fund account (UPI) → create payout
"""
import httpx
import base64
from app.config import get_settings

settings = get_settings()

RAZORPAY_BASE = "https://api.razorpay.com/v1"


def _auth_header() -> str:
    creds = f"{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}"
    encoded = base64.b64encode(creds.encode()).decode()
    return f"Basic {encoded}"


async def create_contact(partner_id: str, name: str, mobile: str) -> str:
    """Returns Razorpay contact_id."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{RAZORPAY_BASE}/contacts",
            headers={"Authorization": _auth_header()},
            json={
                "name": name,
                "contact": mobile,
                "type": "employee",
                "reference_id": partner_id,
            },
        )
    resp.raise_for_status()
    return resp.json()["id"]


async def create_fund_account(contact_id: str, upi_id: str) -> str:
    """Returns Razorpay fund_account_id."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{RAZORPAY_BASE}/fund_accounts",
            headers={"Authorization": _auth_header()},
            json={
                "contact_id": contact_id,
                "account_type": "vpa",
                "vpa": {"address": upi_id},
            },
        )
    resp.raise_for_status()
    return resp.json()["id"]


async def send_payout(fund_account_id: str, amount_inr: float, claim_id: str) -> dict:
    """
    Sends payout via Razorpay.
    amount_inr is in ₹; Razorpay needs paise (×100).
    """
    amount_paise = int(amount_inr * 100)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{RAZORPAY_BASE}/payouts",
            headers={
                "Authorization": _auth_header(),
                "X-Payout-Idempotency": claim_id,  # idempotency key
            },
            json={
                "account_number": settings.RAZORPAY_KEY_ID,
                "fund_account_id": fund_account_id,
                "amount": amount_paise,
                "currency": "INR",
                "mode": "UPI",
                "purpose": "insurance_claim",
                "queue_if_low_balance": True,
                "reference_id": claim_id,
                "narration": "SecInsure Claim Payout",
            },
        )
    resp.raise_for_status()
    return resp.json()


def calculate_payout_amount(trigger_type: str, score: int, plan: str) -> float:
    """
    Parametric payout formula based on trigger type + risk score + plan.
    """
    base_amounts = {
        "heavy_rain": 200,
        "extreme_heat": 150,
        "aqi": 100,
        "traffic": 80,
    }
    plan_multipliers = {"basic": 0.5, "plus": 1.0, "shield": 1.5}

    base = base_amounts.get(trigger_type, 100)
    multiplier = plan_multipliers.get(plan, 1.0)
    # Scale by score severity (60-100 scale maps to 0.8-1.2)
    severity = 0.8 + (max(0, score - 60) / 100)

    amount = base * multiplier * severity
    return round(max(settings.MIN_PAYOUT_INR, min(settings.MAX_PAYOUT_INR, amount)), 2)