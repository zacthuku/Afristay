from fastapi import HTTPException
from sqlalchemy.orm import Session

from google.oauth2 import id_token
from google.auth.transport import requests

from app.models import User
from app.core.security import create_access_token

GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID"


def google_auth(db: Session, token: str):
    try:
        payload = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(401, "Invalid Google token")

    email = payload.get("email")
    google_id = payload.get("sub")

    user = db.query(User).filter(User.google_id == google_id).first()

    if not user:
        user = User(
            email=email,
            google_id=google_id,
            auth_provider="google",
            role="client",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return user, token