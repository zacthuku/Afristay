from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

from app.services.auth.password_validator import validate_password
from app.services.email_service import EmailService


def change_password(db: Session, user_id: int, current_password: str, new_password: str):
    validate_password(new_password)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if not verify_password(current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")

    user.password_hash = hash_password(new_password)
    db.commit()

    return {"message": "Password changed successfully"}


def forgot_password(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")
    # TODO: Send email with reset token
    return {"message": "Password reset email sent"}


def reset_password(db: Session, email: str, new_password: str):
    validate_password(new_password)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Password reset successfully"}


def register_user(db: Session, email: str, password: str):
    validate_password(password)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        role="client",
        auth_provider="email",
        is_verified=False
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    
    # Send welcome email
    EmailService.send_welcome_email(user.name or email.split("@")[0], email)

    return user, token


def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.password_hash:
        raise HTTPException(401, "Invalid credentials")

    if user.is_blocked:
        raise HTTPException(403, "This account has been blocked")

    if not verify_password(password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return user, token