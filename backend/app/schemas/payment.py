import re
from pydantic import BaseModel, Field, UUID4, field_validator


class MpesaInitiate(BaseModel):
    booking_id: UUID4
    phone: str = Field(..., min_length=9, max_length=15)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        pattern = r"^(\+?254|0)[17]\d{8}$"
        if not re.match(pattern, cleaned):
            raise ValueError("Enter a valid Kenyan Safaricom number (e.g. 0712345678)")
        return cleaned


class AirtelInitiate(BaseModel):
    booking_id: UUID4
    phone: str = Field(..., min_length=9, max_length=15)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        # Airtel Kenya: 073x, 074x, 075x, 076x, 078x
        pattern = r"^(\+?254|0)(7[34568]\d{7})$"
        if not re.match(pattern, cleaned):
            raise ValueError("Enter a valid Airtel Kenya number (e.g. 0733123456)")
        return cleaned


class CardInitiate(BaseModel):
    booking_id: UUID4
