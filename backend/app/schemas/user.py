from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if len(v) > 254:
            raise ValueError("Email address too long (max 254 characters)")
        local = v.split("@")[0]
        if len(local) > 64:
            raise ValueError("Email local part too long (max 64 characters)")
        return v


class UserBlockRequest(BaseModel):
    is_blocked: bool