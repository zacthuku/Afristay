from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.all_models import Service, User
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.services.email_service import EmailService

router = APIRouter(prefix="/services", tags=["Services"])


def serialize_service(service: Service):
    metadata = service.service_metadata or {}

    return {
        "id": str(service.id),
        "title": service.title,
        "description": service.description,
        "type": service.type,
        "location": metadata.get("location", "Unknown"),
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
def get_services(db: Session = Depends(get_db)):
    services = db.query(Service).filter(Service.approval_status == "approved").all()
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


@router.get("/{service_id}")
def get_service(service_id: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        return {"error": "Service not found"}

    return serialize_service(service)