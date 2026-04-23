import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.api.routes import auth, users, services, bookings, payments, reviews, jobs, cart, trips
from app.api.routes.countries import router as countries_router
from app.api.routes.config import router as config_router
from app.api.routes.stats import router as stats_router
from app.core.config import settings

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


class CrossOriginOpenerPolicyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, policy: str = "same-origin-allow-popups"):
        super().__init__(app)
        self.policy = policy

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = self.policy
        return response


app = FastAPI(title="Afristay API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
_allowed_origins = list(filter(None, [
    settings.FRONTEND_URL,
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure COOP to allow popups for Google sign-in
app.add_middleware(
    CrossOriginOpenerPolicyMiddleware,
    policy="same-origin-allow-popups"
)

# Serve uploaded images as static files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(reviews.router)
app.include_router(jobs.router)
app.include_router(cart.router)
app.include_router(trips.router)
app.include_router(countries_router, prefix="/api/v1")
app.include_router(config_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Afristay backend running"}
