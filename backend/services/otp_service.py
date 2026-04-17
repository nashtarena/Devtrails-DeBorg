import random
import httpx
from cache import get_redis
from config import get_settings

settings = get_settings()

OTP_KEY_PREFIX = "otp:"


def _generate_otp() -> str:
    return str(random.randint(100000, 999999))


async def send_otp(mobile: str) -> bool:
    otp = _generate_otp()

    if settings.DEBUG:
        print(f"[OTP DEBUG] mobile={mobile} otp={otp} (verification bypassed in debug mode)", flush=True)
        return True

    redis = await get_redis()
    await redis.setex(f"{OTP_KEY_PREFIX}{mobile}", settings.OTP_TTL_SECONDS, otp)

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": settings.FAST2SMS_API_KEY},
                json={
                    "route": "otp",
                    "variables_values": otp,
                    "numbers": mobile,
                },
                timeout=5.0,
            )
        return resp.status_code == 200
    except Exception as e:
        print(f"[OTP] SMS delivery failed: {e}", flush=True)
        return False


async def verify_otp(mobile: str, otp: str) -> bool:
    if settings.DEBUG:
        return True
    redis = await get_redis()
    stored = await redis.get(f"{OTP_KEY_PREFIX}{mobile}")
    if stored and stored == otp:
        await redis.delete(f"{OTP_KEY_PREFIX}{mobile}")
        return True
    return False
