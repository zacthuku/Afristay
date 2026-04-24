from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from app.services.email_service import EmailService

router = APIRouter(prefix="/api/v1", tags=["contact"])


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/contact")
async def submit_contact(form: ContactForm):
    EmailService.send_contact_message(
        sender_name=form.name,
        sender_email=form.email,
        subject=form.subject,
        message=form.message,
    )
    return {"ok": True}
