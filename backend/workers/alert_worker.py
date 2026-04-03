"""
Alert Worker:
Consumes `alert-broadcast` topic → writes to alerts table in Supabase.
A separate scheduler (e.g., Celery Beat or cron) publishes to this topic
after checking weather thresholds across all active zones.

Run: python -m app.workers.alert_worker
"""
import asyncio
import json
import uuid
from datetime import datetime
from aiokafka import AIOKafkaConsumer
from app.config import get_settings
from app.database import get_supabase

settings = get_settings()


def _determine_severity(alert_type: str, value: float) -> str:
    thresholds = {
        "rain": [(40, "high"), (20, "medium"), (0, "low")],
        "heat": [(42, "high"), (38, "medium"), (0, "low")],
        "aqi": [(300, "high"), (200, "medium"), (0, "low")],
        "traffic": [(45, "high"), (20, "medium"), (0, "low")],
    }
    for threshold, level in thresholds.get(alert_type, []):
        if value >= threshold:
            return level
    return "info"


async def process_alert(event: dict):
    db = get_supabase()
    alert_type = event["alert_type"]
    zone = event["zone"]
    value = event.get("value", 0)
    severity = event.get("severity") or _determine_severity(alert_type, value)

    titles = {
        "rain": f"Heavy Rain Alert ({value:.0f}mm)",
        "heat": f"Extreme Heat Alert ({value:.0f}°C)",
        "aqi": f"Poor Air Quality (AQI {value:.0f})",
        "traffic": f"Traffic Congestion (+{value:.0f}min delay)",
    }

    alert_id = str(uuid.uuid4())
    db.table("alerts").insert({
        "id": alert_id,
        "title": titles.get(alert_type, "Disruption Alert"),
        "description": event.get("description", ""),
        "severity": severity,
        "alert_type": alert_type,
        "zone": zone,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    print(f"[AlertWorker] Alert stored: {alert_id} ({alert_type}, {zone})")


async def run():
    consumer = AIOKafkaConsumer(
        settings.KAFKA_TOPIC_ALERT_BROADCAST,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="alert-processor",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )
    await consumer.start()
    print("[AlertWorker] Listening on alert-broadcast topic...")
    try:
        async for msg in consumer:
            await process_alert(msg.value)
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(run())