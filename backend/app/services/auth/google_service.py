from fastapi import HTTPException
from sqlalchemy.orm import Session

from google.oauth2 import id_token
from google.auth.transport import requests

from app.models import User
from app.core.security import create_access_token
from app.core.config import settings


def google_auth(db: Session, token: str):
    try:
        payload = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(401, "Invalid Google token")

    email = payload.get("email")
    name = payload.get("name") or payload.get("given_name")
    google_id = payload.get("sub")

    # Look up by google_id first, then fall back to email (account may have been
    # created via password before the user tried Google login).
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user and user.is_blocked:
        raise HTTPException(403, "This account has been blocked")

    if not user:
        user = User(
            email=email,
            name=name,
            google_id=google_id,
            auth_provider="google",
            role="client",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        changed = False
        if not user.google_id:
            user.google_id = google_id
            changed = True
        if name and not user.name:
            user.name = name
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return user, token