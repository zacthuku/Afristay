import os
import shutil
import uuid as uuid_lib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from geoalchemy2.elements import WKTElement

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.all_models import Service, User
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.services.email_service import EmailService

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class RejectBody(BaseModel):
    reason: Optional[str] = ""

router = APIRouter(prefix="/services", tags=["Services"])


def serialize_service(service: Service):
    metadata = service.service_metadata or {}

    return {
        "id": str(service.id),
        "title": service.title,
        "description": service.description,
        "type": service.type,
        "location": metadata.get("location", "Unknown"),
        "country_code": service.country_code,
        "price": float(service.price_base or 0),
        "pricing_type": service.pricing_type,
        "approval_status": service.approval_status,
        "rating": metadata.get("rating", 4.5),
        "reviews": metadata.get("reviews", 0),
        "images": metadata.get("images", []),
        "amenities": metadata.get("amenities", []),
        "host": {
            "id": str(service.host.id) if service.host else None,
            "name": service.host.name or service.host.email if service.host else "Host",
            "avatar": metadata.get("host_avatar"),
            "superhost": metadata.get("superhost", False),
        }
    }


@router.get("/")
def get_services(
    q: Optional[str] = None,
    type: Optional[str] = None,
    location: Optional[str] = None,
    countries: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Service).filter(Service.approval_status == "approved")

    if type:
        query = query.filter(Service.type == type)
    if min_price is not None:
        query = query.filter(Service.price_base >= min_price)
    if max_price is not None:
        query = query.filter(Service.price_base <= max_price)
    if countries:
        codes = [c.strip().upper() for c in countries.split(",") if c.strip()]
        if codes:
            query = query.filter(Service.country_code.in_(codes))
    if q:
        term = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Service.title).like(term),
                func.lower(Service.description).like(term),
                Service.service_metadata["location"].astext.ilike(term),
            )
        )
    elif location:
        term = f"%{location.lower()}%"
        query = query.filter(Service.service_metadata["location"].astext.ilike(term))

    services = query.order_by(Service.created_at.desc()).all()
    return [serialize_service(s) for s in services]


@router.get("/host")
def get_host_services(user=Depends(get_current_user), db: Session = Depends(get_db)):
    services = db.query(Service).filter(Service.host_id == user.id).all()
    return [serialize_service(s) for s in services]


@router.post("/")
def create_service(data: ServiceCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    point = WKTElement("POINT(0 0)", srid=4326)

    service = Service(
        host_id=user.id,
        type=data.service_type,
        title=data.title,
        description=data.description,
        location=point,
        price_base=data.price_base,
        pricing_type=data.pricing_type,
        approval_status="pending",
        country_code=data.country_code.upper() if data.country_code else None,
        service_metadata={
            "location": data.location,
            "amenities": data.amenities,
            "images": data.images,
            "host_avatar": data.host_avatar,
            "superhost": data.superhost,
        },
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return {"message": "Service submitted for approval", "service": serialize_service(service)}


@router.put("/{service_id}")
def update_service(
    service_id: str,
    data: ServiceUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")
    if service.host_id != user.id:
        raise HTTPException(403, "Not authorized to update this service")

    if data.title is not None:
        service.title = data.title
    if data.description is not None:
        service.description = data.description
    if data.service_type is not None:
        service.type = data.service_type
    if data.pricing_type is not None:
        service.pricing_type = data.pricing_type
    if data.price_base is not None:
        service.price_base = data.price_base
    if data.location is not None:
        service.service_metadata["location"] = data.location
    if data.amenities is not None:
        service.service_metadata["amenities"] = data.amenities
    if data.images is not None:
        service.service_metadata["images"] = data.images
    if data.host_avatar is not None:
        service.service_metadata["host_avatar"] = data.host_avatar
    if data.superhost is not None:
        service.service_metadata["superhost"] = data.superhost
    if data.country_code is not None:
        service.country_code = data.country_code.upper()

    db.commit()
    db.refresh(service)

    return {"message": "Service updated", "service": serialize_service(service)}


@router.get("/pending")
def get_pending_services(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin privileges required")

    services = db.query(Service).filter(Service.approval_status == "pending").all()
    return [serialize_service(s) for s in services]


@router.put("/{service_id}/approve")
def approve_service(
    service_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin privileges required")

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")

    service.approval_status = "approved"
    db.commit()
    db.refresh(service)

    host = db.query(User).filter(User.id == service.host_id).first()
    if host and host.role != "host":
        host.role = "host"
        host.host_application_status = "approved"
        db.commit()

    # Send email notification to the host
    if host:
        EmailService.send_service_approval_email(
            host.name or host.email.split("@")[0],
            host.email,
            service.title
        )

    return {"message": "Service approved", "service": serialize_service(service)}


@router.put("/{service_id}/reject")
def reject_service(
    service_id: str,
    body: RejectBody = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin privileges required")

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")

    service.approval_status = "rejected"
    db.commit()
    db.refresh(service)

    host = db.query(User).filter(User.id == service.host_id).first()
    reason = (body.reason if body else "") or ""
    if host:
        EmailService.send_service_rejection_email(
            host.name or host.email.split("@")[0],
            host.email,
            service.title,
            reason,
        )

    return {"message": "Service rejected", "service": serialize_service(service)}


@router.get("/{service_id}")
def get_service(service_id: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        return {"error": "Service not found"}

    return serialize_service(service)


@router.post("/{service_id}/photos")
async def upload_photo(
    service_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(404, "Service not found")
    if service.host_id != user.id and user.role != "admin":
        raise HTTPException(403, "Not authorized")

    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are allowed")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid_lib.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    url = f"/uploads/{filename}"
    meta = service.service_metadata or {}
    images = meta.get("images", [])
    images.append(url)
    service.service_metadata = {**meta, "images": images}
    db.commit()

    return {"url": url, "images": images}