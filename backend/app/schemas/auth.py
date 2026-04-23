# app/schemas/auth.py

from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re


def _normalize_email(v: str) -> str:
    v = v.strip().lower()
    if len(v) > 254:
        raise ValueError("Email address too long (max 254 characters)")
    local = v.split("@")[0]
    if len(local) > 64:
        raise ValueError("Email local part too long (max 64 characters)")
    return v


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return _normalize_email(v)

    @field_validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain a number")

        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Password must contain a special character")

        return v

    @field_validator("confirm_password")
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return _normalize_email(v)


class GoogleAuthRequest(BaseModel):
    id_token: str | None = None
    token: str | None = None

    @model_validator(mode="before")
    def normalize_token(cls, values):
        if not isinstance(values, dict):
            return values

        if values.get("id_token"):
            return values

        token_value = values.get("token")
        if token_value:
            values["id_token"] = token_value
            return values

        raise ValueError("id_token is required")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain a number")

        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Password must contain a special character")

        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    origin: str = ""

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return _normalize_email(v)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain a number")

        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Password must contain a special character")

        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str = ""