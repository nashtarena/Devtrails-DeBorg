"""
Zone Poller — Weekly Parametric Insurance Model

How it works:
- Polls every 15 min for weather/traffic conditions
- Each disruption event reduces estimated daily earnings for partners in that zone
  (stored in Redis as accumulated income loss for the week)
- Publishes alerts to the alert-broadcast topic
- Every Sunday at 23:00 UTC, triggers ONE weekly claim per partner
  with the total accumulated income loss for that week
- Partners with no disruptions that week get no claim (no payout needed)
"""
import asyncio
from datetime import datetime, timezone, timedelta
from config import get_settings
from database import get_supabase
from cache import get_redis
from kafka_client import publish, close_producer
from services.weather_service import get_weather, get_traffic_delay, ZONE_COORDINATES

settings = get_settings()
POLL_INTERVAL_SECONDS = 900   # 15 min
WEEKLY_SETTLEMENT_HOUR = 23   # Sunday 23:00 UTC


def _week_key(partner_id: str) -> str:
    """Redis key for this partner's accumulated loss this week."""
    today = datetime.now(timezone.utc)
    monday = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
    return f"weekly_loss:{partner_id}:{monday}"


def _income_loss_fraction(weather, traffic) -> float:
    """
    Estimate fraction of daily income lost due to current conditions.
    Only counts EXTREME events — light rain or mild heat doesn't qualify.
    Returns 0.0 (no loss) to 1.0 (full day lost).
    Each poll covers 15 min = 1/64 of a 16-hour working day.
    """
    loss = 0.0

    # Heavy rain only (≥40mm/hr) — light rain doesn't stop deliveries
    if weather.rain_mm >= settings.RAIN_THRESHOLD_MM:
        loss += 0.5   # 50% productivity loss during heavy rain
    # No partial credit for light rain

    # Extreme heat only (≥42°C)
    if weather.temperature >= settings.HEAT_THRESHOLD_CELSIUS:
        loss += 0.35
    # No partial credit for warm weather

    # Hazardous AQI only (≥300)
    if weather.aqi >= settings.AQI_THRESHOLD:
        loss += 0.25
    # No partial credit for moderate AQI

    # Severe traffic only (≥45 min delay)
    if traffic.delay_minutes >= settings.TRAFFIC_DELAY_THRESHOLD_MIN:
        loss += 0.20
    # No partial credit for minor delays

    if loss == 0:
        return 0.0

    # Scale to 15-min contribution out of 960-min working day
    # Cap at 0.8 (can't lose 100% from a single 15-min poll)
    return min(loss * (15 / 960), 0.8 * (15 / 960))


async def poll_zone(zone: str):
    try:
        weather = await get_weather(zone)
        traffic = await get_traffic_delay(zone)

        # Publish alerts for significant events
        if weather.rain_mm >= settings.RAIN_THRESHOLD_MM:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "rain", "zone": zone, "value": weather.rain_mm,
                "description": f"Rainfall {weather.rain_mm:.1f}mm — earnings impact being tracked.",
            })
        if weather.temperature >= settings.HEAT_THRESHOLD_CELSIUS:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "heat", "zone": zone, "value": weather.temperature,
                "description": f"Extreme heat {weather.temperature:.1f}°C — earnings impact being tracked.",
            })
        if weather.aqi >= settings.AQI_THRESHOLD:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "aqi", "zone": zone, "value": weather.aqi,
                "description": f"Hazardous AQI {weather.aqi} — earnings impact being tracked.",
            })
        if traffic.delay_minutes >= settings.TRAFFIC_DELAY_THRESHOLD_MIN:
            await publish(settings.KAFKA_TOPIC_ALERT_BROADCAST, {
                "alert_type": "traffic", "zone": zone, "value": traffic.delay_minutes,
                "description": f"Traffic +{traffic.delay_minutes}min delay — earnings impact being tracked.",
            })

        # Accumulate income loss for each partner in this zone
        loss_fraction = _income_loss_fraction(weather, traffic)
        if loss_fraction <= 0:
            return

        db = get_supabase()
        partners = db.table("partners").select("id, weekly_income").eq("zone", zone).execute()
        if not partners.data:
            return

        redis = await get_redis()
        for p in partners.data:
            weekly_income = float(p.get("weekly_income") or 5000)
            daily_income  = weekly_income / 6
            hourly_income = daily_income / 16

            today  = datetime.now(timezone.utc)
            monday = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")

            # Per-factor loss — only extreme events
            factor_losses = {}
            if weather.rain_mm >= settings.RAIN_THRESHOLD_MM:
                factor_losses["heavy_rain"] = round(hourly_income * 0.50 * (15/60), 4)
            if weather.temperature >= settings.HEAT_THRESHOLD_CELSIUS:
                factor_losses["extreme_heat"] = round(hourly_income * 0.35 * (15/60), 4)
            if weather.aqi >= settings.AQI_THRESHOLD:
                factor_losses["aqi"] = round(hourly_income * 0.25 * (15/60), 4)
            if traffic.delay_minutes >= settings.TRAFFIC_DELAY_THRESHOLD_MIN:
                factor_losses["traffic"] = round(hourly_income * 0.20 * (15/60), 4)

            if not factor_losses:
                continue

            total_loss = sum(factor_losses.values())
            total_key  = f"weekly_loss:{p['id']}:{monday}"
            await redis.incrbyfloat(total_key, total_loss)
            await redis.expire(total_key, 8 * 24 * 3600)

            for factor, amount in factor_losses.items():
                fkey = f"weekly_loss:{p['id']}:{monday}:{factor}"
                await redis.incrbyfloat(fkey, amount)
                await redis.expire(fkey, 8 * 24 * 3600)

                # Persist to Supabase for durable storage
                try:
                    db.table("disruption_events").insert({
                        "partner_id":     p["id"],
                        "factor":         factor,
                        "loss_inr":       round(amount, 2),
                        "duration_hours": 0.25,   # 15-min poll
                        "severity":       0.8,
                        "week_start":     monday,
                    }).execute()
                except Exception:
                    pass  # table may not exist yet — Redis is the fallback

        print(f"[ZonePoller] {zone}: accumulated for {len(partners.data)} partners")

    except Exception as e:
        print(f"[ZonePoller] Error polling {zone}: {e}")


