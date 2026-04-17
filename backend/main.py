from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import get_settings
from cache import close_redis
from kafka_client import close_producer
from routers import auth, partner, claims, alerts, admin, telemetry

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

# CORS middleware - must be before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add custom exception handler for CORS on errors
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    )

# Handle 404s with CORS headers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Not found"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    )

app.include_router(auth.router)
app.include_router(partner.router)
app.include_router(claims.router)
app.include_router(alerts.router)
app.include_router(admin.router)
app.include_router(telemetry.router)


@app.get("/health")
async def health():
    return {"status": "ok"}