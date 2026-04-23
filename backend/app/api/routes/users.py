import secrets
import string
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User, Service, Booking
from app.schemas.user import UserUpdate, UserBlockRequest
from app.services.email_service import EmailService
from app.core.security import hash_password


class RejectBody(BaseModel):
    reason: Optional[str] = ""


class AdminOnboardHostBody(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) > 254:
            raise ValueError("Email address too long (max 254 characters)")
        local = v.split("@")[0]
        if len(local) > 64:
            raise ValueError("Email local part too long (max 64 characters)")
        return v


def _generate_otp(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class HostApplicationBody(BaseModel):
    company_name: str
    business_type: str
    business_description: str
    business_email: Optional[EmailStr] = None
    phone: Optional[str] = None

    @field_validator("business_email", mode="before")
    @classmethod
    def normalize_business_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if len(v) > 254:
            raise ValueError("Email address too long (max 254 characters)")
        local = v.split("@")[0]
        if len(local) > 64:
            raise ValueError("Email local part too long (max 64 characters)")
        return v
    location: str
    services_offered: str
    operating_areas: Optional[str] = None
    pricing_range: Optional[str] = None
    doc_links: Optional[str] = None
    social_links: Optional[str] = None

router = APIRouter(prefix="/users", tags=["Users"])


def ensure_admin(user: User):
    if user.role != "admin":
        raise HTTPException(403, "Admin privileges required")
    return user


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "phone": getattr(user, "phone", None),
        "role": user.role,
        "host_application_status": getattr(user, "host_application_status", "none"),
        "host_rejection_reason": getattr(user, "host_rejection_reason", None),
        "is_blocked": getattr(user, "is_blocked", False),
    }


@router.post("/me/become-host")
def become_host(
    body: HostApplicationBody,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "host":
        return {"message": "You are already a host", "host_application_status": "approved"}

    if user.host_application_status == "pending":
        return {"message": "Host application already pending", "host_application_status": "pending"}

    user.host_application_status = "pending"
    user.host_application_data = body.model_dump()
    user.host_rejection_reason = None
    if body.phone:
        user.phone = body.phone
    db.commit()
    db.refresh(user)

    return {"message": "Host application submitted", "host_application_status": user.host_application_status}


@router.put("/me")
def update_me(
    data: UserUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email
    if data.phone is not None:
        user.phone = data.phone

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "role": user.role,
            "host_application_status": getattr(user, "host_application_status", "none"),
            "is_blocked": getattr(user, "is_blocked", False),
        },
    }


@router.delete("/me")
def delete_me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(user)
    db.commit()
    return {"message": "Your account has been deleted"}