async def weekly_settlement():
    """
    Runs Sunday 23:00 UTC.
    Reads disruption_events from Supabase, triggers one claim per partner with loss ≥ ₹50.
    """
    print("[ZonePoller] Starting weekly settlement...")
    db    = get_supabase()
    redis = await get_redis()

    today      = datetime.now(timezone.utc)
    monday     = (today - timedelta(days=today.weekday()))
    monday_str = monday.strftime("%Y-%m-%d")

    partners = db.table("partners").select("id, zone, weekly_income").execute()
    if not partners.data:
        return

    triggered = 0
    for p in partners.data:
        total_loss     = 0.0
        factor_summary: dict = {}

        # Read from Supabase (durable)
        try:
            events = db.table("disruption_events") \
                .select("factor, loss_inr") \
                .eq("partner_id", p["id"]) \
                .eq("week_start", monday_str) \
                .execute()
            if events.data:
                for e in events.data:
                    total_loss += float(e["loss_inr"])
                    f = e["factor"]
                    factor_summary[f] = round(factor_summary.get(f, 0) + float(e["loss_inr"]), 2)
        except Exception:
            # Fall back to Redis
            key      = _week_key(p["id"])
            loss_str = await redis.get(key)
            total_loss = float(loss_str) if loss_str else 0.0

        if total_loss < settings.MIN_PAYOUT_INR:
            print(f"[Settlement] {p['id']}: ₹{total_loss:.2f} below minimum, skipping")
            continue

        weekly_income = float(p.get("weekly_income") or 5000)
        severity      = min(total_loss / (weekly_income / 6), 1.0)

        await publish(
            settings.KAFKA_TOPIC_CLAIM_TRIGGER,
            {
                "partner_id":     p["id"],
                "zone":           p["zone"],
                "trigger_type":   "weekly_disruption",
                "score":          int(severity * 100),
                "severity":       round(severity, 3),
                "weekly_loss":    round(total_loss, 2),
                "weekly_income":  weekly_income,
                "factor_summary": factor_summary,
                "settlement":     True,
                "timestamp":      datetime.now(timezone.utc).isoformat(),
            },
            key=p["id"],
        )

        # Clear Redis accumulator
        await redis.delete(_week_key(p["id"]))
        triggered += 1
        print(f"[Settlement] Triggered claim for {p['id']}: ₹{total_loss:.2f} factors={factor_summary}")

    print(f"[Settlement] Done. {triggered} claims triggered.")


async def run():
    print("[ZonePoller] Starting zone polling loop...")
    last_settlement_week = None

    while True:
        now   = datetime.now(timezone.utc)
        zones = list(ZONE_COORDINATES.keys())

        await asyncio.gather(*[poll_zone(zone) for zone in zones])

        # Weekly settlement: Sunday (weekday=6) at settlement hour
        current_week = now.isocalendar()[1]
        if (now.weekday() == 6
                and now.hour == WEEKLY_SETTLEMENT_HOUR
                and current_week != last_settlement_week):
            await weekly_settlement()
            last_settlement_week = current_week

        await asyncio.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run())
