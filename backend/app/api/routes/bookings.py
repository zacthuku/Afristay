from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Booking, Service, User
from app.schemas.booking import BookingCreate

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _serialize_booking(booking: Booking, include_service: bool = True) -> dict:
    data = {
        "id": str(booking.id),
        "service_id": str(booking.service_id),
        "user_id": str(booking.user_id),
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "quantity": booking.quantity,
        "status": booking.status,
        "total_price": float(booking.total_price),
    }
    if include_service and booking.service:
        meta = booking.service.service_metadata or {}
        data["service_title"] = booking.service.title
        data["service_location"] = meta.get("location")
        data["service_images"] = meta.get("images", [])
    return data


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
        status="pending",
        total_price=total_price,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "id": str(booking.id),
        "service_id": str(booking.service_id),
        "user_id": str(booking.user_id),
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "quantity": booking.quantity,
        "status": booking.status,
        "total_price": float(booking.total_price),
        "message": "Booking created. Please complete payment to confirm.",
    }


# Must be before /{booking_id} to avoid routing conflict
@router.get("/host")
def get_host_bookings(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("host", "admin"):
        raise HTTPException(403, "Host access required")

    host_services = db.query(Service).filter(Service.host_id == user.id).all()
    if not host_services:
        return []

    service_ids = [s.id for s in host_services]
    bookings = (
        db.query(Booking)
        .filter(Booking.service_id.in_(service_ids))
        .order_by(Booking.start_time.desc())
        .all()
    )

    result = []
    for b in bookings:
        guest = db.query(User).filter(User.id == b.user_id).first()
        guest_name = (guest.name or guest.email.split("@")[0]) if guest else "Guest"
        meta = b.service.service_metadata or {} if b.service else {}
        result.append({
            "id": str(b.id),
            "service_id": str(b.service_id),
            "service_title": b.service.title if b.service else None,
            "guest_name": guest_name,
            "start_time": b.start_time,
            "end_time": b.end_time,
            "quantity": b.quantity,
            "status": b.status,
            "total_price": float(b.total_price),
        })
    return result


@router.get("/")
def get_bookings(user=Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user.id)
        .order_by(Booking.start_time.desc())
        .all()
    )
    return [_serialize_booking(b) for b in bookings]


@router.get("/{booking_id}")
def get_booking(booking_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == user.id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    return _serialize_booking(booking)


@router.delete("/{booking_id}")
def cancel_booking(booking_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == user.id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(400, "Booking is already cancelled")

    booking.status = "cancelled"
    db.commit()
    return {"message": "Booking cancelled"}
