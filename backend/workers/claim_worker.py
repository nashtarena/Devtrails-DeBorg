"""
Claim Worker — weekly parametric insurance model.

Rules:
- Max 1 claim per partner per week (Mon–Sun)
- Payout = ML model(trigger_type, severity, weekly_income)
- Fraud check runs before payout
- Premium deducted weekly (tracked in coverage table)
"""
import asyncio
import json
import uuid
import httpx
from datetime import datetime, timedelta, timezone
from aiokafka import AIOKafkaConsumer
from config import get_settings
from database import get_supabase
from services.payout_service import (
    calculate_payout_amount, send_payout,
    create_contact, create_fund_account,
)
from services.ml_service import MLService

settings = get_settings()


def _week_start() -> str:
    """ISO string for Monday 00:00 UTC of the current week."""
    today = datetime.now(timezone.utc)
    monday = today - timedelta(days=today.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()


async def process_claim(event: dict):
    partner_id   = event["partner_id"]
    zone         = event["zone"]
    trigger_type = event["trigger_type"]
    score        = event.get("score", 50)
    severity     = event.get("severity", score / 100)
    claim_id     = str(uuid.uuid4())
    now          = datetime.now(timezone.utc).isoformat()

    # For weekly settlement claims, use the pre-calculated loss directly
    is_weekly_settlement = event.get("settlement", False)
    weekly_loss          = event.get("weekly_loss", None)

    db = get_supabase()

    # ── 1. Partner + coverage check ───────────────────────────────────────
    partner = db.table("partners") \
        .select("id, name, mobile, upi_id, razorpay_contact_id, razorpay_fund_account_id, weekly_income") \
        .eq("id", partner_id).execute()

    if not partner.data:
        print(f"[ClaimWorker] Partner {partner_id} not found, skipping")
        return
    p = partner.data[0]

    coverage = db.table("coverage") \
        .select("plan, is_active") \
        .eq("partner_id", partner_id).execute()

    if not coverage.data or not coverage.data[0]["is_active"]:
        print(f"[ClaimWorker] No active coverage for {partner_id}, skipping")
        return

    # ── 2. Weekly claim limit — max 1 per week ────────────────────────────
    week_start = _week_start()
    existing = db.table("claims") \
        .select("id") \
        .eq("partner_id", partner_id) \
        .gte("created_at", week_start) \
        .execute()

    if existing.data:
        print(f"[ClaimWorker] Partner {partner_id} already has a claim this week, skipping")
        return

    # ── 3. ML Fraud check ─────────────────────────────────────────────────
    is_fraud     = False
    reject_reason = ""
    device_signals = event.get("device_signals", {})
    
    ml_res = await MLService.predict_fraud(claim_id, device_signals)
    if ml_res:
        if ml_res.get("decision") in ("BLOCK", "AUTO_REJECTED"):
            is_fraud      = True
            reject_reason = ml_res.get("explanation", "High fraud probability")
            print(f"[ClaimWorker] ML rejected {claim_id}: {ml_res.get('triggered_signals')}")
        elif ml_res.get("decision") == "FLAGGED":
            print(f"[ClaimWorker] ML flagged {claim_id}: {ml_res.get('triggered_signals')}")
    

    if is_fraud:
        db.table("claims").insert({
            "id": claim_id, "partner_id": partner_id,
            "trigger_type": trigger_type, "status": "rejected",
            "amount": 0, "reject_reason": reject_reason,
            "created_at": now, "triggered_at": now,
        }).execute()
        return

    # ── 4. ML Claim amount — use weekly loss if settlement, else ML model ──
    weekly_income = float(p.get("weekly_income") or 5000)

    if is_weekly_settlement and weekly_loss:
        # Weekly settlement: payout = accumulated loss, capped at weekly income
        amount = round(min(weekly_loss, weekly_income), 2)
        amount = max(amount, settings.MIN_PAYOUT_INR)
        print(f"[ClaimWorker] Weekly settlement payout: ₹{amount} (loss=₹{weekly_loss:.2f})")
    else:
        # Manual/simulated claim: use ML model
        amount = calculate_payout_amount(trigger_type, score, coverage.data[0]["plan"])
        ml_payout = await MLService.calculate_claim_amount(
            trigger_type=trigger_type if trigger_type != "weekly_disruption" else "heavy_rain",
            severity=round(float(severity), 3),
            weekly_income_inr=weekly_income
        )
        if ml_payout:
            amount = ml_payout["claim_amount"]
            print(f"[ClaimWorker] ML payout: ₹{amount} for {trigger_type} sev={severity:.2f}")

    # ── 5. Create claim record ────────────────────────────────────────────
    db.table("claims").insert({
        "id": claim_id, "partner_id": partner_id,
        "trigger_type": trigger_type, "status": "processing",
        "amount": amount, "created_at": now, "triggered_at": now,
    }).execute()

    # ── 6. Razorpay payout ────────────────────────────────────────────────
    contact_id      = p.get("razorpay_contact_id")
    fund_account_id = p.get("razorpay_fund_account_id")

    try:
        if not contact_id:
            contact_id = await create_contact(partner_id, p["name"], p["mobile"])
            db.table("partners").update({"razorpay_contact_id": contact_id}).eq("id", partner_id).execute()

        if not fund_account_id:
            fund_account_id = await create_fund_account(contact_id, p["upi_id"])
            db.table("partners").update({"razorpay_fund_account_id": fund_account_id}).eq("id", partner_id).execute()

        payout_result = await send_payout(fund_account_id, amount, claim_id)
        paid_at = datetime.now(timezone.utc).isoformat()

        db.table("claims").update({
            "status": "paid",
            "razorpay_payout_id": payout_result["id"],
            "verified_at": paid_at,
            "paid_at": paid_at,
        }).eq("id", claim_id).execute()

        print(f"[ClaimWorker] ✓ Payout ₹{amount} → {partner_id} for {trigger_type}")

    except Exception as e:
        print(f"[ClaimWorker] Payout failed for {claim_id}: {e}")
        db.table("claims").update({
            "status": "processing",   # keep processing, don't reject — Razorpay may be test mode
            "reject_reason": str(e),
        }).eq("id", claim_id).execute()


async def run():
    consumer = AIOKafkaConsumer(
        settings.KAFKA_TOPIC_CLAIM_TRIGGER,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="claim-processor",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )
    await consumer.start()
    print("[ClaimWorker] Listening on claim-trigger topic...")
    try:
        async for msg in consumer:
            print(f"[ClaimWorker] Received event: {msg.value.get('trigger_type')} for {msg.value.get('partner_id')}")
            try:
                await process_claim(msg.value)
            except Exception as e:
                print(f"[ClaimWorker] Unhandled error: {e}")
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(run())
