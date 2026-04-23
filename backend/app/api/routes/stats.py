from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.all_models import Service, User

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/")
def get_platform_stats(db: Session = Depends(get_db)):
    listings = db.query(func.count(Service.id)).filter(Service.approval_status == "approved").scalar() or 0

    countries = (
        db.query(func.count(func.distinct(Service.country_code)))
        .filter(Service.approval_status == "approved", Service.country_code.isnot(None))
        .scalar() or 0
    )

    hosts = db.query(func.count(User.id)).filter(User.role == "host").scalar() or 0

    travelers = (
        db.query(func.count(User.id))
        .filter(User.role.in_(["client", "guest"]))
        .scalar() or 0
    )

    return {
        "countries": countries,
        "listings": listings,
        "hosts": hosts,
        "travelers": travelers,
    }
