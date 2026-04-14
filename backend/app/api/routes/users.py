from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.user import UserUpdate, UserBlockRequest
from app.services.email_service import EmailService

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
        "is_blocked": getattr(user, "is_blocked", False),
    }


@router.post("/me/become-host")
def become_host(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "host":
        return {"message": "You are already a host", "host_application_status": "approved"}

    if user.host_application_status == "pending":
        return {"message": "Host application already pending", "host_application_status": "pending"}

    user.host_application_status = "pending"
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
            "role": item.role,
            "host_application_status": getattr(item, "host_application_status", "none"),
            "is_blocked": getattr(item, "is_blocked", False),
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