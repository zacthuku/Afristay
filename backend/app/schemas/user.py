from pydantic import BaseModel, EmailStr
from typing import Optional


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class UserBlockRequest(BaseModel):
    is_blocked: bool