@router.get("")
def list_users(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current_user)
    users = db.query(User).all()
    return [
        {
            "id": str(item.id),
            "email": item.email,
            "name": item.name,
            "phone": getattr(item, "phone", None),
            "role": item.role,
            "host_application_status": getattr(item, "host_application_status", "none"),
            "host_application_data": getattr(item, "host_application_data", None),
            "host_rejection_reason": getattr(item, "host_rejection_reason", None),
            "is_blocked": getattr(item, "is_blocked", False),
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in users
    ]


@router.delete("/{user_id}")
def delete_user(user_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.put("/{user_id}/approve-host")
def approve_host_user(
    user_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.role = "host"
    user.host_application_status = "approved"
    db.commit()
    db.refresh(user)

    EmailService.send_host_approval_email(user.name or user.email.split("@")[0], user.email)

    return {
        "message": "Host application approved",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "host_application_status": user.host_application_status,
            "is_blocked": getattr(user, "is_blocked", False),
        },
    }


@router.put("/{user_id}/reject-host")
def reject_host_user(
    user_id: str,
    body: RejectBody = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.host_application_status = "rejected"
    reason = (body.reason if body else "") or ""
    user.host_rejection_reason = reason
    db.commit()
    db.refresh(user)

    EmailService.send_host_rejection_email(
        user.name or user.email.split("@")[0],
        user.email,
        reason,
    )

    return {
        "message": "Host application rejected",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "host_application_status": user.host_application_status,
            "is_blocked": getattr(user, "is_blocked", False),
        },
    }


@router.put("/{user_id}/block")
def block_user(
    user_id: str,
    data: UserBlockRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_blocked = data.is_blocked
    db.commit()
    db.refresh(user)
    return {
        "message": "User status updated",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_blocked": user.is_blocked,
        },
    }

@router.get("/admin/stats")
def admin_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current_user)

    total_users = db.query(User).count()
    total_hosts = db.query(User).filter(User.role == "host").count()
    total_guests = db.query(User).filter(User.role == "client").count()
    pending_hosts = db.query(User).filter(User.host_application_status == "pending").count()

    total_services = db.query(Service).count()
    approved_services = db.query(Service).filter(Service.approval_status == "approved").count()
    pending_services = db.query(Service).filter(Service.approval_status == "pending").count()

    total_bookings = db.query(Booking).count()
    confirmed_bookings = db.query(Booking).filter(Booking.status == "confirmed").count()
    cancelled_bookings = db.query(Booking).filter(Booking.status == "cancelled").count()
    total_revenue = db.query(func.sum(Booking.total_price)).filter(Booking.status == "confirmed").scalar() or 0

    recent_users = db.query(User).order_by(User.created_at.desc()).limit(8).all()
    recent_bookings = (
        db.query(Booking)
        .order_by(Booking.created_at.desc())
        .limit(8)
        .all()
    )

    return {
        "users": {
            "total": total_users,
            "hosts": total_hosts,
            "guests": total_guests,
            "pending_hosts": pending_hosts,
        },
        "services": {
            "total": total_services,
            "approved": approved_services,
            "pending": pending_services,
        },
        "bookings": {
            "total": total_bookings,
            "confirmed": confirmed_bookings,
            "cancelled": cancelled_bookings,
        },
        "revenue": float(total_revenue),
        "recent_users": [
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in recent_users
        ],
        "recent_bookings": [
            {
                "id": str(b.id),
                "service_title": b.service.title if b.service else "—",
                "total_price": float(b.total_price),
                "status": b.status,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in recent_bookings
        ],
    }


@router.get("/admin/monthly-stats")
def admin_monthly_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(current_user)

    # Build last 6 months list
    today = date.today()
    months = []
    for i in range(5, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        months.append((y, m))

    result = []
    for year, month in months:
        revenue = db.query(func.sum(Booking.total_price)).filter(
            Booking.status == "confirmed",
            extract("year", Booking.created_at) == year,
            extract("month", Booking.created_at) == month,
        ).scalar() or 0

        bookings_count = db.query(func.count(Booking.id)).filter(
            extract("year", Booking.created_at) == year,
            extract("month", Booking.created_at) == month,
        ).scalar() or 0

        new_users = db.query(func.count(User.id)).filter(
            extract("year", User.created_at) == year,
            extract("month", User.created_at) == month,
        ).scalar() or 0

        result.append({
            "month": date(year, month, 1).strftime("%b %Y"),
            "label": date(year, month, 1).strftime("%b"),
            "revenue": float(revenue),
            "bookings": int(bookings_count),
            "new_users": int(new_users),
        })

    return result


@router.post("/admin/onboard-host")
def admin_onboard_host(
    body: AdminOnboardHostBody,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    raw_password = body.password or _generate_otp()

    new_user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(raw_password),
        phone=body.phone,
        role="host",
        host_application_status="approved",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    EmailService.send_host_onboarding_email(body.name, body.email, raw_password)

    return {
        "message": "Host onboarded successfully",
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "host_application_status": new_user.host_application_status,
        },
    }


@router.put("/{user_id}/make-admin")
def make_admin(
    user_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == "admin":
        raise HTTPException(400, "User is already an admin")
    user.role = "admin"
    db.commit()
    db.refresh(user)
    return {
        "message": "User promoted to admin",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
    }
