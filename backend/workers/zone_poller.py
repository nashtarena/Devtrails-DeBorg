"""
Zone Poller:
Every 15 minutes, checks weather + traffic for all active zones.
If thresholds are breached → publishes to alert-broadcast and claim-trigger topics.

Run: python -m app.workers.zone_poller
"""
import asyncio
from datetime import datetime
from app.config import get_settings
from app.database import get_supabase
from app.kafka_client import publish, close_producer
from app.services.weather_service import get_weather, get_traffic_delay, ZONE_COORDINATES

settings = get_settings()
POLL_INTERVAL_SECONDS = 900  # 15 min


async def poll_zone(zone: str):
    try:
        weather = await get_weather(zone)
        traffic = await get_traffic_delay(zone)

        # Check thresholds and publish alerts
        if weather.rain_mm >= settings.RAIN_THRESHOLD_MM:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "rain",
                "zone": zone,
                "value": weather.rain_mm,
                "description": f"Rainfall of {weather.rain_mm:.1f}mm recorded. Claim may be auto-triggered.",
            })

        if weather.temperature >= settings.HEAT_THRESHOLD_CELSIUS:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "heat",
                "zone": zone,
                "value": weather.temperature,
                "description": f"Temperature {weather.temperature:.1f}°C. Extreme heat conditions.",
            })

        if weather.aqi >= settings.AQI_THRESHOLD:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "aqi",
                "zone": zone,
                "value": weather.aqi,
                "description": f"AQI {weather.aqi} — hazardous air quality.",
            })

        if traffic.delay_minutes >= settings.TRAFFIC_DELAY_THRESHOLD_MIN:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "traffic",
                "zone": zone,
                "value": traffic.delay_minutes,
                "description": f"Traffic adding {traffic.delay_minutes}min delay on key routes.",
            })

        # For each active partner in this zone, trigger claims if thresholds breached
        db = get_supabase()
        partners = db.table("partners") \
            .select("id") \
            .eq("zone", zone) \
            .execute()

        trigger_type = None
        if weather.rain_mm >= settings.RAIN_THRESHOLD_MM:
            trigger_type = "heavy_rain"
        elif weather.temperature >= settings.HEAT_THRESHOLD_CELSIUS:
            trigger_type = "extreme_heat"
        elif weather.aqi >= settings.AQI_THRESHOLD:
            trigger_type = "aqi"
        elif traffic.delay_minutes >= settings.TRAFFIC_DELAY_THRESHOLD_MIN:
            trigger_type = "traffic"

        if trigger_type and partners.data:
            from app.services.risk_engine import _compute_score
            score, _ = _compute_score(
                weather.temperature, weather.rain_mm, weather.aqi, traffic.delay_minutes
            )
            for p in partners.data:
                await publish(
                    settings.KAFKA_TOPIC_CLAIM_TRIGGER,
                    {
                        "partner_id": p["id"],
                        "zone": zone,
                        "trigger_type": trigger_type,
                        "score": score,
                        "conditions": {
                            "temperature": weather.temperature,
                            "rain_mm": weather.rain_mm,
                            "aqi": weather.aqi,
                            "traffic_delay_min": traffic.delay_minutes,
                        },
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    key=p["id"],
                )

        print(f"[ZonePoller] Polled {zone} at {datetime.utcnow().isoformat()}")

    except Exception as e:
        print(f"[ZonePoller] Error polling {zone}: {e}")


async def run():
    print("[ZonePoller] Starting zone polling loop...")
    while True:
        zones = list(ZONE_COORDINATES.keys())
        await asyncio.gather(*[poll_zone(zone) for zone in zones])
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run())