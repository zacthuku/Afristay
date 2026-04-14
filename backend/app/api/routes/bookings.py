from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Booking, Service
from app.schemas.booking import BookingCreate
from app.services.email_service import EmailService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/")
def create_booking(data: BookingCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")
    if service.approval_status != "approved":
        raise HTTPException(400, "Service is not available for booking")

    price_base = float(service.price_base or 0)
    total_price = price_base * data.quantity

    booking = Booking(
        user_id=user.id,
        service_id=service.id,
        start_time=data.start_time,
        end_time=data.end_time,
        quantity=data.quantity,
        status="confirmed",
        total_price=total_price,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    EmailService.send_booking_confirmation(
        user.name or user.email.split("@")[0],
        user.email,
        service.title,
        data.start_time.isoformat(),
        data.end_time.isoformat(),
        total_price,
    )

    return {
        "id": str(booking.id),
        "service_id": str(booking.service_id),
        "user_id": str(booking.user_id),
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "quantity": booking.quantity,
        "status": booking.status,
        "total_price": float(booking.total_price),
        "message": "Booking confirmed. A confirmation email has been sent.",
    }


@router.get("/")
def get_bookings(user=Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.user_id == user.id).all()
    return [
        {
            "id": str(booking.id),
            "service_id": str(booking.service_id),
            "user_id": str(booking.user_id),
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "quantity": booking.quantity,
            "status": booking.status,
            "total_price": float(booking.total_price),
        }
        for booking in bookings
    ]
