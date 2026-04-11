import re
from fastapi import HTTPException


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    if not re.search(r"[A-Z]", password):
        raise HTTPException(400, "Must contain uppercase letter")

    if not re.search(r"[a-z]", password):
        raise HTTPException(400, "Must contain lowercase letter")

    if not re.search(r"\d", password):
        raise HTTPException(400, "Must contain a number")

    if not re.search(r"[!@#$%^&*]", password):
        raise HTTPException(400, "Must contain special character")