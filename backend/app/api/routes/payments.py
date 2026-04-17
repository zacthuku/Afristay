import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Booking, Payment
from app.schemas.payment import MpesaInitiate
from app.services.daraja_service import daraja_service
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/mpesa/stk-push")
async def initiate_mpesa(
    data: MpesaInitiate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == data.booking_id, Booking.user_id == user.id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status != "pending":
        raise HTTPException(400, f"Booking is already {booking.status}")

    # Check for existing pending payment to avoid double charges
    existing = (
        db.query(Payment)
        .filter(Payment.booking_id == booking.id, Payment.status == "pending")
        .first()
    )
    if existing:
        return {
            "checkout_request_id": existing.transaction_ref,
            "message": "Payment already initiated. Complete the M-Pesa prompt on your phone.",
        }

    try:
        daraja_response = await daraja_service.stk_push(
            phone=data.phone,
            amount=float(booking.total_price),
            booking_id=str(booking.id),
        )
    except Exception as e:
        logger.error("Daraja STK Push failed: %s", e)
        raise HTTPException(502, "Failed to initiate M-Pesa payment. Please try again.")

    checkout_request_id = daraja_response.get("CheckoutRequestID")
    if not checkout_request_id:
        raise HTTPException(502, "Invalid response from M-Pesa. Please try again.")

    payment = Payment(
        booking_id=booking.id,
        amount=booking.total_price,
        method="mpesa",
        status="pending",
        transaction_ref=checkout_request_id,
    )
    db.add(payment)
    db.commit()

    return {
        "checkout_request_id": checkout_request_id,
        "message": "M-Pesa prompt sent. Check your phone and enter your PIN.",
    }


@router.post("/mpesa/callback")
async def mpesa_callback(payload: dict, db: Session = Depends(get_db)):
    """Daraja webhook — called by Safaricom after the user completes or cancels the M-Pesa prompt."""
    try:
        stk_callback = payload.get("Body", {}).get("stkCallback", {})
        checkout_request_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")
    except Exception:
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    if not checkout_request_id:
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    payment = (
        db.query(Payment)
        .filter(Payment.transaction_ref == checkout_request_id)
        .first()
    )
    if not payment:
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    if result_code == 0:
        payment.status = "completed"
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.status = "confirmed"
            # Send confirmation email
            try:
                if booking.user and booking.service:
                    name = booking.user.name or booking.user.email.split("@")[0]
                    EmailService.send_booking_confirmation(
                        name,
                        booking.user.email,
                        booking.service.title,
                        booking.start_time.isoformat(),
                        booking.end_time.isoformat(),
                        float(booking.total_price),
                    )
            except Exception as e:
                logger.warning("Email notification failed: %s", e)
    else:
        payment.status = "failed"

    db.commit()
    # Daraja requires this exact response format
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@router.get("/status/{checkout_request_id}")
def check_payment_status(
    checkout_request_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Frontend polls this every 3s to check if payment completed."""
    payment = (
        db.query(Payment)
        .filter(Payment.transaction_ref == checkout_request_id)
        .first()
    )
    if not payment:
        raise HTTPException(404, "Payment not found")

    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()

    return {
        "status": payment.status,
        "booking_id": str(payment.booking_id),
        "booking_status": booking.status if booking else None,
    }
