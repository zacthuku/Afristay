from pydantic import BaseModel, Field, validator
from typing import List, Optional

VALID_SERVICE_TYPES = {
    "accommodation", "transport", "attraction", "restaurant",
    "experience", "tour", "adventure", "wellness", "event", "cruise",
}

VALID_PRICING_TYPES = {
    "per_night", "per_hour", "fixed", "per_km",
    "per_person", "per_day", "per_entry",
}


class ServiceCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    service_type: str = Field(..., alias="type")
    pricing_type: str
    price_base: float
    location: str
    amenities: Optional[List[str]] = []
    images: Optional[List[str]] = []
    host_avatar: Optional[str] = None
    superhost: bool = False
    country_code: Optional[str] = None

    @validator("service_type")
    def valid_service_type(cls, v):
        if v not in VALID_SERVICE_TYPES:
            raise ValueError(f"service type must be one of: {', '.join(sorted(VALID_SERVICE_TYPES))}")
        return v

    @validator("pricing_type")
    def valid_pricing_type(cls, v):
        if v not in VALID_PRICING_TYPES:
            raise ValueError(f"pricing type must be one of: {', '.join(sorted(VALID_PRICING_TYPES))}")
        return v


class ServiceUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    service_type: Optional[str] = Field(None, alias="type")
    pricing_type: Optional[str]
    price_base: Optional[float]
    location: Optional[str]
    amenities: Optional[List[str]]
    images: Optional[List[str]]
    host_avatar: Optional[str]
    superhost: Optional[bool]
    approval_status: Optional[str]
    country_code: Optional[str] = None

    @validator("service_type")
    def valid_service_type(cls, v):
        if v is None:
            return v
        if v not in VALID_SERVICE_TYPES:
            raise ValueError(f"service type must be one of: {', '.join(sorted(VALID_SERVICE_TYPES))}")
        return v

    @validator("pricing_type")
    def valid_pricing_type(cls, v):
        if v is None:
            return v
        if v not in VALID_PRICING_TYPES:
            raise ValueError(f"pricing type must be one of: {', '.join(sorted(VALID_PRICING_TYPES))}")
        return v

    @validator("approval_status")
    def valid_approval_status(cls, v):
        if v is None:
            return v
        if v not in {"pending", "approved", "rejected"}:
            raise ValueError("approval status must be pending, approved, or rejected")
        return v
