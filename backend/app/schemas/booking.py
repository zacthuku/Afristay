from pydantic import BaseModel, Field, UUID4
from datetime import datetime


class BookingCreate(BaseModel):
    service_id: UUID4
    start_time: datetime
    end_time: datetime
    quantity: int = Field(default=1, ge=1)


class BookingResponse(BaseModel):
    id: UUID4
    service_id: UUID4
    user_id: UUID4
    start_time: datetime
    end_time: datetime
    quantity: int
    status: str
    total_price: float
    message: str
