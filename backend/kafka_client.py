import json
from aiokafka import AIOKafkaProducer
from app.config import get_settings

settings = get_settings()

_producer: AIOKafkaProducer | None = None


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await _producer.start()
    return _producer


async def publish(topic: str, payload: dict, key: str | None = None):
    producer = await get_producer()
    key_bytes = key.encode("utf-8") if key else None
    await producer.send_and_wait(topic, value=payload, key=key_bytes)


async def close_producer():
    global _producer
    if _producer:
        await _producer.stop()
        _producer = None