"""
Claim Worker:
Consumes `claim-trigger` topic → fraud check → compute payout → Razorpay → update DB
Run: python -m app.workers.claim_worker
"""
import asyncio
import json
import uuid
from datetime import datetime
from aiokafka import AIOKafkaConsumer
from app.config import get_settings
from app.database import get_supabase
from app.services.fraud_detection import run_fraud_checks, record_approved_claim
from app.services.payout_service import (
    calculate_payout_amount,
    send_payout,
    create_contact,
    create_fund_account,
)

settings = get_settings()


async def process_claim(event: dict):
    partner_id = event["partner_id"]
    zone = event["zone"]
    trigger_type = event["trigger_type"]
    score = event["score"]

    db = get_supabase()

    # Check partner exists + get plan and payout info
    partner = db.table("partners") \
        .select("id, name, mobile, upi_id, razorpay_contact_id, razorpay_fund_account_id") \
        .eq("id", partner_id) \
        .single() \
        .execute()

    if not partner.data:
        print(f"[ClaimWorker] Partner {partner_id} not found, skipping")
        return

    coverage = db.table("coverage") \
        .select("plan, is_active") \
        .eq("partner_id", partner_id) \
        .single() \
        .execute()

    if not coverage.data or not coverage.data["is_active"]:
        print(f"[ClaimWorker] No active coverage for {partner_id}, skipping")
        return

    # Fraud checks
    is_fraud, reason = await run_fraud_checks(partner_id, zone, trigger_type)
    claim_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    if is_fraud:
        print(f"[ClaimWorker] Fraud detected for {partner_id}: {reason}")
        db.table("claims").insert({
            "id": claim_id,
            "partner_id": partner_id,
            "trigger_type": trigger_type,
            "status": "rejected",
            "amount": 0,
            "reject_reason": reason,
            "created_at": now,
            "triggered_at": now,
        }).execute()
        return

    # Calculate payout
    amount = calculate_payout_amount(trigger_type, score, coverage.data["plan"])

    # Create claim in DB (processing state)
    db.table("claims").insert({
        "id": claim_id,
        "partner_id": partner_id,
        "trigger_type": trigger_type,
        "status": "processing",
        "amount": amount,
        "created_at": now,
        "triggered_at": now,
    }).execute()

    # Ensure Razorpay contact + fund account exist
    p = partner.data
    contact_id = p.get("razorpay_contact_id")
    fund_account_id = p.get("razorpay_fund_account_id")

    try:
        if not contact_id:
            contact_id = await create_contact(partner_id, p["name"], p["mobile"])
            db.table("partners").update({"razorpay_contact_id": contact_id}).eq("id", partner_id).execute()

        if not fund_account_id:
            fund_account_id = await create_fund_account(contact_id, p["upi_id"])
            db.table("partners").update({"razorpay_fund_account_id": fund_account_id}).eq("id", partner_id).execute()

        # Send payout
        payout_result = await send_payout(fund_account_id, amount, claim_id)
        paid_at = datetime.utcnow().isoformat()

        db.table("claims").update({
            "status": "paid",
            "razorpay_payout_id": payout_result["id"],
            "verified_at": paid_at,
            "paid_at": paid_at,
        }).eq("id", claim_id).execute()

        await record_approved_claim(partner_id, trigger_type)
        print(f"[ClaimWorker] Payout ₹{amount} sent to {partner_id} for {trigger_type}")

    except Exception as e:
        print(f"[ClaimWorker] Payout failed for claim {claim_id}: {e}")
        db.table("claims").update({
            "status": "rejected",
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
            print(f"[ClaimWorker] Received: {msg.value}")
            await process_claim(msg.value)
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(run())