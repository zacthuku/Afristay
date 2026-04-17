from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from app.api.routes import auth, users, services, bookings, payments, reviews, jobs


class CrossOriginOpenerPolicyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, policy: str = "same-origin-allow-popups"):
        super().__init__(app)
        self.policy = policy

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = self.policy
        return response


app = FastAPI(title="Afristay API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure COOP to allow popups for Google sign-in
app.add_middleware(
    CrossOriginOpenerPolicyMiddleware,
    policy="same-origin-allow-popups"
)

app.include_router(auth.router)
app.include_router(users.router)  
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(reviews.router)
app.include_router(jobs.router)

@app.get("/")
async def root():
    return {"message": "Afristay backend running"}