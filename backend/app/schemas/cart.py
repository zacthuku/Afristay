from datetime import datetime
from pydantic import BaseModel, UUID4


class CartItemAdd(BaseModel):
    service_id: UUID4
    check_in: datetime
    check_out: datetime
    quantity: int = 1


class CartItemUpdate(BaseModel):
    check_in: datetime | None = None
    check_out: datetime | None = None
    quantity: int | None = None
