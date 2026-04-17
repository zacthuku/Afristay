import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import JobOpening

router = APIRouter(prefix="/jobs", tags=["Jobs"])


class JobBody(BaseModel):
    title: str
    team: str
    location: str
    employment_type: str
    description: str
    requirements: Optional[str] = None
    is_active: bool = True


def _serialize(j: JobOpening) -> dict:
    return {
        "id": str(j.id),
        "title": j.title,
        "team": j.team,
        "location": j.location,
        "employment_type": j.employment_type,
        "description": j.description,
        "requirements": j.requirements,
        "is_active": j.is_active,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    }


@router.get("")
def list_active_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobOpening).filter(JobOpening.is_active == True).order_by(JobOpening.created_at.desc()).all()
    return [_serialize(j) for j in jobs]


@router.get("/all")
def list_all_jobs(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    jobs = db.query(JobOpening).order_by(JobOpening.created_at.desc()).all()
    return [_serialize(j) for j in jobs]


@router.post("")
def create_job(body: JobBody, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    job = JobOpening(**body.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return _serialize(job)


@router.put("/{job_id}")
def update_job(job_id: str, body: JobBody, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    job = db.query(JobOpening).filter(JobOpening.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    for k, v in body.model_dump().items():
        setattr(job, k, v)
    db.commit()
    db.refresh(job)
    return _serialize(job)


@router.delete("/{job_id}")
def delete_job(job_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    job = db.query(JobOpening).filter(JobOpening.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}
