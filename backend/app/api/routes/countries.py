import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.all_models import Country, Service

router = APIRouter(prefix="/countries", tags=["Countries"])


class CountryCreate(BaseModel):
    code: str
    name: str
    flag: Optional[str] = None
    currency_code: str
    currency_symbol: str
    payment_methods: Optional[list] = []


class CountryUpdate(BaseModel):
    name: Optional[str] = None
    flag: Optional[str] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    payment_methods: Optional[list] = None
    is_active: Optional[bool] = None


def serialize_country(c: Country):
    return {
        "code": c.code,
        "name": c.name,
        "flag": c.flag,
        "currency_code": c.currency_code,
        "currency_symbol": c.currency_symbol,
        "payment_methods": c.payment_methods or [],
        "is_active": c.is_active,
    }


@router.get("/")
def list_countries(db: Session = Depends(get_db)):
    countries = (
        db.query(Country)
        .filter(Country.is_active == True)
        .order_by(Country.name)
        .all()
    )
    return [serialize_country(c) for c in countries]


@router.get("/active")
def list_active_countries(db: Session = Depends(get_db)):
    """Countries that have at least one approved listing."""
    codes = (
        db.query(Service.country_code)
        .filter(
            Service.approval_status == "approved",
            Service.country_code.isnot(None),
        )
        .distinct()
        .subquery()
    )
    countries = (
        db.query(Country)
        .filter(Country.is_active == True, Country.code.in_(codes))
        .order_by(Country.name)
        .all()
    )
    return [serialize_country(c) for c in countries]


@router.get("/{code}/cities")
def get_cities(code: str, db: Session = Depends(get_db)):
    """Distinct location values for approved listings in a country."""
    rows = (
        db.query(Service.service_metadata["location"].astext)
        .filter(
            Service.country_code == code.upper(),
            Service.approval_status == "approved",
            Service.service_metadata["location"].astext.isnot(None),
        )
        .distinct()
        .all()
    )
    return [r[0] for r in rows if r[0]]


@router.post("/")
def create_country(
    data: CountryCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    if db.query(Country).filter(Country.code == data.code.upper()).first():
        raise HTTPException(400, "Country code already exists")
    country = Country(
        id=uuid.uuid4(),
        code=data.code.upper(),
        name=data.name,
        flag=data.flag,
        currency_code=data.currency_code,
        currency_symbol=data.currency_symbol,
        payment_methods=data.payment_methods,
    )
    db.add(country)
    db.commit()
    db.refresh(country)
    return serialize_country(country)


@router.put("/{code}")
def update_country(
    code: str,
    data: CountryUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    country = db.query(Country).filter(Country.code == code.upper()).first()
    if not country:
        raise HTTPException(404, "Country not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(country, field, val)
    db.commit()
    db.refresh(country)
    return serialize_country(country)


@router.delete("/{code}")
def deactivate_country(
    code: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    country = db.query(Country).filter(Country.code == code.upper()).first()
    if not country:
        raise HTTPException(404, "Country not found")
    country.is_active = False
    db.commit()
    return {"message": "Country deactivated"}
