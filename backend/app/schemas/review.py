from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    service_id: UUID4
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=3, max_length=1000)


class ReviewResponse(BaseModel):
    id: UUID4
    service_id: UUID4
    rating: int
    comment: str
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
