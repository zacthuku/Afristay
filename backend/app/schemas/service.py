from pydantic import BaseModel, Field, validator
from typing import List, Optional


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

    @validator("service_type")
    def valid_service_type(cls, v):
        if v not in {"accommodation", "transport"}:
            raise ValueError("service type must be 'accommodation' or 'transport'")
        return v

    @validator("pricing_type")
    def valid_pricing_type(cls, v):
        if v not in {"per_night", "per_hour", "fixed", "per_km"}:
            raise ValueError("pricing type must be one of per_night, per_hour, fixed, per_km")
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

    @validator("service_type")
    def valid_service_type(cls, v):
        if v is None:
            return v
        if v not in {"accommodation", "transport"}:
            raise ValueError("service type must be 'accommodation' or 'transport'")
        return v

    @validator("pricing_type")
    def valid_pricing_type(cls, v):
        if v is None:
            return v
        if v not in {"per_night", "per_hour", "fixed", "per_km"}:
            raise ValueError("pricing type must be one of per_night, per_hour, fixed, per_km")
        return v

    @validator("approval_status")
    def valid_approval_status(cls, v):
        if v is None:
            return v
        if v not in {"pending", "approved", "rejected"}:
            raise ValueError("approval status must be pending, approved, or rejected")
        return v
