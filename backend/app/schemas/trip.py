from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel


class TripGenerateRequest(BaseModel):
    destination: str
    purpose: Literal["leisure", "business", "adventure", "event"]
    check_in: date
    check_out: date
    group_size: int = 1
    max_budget: Optional[float] = None
    origin: Optional[str] = None


class TripSaveRequest(BaseModel):
    destination: str
    purpose: str
    check_in: date
    check_out: date
    group_size: int
    accommodation_id: Optional[str] = None
    transport_id: Optional[str] = None
    origin: Optional[str] = None
