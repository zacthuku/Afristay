import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.all_models import ServiceCategory, Destination, ServiceType, RejectionReason

router = APIRouter(prefix="/config", tags=["Config"])


# ─── Serializers ────────────────────────────────────────────────────────────

def serialize_category(c: ServiceCategory):
    return {
        "id": str(c.id),
        "slug": c.slug,
        "name": c.name,
        "icon": c.icon,
        "location_keyword": c.location_keyword,
        "display_bg": c.display_bg,
        "display_border": c.display_border,
        "display_text": c.display_text,
        "category_type": c.category_type,
        "display_order": c.display_order,
    }


def serialize_destination(d: Destination):
    return {
        "id": str(d.id),
        "name": d.name,
        "slug": d.slug,
        "subtitle": d.subtitle,
        "image_url": d.image_url,
        "country_code": d.country_code,
        "is_featured": d.is_featured,
        "display_order": d.display_order,
    }


def serialize_service_type(t: ServiceType):
    return {
        "id": str(t.id),
        "slug": t.slug,
        "label": t.label,
        "icon": t.icon,
        "description": t.description,
        "pricing_types": t.pricing_types or [],
        "category": t.category,
        "display_order": t.display_order,
    }


def serialize_rejection_reason(r: RejectionReason):
    return {
        "id": str(r.id),
        "text": r.text,
        "applies_to": r.applies_to,
    }


# ─── Schemas ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    slug: str
    name: str
    icon: Optional[str] = None
    location_keyword: Optional[str] = None
    display_bg: Optional[str] = None
    display_border: Optional[str] = None
    display_text: Optional[str] = None
    category_type: Optional[str] = "experience"
    display_order: Optional[int] = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    location_keyword: Optional[str] = None
    display_bg: Optional[str] = None
    display_border: Optional[str] = None
    display_text: Optional[str] = None
    category_type: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class DestinationCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    country_code: Optional[str] = None
    is_featured: Optional[bool] = True
    display_order: Optional[int] = 0


class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    country_code: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ServiceTypeCreate(BaseModel):
    slug: str
    label: str
    icon: Optional[str] = None
    description: Optional[str] = None
    pricing_types: Optional[list] = []
    category: Optional[str] = "accommodation"
    display_order: Optional[int] = 0


class ServiceTypeUpdate(BaseModel):
    label: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    pricing_types: Optional[list] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class RejectionReasonCreate(BaseModel):
    text: str
    applies_to: Optional[str] = "both"


class RejectionReasonUpdate(BaseModel):
    text: Optional[str] = None
    applies_to: Optional[str] = None
    is_active: Optional[bool] = None


# ─── Categories ──────────────────────────────────────────────────────────────

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    items = (
        db.query(ServiceCategory)
        .filter(ServiceCategory.is_active == True)
        .order_by(ServiceCategory.display_order, ServiceCategory.name)
        .all()
    )
    return [serialize_category(c) for c in items]


@router.post("/categories")
def create_category(
    data: CategoryCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    if db.query(ServiceCategory).filter(ServiceCategory.slug == data.slug).first():
        raise HTTPException(400, "Slug already exists")
    item = ServiceCategory(id=uuid.uuid4(), **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_category(item)


@router.put("/categories/{item_id}")
def update_category(
    item_id: str,
    data: CategoryUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(ServiceCategory).filter(ServiceCategory.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return serialize_category(item)


@router.delete("/categories/{item_id}")
def delete_category(
    item_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(ServiceCategory).filter(ServiceCategory.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    item.is_active = False
    db.commit()
    return {"message": "Category deactivated"}


# ─── Destinations ─────────────────────────────────────────────────────────────

@router.get("/destinations")
def get_destinations(db: Session = Depends(get_db)):
    items = (
        db.query(Destination)
        .filter(Destination.is_active == True)
        .order_by(Destination.display_order, Destination.name)
        .all()
    )
    return [serialize_destination(d) for d in items]


@router.post("/destinations")
def create_destination(
    data: DestinationCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = Destination(id=uuid.uuid4(), **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_destination(item)


@router.put("/destinations/{item_id}")
def update_destination(
    item_id: str,
    data: DestinationUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(Destination).filter(Destination.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return serialize_destination(item)


@router.delete("/destinations/{item_id}")
def delete_destination(
    item_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(Destination).filter(Destination.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    item.is_active = False
    db.commit()
    return {"message": "Destination deactivated"}


# ─── Service Types ────────────────────────────────────────────────────────────

@router.get("/service-types")
def get_service_types(db: Session = Depends(get_db)):
    items = (
        db.query(ServiceType)
        .filter(ServiceType.is_active == True)
        .order_by(ServiceType.display_order, ServiceType.label)
        .all()
    )
    return [serialize_service_type(t) for t in items]


@router.post("/service-types")
def create_service_type(
    data: ServiceTypeCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    if db.query(ServiceType).filter(ServiceType.slug == data.slug).first():
        raise HTTPException(400, "Slug already exists")
    item = ServiceType(id=uuid.uuid4(), **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_service_type(item)


@router.put("/service-types/{item_id}")
def update_service_type(
    item_id: str,
    data: ServiceTypeUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(ServiceType).filter(ServiceType.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return serialize_service_type(item)


@router.delete("/service-types/{item_id}")
def delete_service_type(
    item_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(ServiceType).filter(ServiceType.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    item.is_active = False
    db.commit()
    return {"message": "Service type deactivated"}


# ─── Rejection Reasons ────────────────────────────────────────────────────────

@router.get("/rejection-reasons")
def get_rejection_reasons(db: Session = Depends(get_db)):
    items = (
        db.query(RejectionReason)
        .filter(RejectionReason.is_active == True)
        .order_by(RejectionReason.text)
        .all()
    )
    return [serialize_rejection_reason(r) for r in items]


@router.post("/rejection-reasons")
def create_rejection_reason(
    data: RejectionReasonCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = RejectionReason(id=uuid.uuid4(), **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_rejection_reason(item)


@router.put("/rejection-reasons/{item_id}")
def update_rejection_reason(
    item_id: str,
    data: RejectionReasonUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(RejectionReason).filter(RejectionReason.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return serialize_rejection_reason(item)


@router.delete("/rejection-reasons/{item_id}")
def delete_rejection_reason(
    item_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    item = db.query(RejectionReason).filter(RejectionReason.id == item_id).first()
    if not item:
        raise HTTPException(404, "Not found")
    item.is_active = False
    db.commit()
    return {"message": "Rejection reason deactivated"}
