from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SecInsure API"
    DEBUG: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    OTP_TTL_SECONDS: int = 300  # 5 min

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_CLAIM_TRIGGER: str = "claim-trigger"
    KAFKA_TOPIC_ALERT_BROADCAST: str = "alert-broadcast"
    KAFKA_TOPIC_PAYOUT_REQUEST: str = "payout-request"
    KAFKA_TOPIC_FRAUD_CHECK: str = "fraud-check"

    # External APIs
    OPENWEATHER_API_KEY: str
    GOOGLE_MAPS_API_KEY: str
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    FAST2SMS_API_KEY: str  # Indian SMS gateway

    # ML Service
    ML_SERVICE_URL: str = "http://ml:8001"
    RAIN_THRESHOLD_MM: float = 40.0       # Heavy rain
    HEAT_THRESHOLD_CELSIUS: float = 42.0  # Extreme heat
    AQI_THRESHOLD: int = 300              # Hazardous AQI
    TRAFFIC_DELAY_THRESHOLD_MIN: int = 45 # Traffic delay in minutes

    # Payout limits
    MIN_PAYOUT_INR: int = 50
    MAX_PAYOUT_INR: int = 500
    MAX_CLAIMS_PER_DAY: int = 3

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()