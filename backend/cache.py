import redis.asyncio as aioredis
from config import get_settings

settings = get_settings()

_redis: aioredis.Redis | None = None
_use_memory_fallback = False


class MemoryRedis:
    """In-memory fallback for Redis when not available."""
    def __init__(self):
        self._store = {}

    async def setex(self, key: str, ttl: int, value: str):
        self._store[key] = {"value": value, "ttl": ttl}
        return True

    async def get(self, key: str):
        data = self._store.get(key)
        return data["value"] if data else None

    async def delete(self, key: str):
        self._store.pop(key, None)
        return True

    async def ping(self):
        return True

    async def close(self):
        self._store.clear()


_memory_redis = MemoryRedis()


async def get_redis():
    global _redis, _use_memory_fallback
    if _use_memory_fallback:
        return _memory_redis
    if _redis is None:
        try:
            client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await client.ping()
            _redis = client
        except Exception as e:
            print(f"[Cache] Redis unavailable, using in-memory fallback: {e}")
            _use_memory_fallback = True
            return _memory_redis
    try:
        await _redis.ping()
    except Exception:
        _redis = None
        _use_memory_fallback = True
        return _memory_redis
    return _redis


async def close_redis():
    global _redis, _use_memory_fallback
    if _redis:
        await _redis.close()
        _redis = None
