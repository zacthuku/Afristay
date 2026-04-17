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
            raise ValueError("Enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678)")
        return cleaned
