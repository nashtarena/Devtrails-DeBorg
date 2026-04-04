"""
Claim Worker:
Consumes `claim-trigger` topic → ML fraud check → compute payout → Razorpay → update DB
Run: python -m app.workers.claim_worker
"""
import asyncio
import json
import uuid
import httpx
from datetime import datetime
from aiokafka import AIOKafkaConsumer
from app.config import get_settings
from app.database import get_supabase
from app.services.fraud_detection import record_approved_claim
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

    # ML Fraud check — use real device signals if available
    is_fraud = False
    reason = ""
    fraud_decision = "AUTO_APPROVED"
    device = event.get("device_signals", {})
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/score/fraud",
                json={
                    "claim_id": claim_id,
                    "gps_accuracy_m":             device.get("gps_accuracy_m", 14.0),
                    "accel_norm":                 device.get("accel_norm", 10.5),
                    "location_velocity_kmh":      device.get("location_velocity_kmh", 20.0),
                    "network_type":               device.get("network_type", 1),
                    "order_acceptance_latency_s": device.get("order_acceptance_latency_s", 30.0),
                    "battery_drain_pct_per_hr":   device.get("battery_drain_pct_per_hr", 12.0),
                    "peer_claims_same_window":    device.get("peer_claims_same_window", event.get("peer_claims", 2)),
                    "zone_claim_spike_ratio":     device.get("zone_claim_spike_ratio", event.get("zone_spike_ratio", 1.5)),
                    "device_subnet_overlap":      device.get("device_subnet_overlap", 0),
                    "claim_time_std_minutes":     device.get("claim_time_std_minutes", 45.0),
                },
            )
            if resp.status_code == 200:
                fraud_result = resp.json()
                fraud_decision = fraud_result["decision"]
                if fraud_decision == "AUTO_REJECTED":
                    is_fraud = True
                    reason = fraud_result["explanation"]
                    print(f"[ClaimWorker] ML rejected claim: {fraud_result['triggered_signals']}")
                elif fraud_decision == "FLAGGED":
                    print(f"[ClaimWorker] ML flagged claim {claim_id}: {fraud_result['triggered_signals']}")
    except Exception as e:
        print(f"[ClaimWorker] ML fraud check failed, proceeding: {e}")
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