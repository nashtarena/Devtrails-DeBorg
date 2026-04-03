from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.cache import close_redis
from app.kafka_client import close_producer
from app.routers import auth, partner, claims, alerts

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[SecInsure] Starting up...")
    yield
    print("[SecInsure] Shutting down...")
    await close_redis()
    await close_producer()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(partner.router)
app.include_router(claims.router)
app.include_router(alerts.router)


@app.get("/health")
async def health():
    return {"status": "ok"}