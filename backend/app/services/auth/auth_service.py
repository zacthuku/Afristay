from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

from app.services.auth.password_validator import validate_password


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

    return user, token


def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.password_hash:
        raise HTTPException(401, "Invalid credentials")

    if not verify_password(password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return user, token