from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import RegisterRequest, LoginRequest, GoogleAuthRequest
from app.services.auth.auth_service import register_user, login_user
from app.services.auth.google_service import google_auth

from app.db.session import get_db
from app.schemas.auth import TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    _, token = register_user(db, data.email, data.password)
    return {"access_token": token}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    _, token = login_user(db, data.email, data.password)
    return {"access_token": token}


@router.post("/google", response_model=TokenResponse)
def google_login(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    _, token = google_auth(db, data.id_token)
    return {"access_token": token}