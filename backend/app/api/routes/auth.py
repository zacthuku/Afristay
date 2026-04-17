from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import RegisterRequest, LoginRequest, GoogleAuthRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth.auth_service import register_user, login_user, change_password, forgot_password, reset_password
from app.api.deps import get_current_user
from app.services.auth.google_service import google_auth
from app.models import User

from app.db.session import get_db
from app.schemas.auth import TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    _, token = register_user(db, data.email, data.password)
    return {"access_token": token, "message": "Registration successful! Welcome to AfriStay."}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    _, token = login_user(db, data.email, data.password)
    return {"access_token": token, "message": "Login successful!"}


@router.post("/google", response_model=TokenResponse)
def google_login(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    _, token = google_auth(db, data.id_token)
    return {"access_token": token, "message": "Google login successful!"}


@router.put("/change-password")
def change_user_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return change_password(db, user.id, data.current_password, data.new_password)


@router.post("/forgot-password")
def forgot_user_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password(db, data.email, data.origin)


@router.post("/reset-password")
def reset_user_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_password(db, data.token, data.new_password)