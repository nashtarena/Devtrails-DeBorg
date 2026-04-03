import httpx
from dataclasses import dataclass
from app.config import get_settings

settings = get_settings()

# Zone → lat/lng map (expand as needed for Delhi/Mumbai/Chennai etc.)
ZONE_COORDINATES: dict[str, tuple[float, float]] = {
    "delhi-north": (28.7041, 77.1025),
    "delhi-south": (28.5244, 77.1855),
    "mumbai-west": (19.0760, 72.8777),
    "chennai-central": (13.0827, 80.2707),
    "bangalore-south": (12.9141, 77.6101),
}


@dataclass
class WeatherData:
    temperature: float
    rain_mm: float    # last 1h
    aqi: int


@dataclass
class TrafficData:
    delay_minutes: int


async def get_weather(zone: str) -> WeatherData:
    coords = ZONE_COORDINATES.get(zone, (28.7041, 77.1025))
    lat, lon = coords

    async with httpx.AsyncClient() as client:
        # Current weather
        weather_resp = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"},
        )
        weather = weather_resp.json()

        # Air pollution
        aqi_resp = await client.get(
            "https://api.openweathermap.org/data/2.5/air_pollution",
            params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY},
        )
        aqi_data = aqi_resp.json()

    rain_1h = weather.get("rain", {}).get("1h", 0.0)
    temp = weather["main"]["temp"]
    aqi = aqi_data["list"][0]["main"]["aqi"] * 50  # OWM AQI 1-5 → rough US AQI scale

    return WeatherData(temperature=temp, rain_mm=rain_1h, aqi=aqi)


async def get_traffic_delay(zone: str) -> TrafficData:
    """
    Uses Google Maps Distance Matrix to estimate delay vs free-flow.
    Returns extra delay in minutes for a representative route in the zone.
    """
    coords = ZONE_COORDINATES.get(zone, (28.7041, 77.1025))
    lat, lon = coords
    # Simple: origin = zone center, destination = 5km north
    origin = f"{lat},{lon}"
    dest = f"{lat + 0.045},{lon}"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://maps.googleapis.com/maps/api/distancematrix/json",
            params={
                "origins": origin,
                "destinations": dest,
                "departure_time": "now",
                "key": settings.GOOGLE_MAPS_API_KEY,
            },
        )
    data = resp.json()
    try:
        element = data["rows"][0]["elements"][0]
        normal = element["duration"]["value"]
        in_traffic = element["duration_in_traffic"]["value"]
        delay = max(0, (in_traffic - normal) // 60)
    except (KeyError, IndexError):
        delay = 0

    return TrafficData(delay_minutes=delay)