from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Review, Booking, Service, User
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse)
def create_review(
    data: ReviewCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify the service exists
    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")

    # Must have a confirmed booking for this service
    confirmed_booking = (
        db.query(Booking)
        .filter(
            Booking.user_id == user.id,
            Booking.service_id == data.service_id,
            Booking.status == "confirmed",
        )
        .first()
    )
    if not confirmed_booking:
        raise HTTPException(403, "You must have a confirmed booking to review this service")

    # Prevent duplicate reviews
    existing = (
        db.query(Review)
        .filter(Review.user_id == user.id, Review.service_id == data.service_id)
        .first()
    )
    if existing:
        raise HTTPException(400, "You have already reviewed this service")

    review = Review(
        user_id=user.id,
        service_id=data.service_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        service_id=review.service_id,
        rating=review.rating,
        comment=review.comment,
        user_name=user.name or user.email.split("@")[0],
        created_at=review.created_at,
    )


@router.get("/service/{service_id}")
def get_service_reviews(service_id: str, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.service_id == service_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    result = []
    for r in reviews:
        reviewer = db.query(User).filter(User.id == r.user_id).first()
        user_name = (reviewer.name or reviewer.email.split("@")[0]) if reviewer else "Guest"
        result.append({
            "id": str(r.id),
            "service_id": str(r.service_id),
            "rating": r.rating,
            "comment": r.comment,
            "user_name": user_name,
            "created_at": r.created_at,
        })
    return result


@router.get("/host")
def get_host_reviews(user=Depends(get_current_user), db: Session = Depends(get_db)):
    host_service_ids = [
        s.id for s in db.query(Service).filter(Service.host_id == user.id).all()
    ]
    if not host_service_ids:
        return []

    reviews = (
        db.query(Review)
        .filter(Review.service_id.in_(host_service_ids))
        .order_by(Review.created_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for r in reviews:
        reviewer = db.query(User).filter(User.id == r.user_id).first()
        service = db.query(Service).filter(Service.id == r.service_id).first()
        result.append({
            "id": str(r.id),
            "service_id": str(r.service_id),
            "service_title": service.title if service else "—",
            "rating": r.rating,
            "comment": r.comment,
            "user_name": (reviewer.name or reviewer.email.split("@")[0]) if reviewer else "Guest",
            "created_at": r.created_at,
        })
    return result
