"""
Risk Engine:
- Scores current zone conditions (0–100)
- Determines if a parametric trigger threshold is breached
- Publishes claim-trigger event to Kafka if threshold met
"""
from datetime import datetime
from config import get_settings
from services.weather_service import get_weather, get_traffic_delay
from kafka_client import publish
from schemas.partner import RiskScore, LiveConditions

settings = get_settings()


def _compute_score(temp: float, rain_mm: float, aqi: int, traffic_min: int) -> tuple[int, list[str]]:
    score = 0
    factors = []

    # Rain contribution (max 40pts)
    if rain_mm >= settings.RAIN_THRESHOLD_MM:
        score += 40
        factors.append(f"Heavy rain ({rain_mm:.1f}mm)")
    elif rain_mm >= 20:
        score += 20
        factors.append(f"Moderate rain ({rain_mm:.1f}mm)")

    # Heat contribution (max 30pts)
    if temp >= settings.HEAT_THRESHOLD_CELSIUS:
        score += 30
        factors.append(f"Extreme heat ({temp:.1f}°C)")
    elif temp >= 38:
        score += 15
        factors.append(f"High temperature ({temp:.1f}°C)")

    # AQI contribution (max 20pts)
    if aqi >= settings.AQI_THRESHOLD:
        score += 20
        factors.append(f"Hazardous AQI ({aqi})")
    elif aqi >= 200:
        score += 10
        factors.append(f"Very poor AQI ({aqi})")

    # Traffic contribution (max 10pts)
    if traffic_min >= settings.TRAFFIC_DELAY_THRESHOLD_MIN:
        score += 10
        factors.append(f"Severe traffic (+{traffic_min}min)")

    return min(score, 100), factors


def _score_to_level(score: int) -> str:
    if score >= 75:
        return "critical"
    if score >= 50:
        return "high"
    if score >= 25:
        return "medium"
    return "low"


async def evaluate_risk(zone: str, partner_id: str) -> RiskScore:
    weather = await get_weather(zone)
    traffic = await get_traffic_delay(zone)

    score, factors = _compute_score(
        weather.temperature, weather.rain_mm, weather.aqi, traffic.delay_minutes
    )

    # Auto-trigger claim if any threshold breached
    trigger_type = _get_trigger_type(weather, traffic)
    if trigger_type:
        await publish(
            settings.KAFKA_TOPIC_CLAIM_TRIGGER,
            {
                "partner_id": partner_id,
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
            key=partner_id,
        )

    return RiskScore(
        score=score,
        level=_score_to_level(score),
        contributing_factors=factors,
        timestamp=datetime.utcnow(),
    )


async def get_live_conditions(zone: str) -> LiveConditions:
    weather = await get_weather(zone)
    traffic = await get_traffic_delay(zone)
    return LiveConditions(
        temperature=weather.temperature,
        rainfall=weather.rain_mm,
        aqi=weather.aqi,
        traffic_delay=traffic.delay_minutes,
        zone=zone,
        updated_at=datetime.utcnow(),
    )


def _get_trigger_type(weather, traffic) -> str | None:
    if weather.rain_mm >= settings.RAIN_THRESHOLD_MM:
        return "heavy_rain"
    if weather.temperature >= settings.HEAT_THRESHOLD_CELSIUS:
        return "extreme_heat"
    if weather.aqi >= settings.AQI_THRESHOLD:
        return "aqi"
    if traffic.delay_minutes >= settings.TRAFFIC_DELAY_THRESHOLD_MIN:
        return "traffic"
    return None