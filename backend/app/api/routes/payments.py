import logging
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models import Booking, Payment
from app.models.all_models import ActivityBooking
from app.schemas.payment import MpesaInitiate, AirtelInitiate, CardInitiate
from app.services.airtel_service import airtel_service
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
        # Check if this is an activity booking payment
        activity_booking = db.query(ActivityBooking).filter(
            ActivityBooking.payment_reference == checkout_request_id
        ).first()
        if activity_booking:
            if result_code == 0:
                activity_booking.payment_status = "paid"
                activity_booking.status = "confirmed"
            else:
                activity_booking.payment_status = "failed"
                activity_booking.status = "cancelled"
            db.commit()
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


@router.post("/airtel/stk-push")
async def initiate_airtel(
    data: AirtelInitiate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.AIRTEL_CLIENT_ID or not settings.AIRTEL_CLIENT_SECRET:
        raise HTTPException(503, "Airtel Money payments are not yet configured. Please use M-Pesa or card.")

    booking = (
        db.query(Booking)
        .filter(Booking.id == data.booking_id, Booking.user_id == user.id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status != "pending":
        raise HTTPException(400, f"Booking is already {booking.status}")

    existing = (
        db.query(Payment)
        .filter(Payment.booking_id == booking.id, Payment.status == "pending")
        .first()
    )
    if existing:
        return {
            "checkout_request_id": existing.transaction_ref,
            "message": "Payment already initiated. Complete the Airtel Money prompt on your phone.",
        }

    try:
        airtel_response = await airtel_service.ussd_push(
            phone=data.phone,
            amount=float(booking.total_price),
            booking_id=str(booking.id),
        )
    except Exception as e:
        logger.error("Airtel USSD push failed: %s", e)
        raise HTTPException(502, "Failed to initiate Airtel Money payment. Please try again.")

    transaction_id = airtel_response.get("transaction_id") or airtel_response.get("internal_id")
    if not transaction_id:
        raise HTTPException(502, "Invalid response from Airtel. Please try again.")

    payment = Payment(
        booking_id=booking.id,
        amount=booking.total_price,
        method="airtel",
        status="pending",
        transaction_ref=transaction_id,
    )
    db.add(payment)
    db.commit()

    return {
        "checkout_request_id": transaction_id,
        "message": "Airtel Money prompt sent. Check your phone and enter your PIN.",
    }


@router.post("/airtel/callback")
async def airtel_callback(payload: dict, db: Session = Depends(get_db)):
    """Airtel Africa webhook — called after the user completes or cancels the USSD prompt."""
    try:
        txn = payload.get("transaction", {})
        transaction_id = txn.get("id")
        status_code = txn.get("status_code", "")
    except Exception:
        return {"status": "ok"}

    if not transaction_id:
        return {"status": "ok"}

    payment = (
        db.query(Payment)
        .filter(Payment.transaction_ref == transaction_id)
        .first()
    )
    if not payment:
        return {"status": "ok"}

    if status_code == "TS":  # Transaction Success
        payment.status = "completed"
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.status = "confirmed"
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
    elif status_code in ("TF", "TA", "TC"):  # Failed / Ambiguous / Cancelled
        payment.status = "failed"

    db.commit()
    return {"status": "ok"}


@router.post("/card/charge")
async def initiate_card(
    data: CardInitiate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initiate card payment via Flutterwave hosted checkout (no card data stored here)."""
    if not settings.FLUTTERWAVE_SECRET_KEY:
        raise HTTPException(503, "Card payments are not yet configured. Please use M-Pesa.")

    booking = (
        db.query(Booking)
        .filter(Booking.id == data.booking_id, Booking.user_id == user.id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status != "pending":
        raise HTTPException(400, f"Booking is already {booking.status}")

    existing = (
        db.query(Payment)
        .filter(Payment.booking_id == booking.id, Payment.status == "pending", Payment.method == "card")
        .first()
    )
    if existing:
        return {
            "checkout_request_id": existing.transaction_ref,
            "payment_link": existing.transaction_ref,
            "message": "Payment already initiated. Complete it using the link.",
        }

    tx_ref = f"afristay-{booking.id}-{uuid.uuid4().hex[:8]}"

    payload = {
        "tx_ref": tx_ref,
        "amount": float(booking.total_price),
        "currency": "KES",
        "redirect_url": f"{settings.FRONTEND_URL}/bookings?payment=success",
        "meta": {"booking_id": str(booking.id)},
        "customer": {
            "email": user.email,
            "name": user.name or user.email.split("@")[0],
        },
        "customizations": {
            "title": "AfriStay",
            "description": f"Booking: {booking.service.title if booking.service else 'Service'}",
            "logo": f"{settings.FRONTEND_URL}/logo.png",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.flutterwave.com/v3/payments",
                json=payload,
                headers={"Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"},
            )
            resp.raise_for_status()
            flw_data = resp.json()
    except Exception as e:
        logger.error("Flutterwave payment link creation failed: %s", e)
        raise HTTPException(502, "Failed to create card payment link. Please try M-Pesa.")

    payment_link = flw_data.get("data", {}).get("link")
    if not payment_link:
        raise HTTPException(502, "Invalid response from Flutterwave. Please try M-Pesa.")

    payment = Payment(
        booking_id=booking.id,
        amount=booking.total_price,
        method="card",
        status="pending",
        transaction_ref=tx_ref,
    )
    db.add(payment)
    db.commit()

    return {
        "checkout_request_id": tx_ref,
        "payment_link": payment_link,
        "message": "Redirecting to card payment. Complete payment on the next page.",
    }


@router.post("/flutterwave/callback")
async def flutterwave_callback(payload: dict, db: Session = Depends(get_db)):
    """Flutterwave webhook — called when card payment is completed."""
    if payload.get("event") != "charge.completed":
        return {"status": "ignored"}

    data = payload.get("data", {})
    tx_ref = data.get("tx_ref", "")
    flw_status = data.get("status", "")

    payment = db.query(Payment).filter(Payment.transaction_ref == tx_ref).first()
    if not payment:
        # Check activity booking
        activity_booking = db.query(ActivityBooking).filter(
            ActivityBooking.payment_reference == tx_ref
        ).first()
        if activity_booking:
            if flw_status == "successful":
                activity_booking.payment_status = "paid"
                activity_booking.status = "confirmed"
            else:
                activity_booking.payment_status = "failed"
                activity_booking.status = "cancelled"
            db.commit()
        return {"status": "ok"}

    if flw_status == "successful":
        payment.status = "completed"
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.status = "confirmed"
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
    return {"status": "ok"}


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
