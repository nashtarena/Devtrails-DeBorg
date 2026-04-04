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
    coords = ZONE_COORDINATES.get(zone.lower().replace(" ", "-"), (28.7041, 77.1025))
    lat, lon = coords

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            weather_resp = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"},
            )
            weather = weather_resp.json()

            aqi_resp = await client.get(
                "https://api.openweathermap.org/data/2.5/air_pollution",
                params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY},
            )
            aqi_data = aqi_resp.json()

        rain_1h = weather.get("rain", {}).get("1h", 0.0)
        temp = weather["main"]["temp"]
        aqi = aqi_data["list"][0]["main"]["aqi"] * 50
        return WeatherData(temperature=temp, rain_mm=rain_1h, aqi=aqi)
    except Exception as e:
        print(f"[WeatherService] Failed for zone {zone}: {e}")
        return WeatherData(temperature=30.0, rain_mm=0.0, aqi=100)


async def get_traffic_delay(zone: str) -> TrafficData:
    coords = ZONE_COORDINATES.get(zone.lower().replace(" ", "-"), (28.7041, 77.1025))
    lat, lon = coords
    origin = f"{lat},{lon}"
    dest = f"{lat + 0.045},{lon}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
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
        element = data["rows"][0]["elements"][0]
        normal = element["duration"]["value"]
        in_traffic = element["duration_in_traffic"]["value"]
        delay = max(0, (in_traffic - normal) // 60)
    except Exception as e:
        print(f"[WeatherService] Traffic API failed for zone {zone}: {e}")
        delay = 0

    return TrafficData(delay_minutes=delay)