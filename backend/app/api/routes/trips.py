import uuid as uuid_lib
import logging
from datetime import datetime, date as date_type, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel as PydanticBase
from typing import Optional
import httpx

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.all_models import Service, Trip, TripSegment, ActivityBooking, CartItem, Booking
from app.schemas.trip import TripGenerateRequest, TripSaveRequest
from app.services.daraja_service import daraja_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips", tags=["Trips"])


class ActivityBookingCreate(PydanticBase):
    activity_id: str
    activity_name: str
    activity_location: str
    destination: str
    date: date_type
    time: str
    participants: int = 1
    total_fee: float
    payment_method: str = "free"   # free | mpesa | card
    phone: Optional[str] = None    # required for mpesa

DESTINATION_ACTIVITIES = {
    "mombasa": [
        {"id": "fort_jesus", "name": "Fort Jesus", "category": "Heritage", "icon": "🏰",
         "description": "16th-century Portuguese fort, UNESCO World Heritage Site.",
         "address": "Nkrumah Rd, Old Town, Mombasa",
         "duration": "2–3 hrs", "opening_hours": "8:00 AM – 6:00 PM",
         "entrance_fee": 1200, "child_fee": 200,
         "available_times": ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"]},
        {"id": "haller_park", "name": "Haller Park", "category": "Wildlife", "icon": "🦒",
         "description": "Restored quarry turned wildlife sanctuary with giraffes, hippos and fish ponds.",
         "address": "Bamburi, Mombasa", "duration": "2–3 hrs", "opening_hours": "9:00 AM – 5:00 PM",
         "entrance_fee": 800, "child_fee": 400,
         "available_times": ["09:00","10:00","11:00","12:00","13:00","14:00"]},
        {"id": "mombasa_marine_park", "name": "Mombasa Marine National Park", "category": "Nature", "icon": "🤿",
         "description": "Snorkel Kenya's first marine park — coral reefs, dolphins, sea turtles.",
         "address": "Mombasa Lighthouse, Ras Serani", "duration": "3–4 hrs", "opening_hours": "7:00 AM – 6:00 PM",
         "entrance_fee": 2060, "child_fee": 1060,
         "available_times": ["07:00","08:00","09:00","10:00","11:00","12:00","14:00"]},
        {"id": "old_town_walk", "name": "Mombasa Old Town Walking Tour", "category": "Culture", "icon": "🕌",
         "description": "Explore Swahili architecture, spice markets and centuries-old mosques.",
         "address": "Old Town, Mombasa", "duration": "1–2 hrs", "opening_hours": "7:00 AM – 8:00 PM",
         "entrance_fee": 0, "child_fee": 0,
         "available_times": ["08:00","09:00","10:00","15:00","16:00","17:00"]},
        {"id": "diani_day_trip", "name": "Diani Beach Day Trip", "category": "Beach", "icon": "🏖️",
         "description": "World-class white sand beach 30 km south — swimming, kite-surfing, beach walks.",
         "address": "Diani Beach, Kwale County", "duration": "Full day", "opening_hours": "All day",
         "entrance_fee": 0, "child_fee": 0,
         "available_times": ["06:00","07:00","08:00","09:00"]},
    ],
    "nairobi": [
        {"id": "nairobi_national_park", "name": "Nairobi National Park", "category": "Wildlife", "icon": "🦁",
         "description": "The only national park inside a capital city — lions, rhinos, giraffes.",
         "address": "Nairobi National Park Gate, Langata", "duration": "3–5 hrs", "opening_hours": "6:00 AM – 6:00 PM",
         "entrance_fee": 4332, "child_fee": 2166,
         "available_times": ["06:00","07:00","08:00","09:00","10:00","11:00"]},
        {"id": "giraffe_centre", "name": "Giraffe Centre", "category": "Wildlife", "icon": "🦒",
         "description": "Hand-feed endangered Rothschild giraffes at Africa's leading giraffe conservation centre.",
         "address": "Hardy, Karen, Nairobi", "duration": "1–2 hrs", "opening_hours": "9:00 AM – 5:00 PM",
         "entrance_fee": 1700, "child_fee": 1100,
         "available_times": ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"]},
        {"id": "karen_blixen", "name": "Karen Blixen Museum", "category": "Heritage", "icon": "🏛️",
         "description": "The colonial farmhouse that inspired 'Out of Africa', set in 4.7 acres of gardens.",
         "address": "Karen Rd, Karen, Nairobi", "duration": "1–2 hrs", "opening_hours": "9:30 AM – 6:00 PM",
         "entrance_fee": 1500, "child_fee": 500,
         "available_times": ["09:30","10:00","11:00","12:00","13:00","14:00","15:00","16:00"]},
        {"id": "elephant_orphanage", "name": "David Sheldrick Elephant Orphanage", "category": "Wildlife", "icon": "🐘",
         "description": "Watch rescued baby elephants feed and mud-bathe — daily 11 AM public visit.",
         "address": "KWS HQ, Mbagathi Rd, Nairobi", "duration": "1 hr", "opening_hours": "11:00 AM – 12:00 PM",
         "entrance_fee": 1000, "child_fee": 500,
         "available_times": ["11:00"]},
        {"id": "bomas_of_kenya", "name": "Bomas of Kenya", "category": "Culture", "icon": "🥁",
         "description": "Live traditional dances and homesteads representing Kenya's 42+ communities.",
         "address": "Forest Edge Rd, Langata", "duration": "2–3 hrs", "opening_hours": "9:00 AM – 5:30 PM",
         "entrance_fee": 1200, "child_fee": 600,
         "available_times": ["14:30","15:30"]},
    ],
    "maasai mara": [
        {"id": "game_drive", "name": "Game Drive – Maasai Mara", "category": "Safari", "icon": "🚙",
         "description": "Morning or afternoon safari searching for the Big Five across the open savannah.",
         "address": "Maasai Mara National Reserve", "duration": "3–4 hrs", "opening_hours": "6:00 AM – 6:30 PM",
         "entrance_fee": 4500, "child_fee": 2250,
         "available_times": ["06:00","07:00","15:00","16:00"]},
        {"id": "balloon_safari", "name": "Hot Air Balloon Safari", "category": "Adventure", "icon": "🎈",
         "description": "Sunrise balloon flight over the Mara followed by a champagne bush breakfast.",
         "address": "Serena/Governor's Camp area", "duration": "4 hrs total", "opening_hours": "Sunrise only",
         "entrance_fee": 45000, "child_fee": 45000,
         "available_times": ["05:30","06:00"]},
        {"id": "maasai_village", "name": "Maasai Village Cultural Visit", "category": "Culture", "icon": "🏘️",
         "description": "Tour an authentic Maasai manyatta, watch dances and buy handmade beadwork.",
         "address": "Mara North Conservancy border", "duration": "1–2 hrs", "opening_hours": "8:00 AM – 5:00 PM",
         "entrance_fee": 3000, "child_fee": 1500,
         "available_times": ["08:00","09:00","10:00","14:00","15:00"]},
    ],
    "naivasha": [
        {"id": "hell_gate", "name": "Hell's Gate National Park", "category": "Adventure", "icon": "🏔️",
         "description": "Cycle or hike through dramatic gorges and geysers — inspiration for The Lion King.",
         "address": "Hell's Gate Rd, Naivasha", "duration": "3–5 hrs", "opening_hours": "6:00 AM – 6:00 PM",
         "entrance_fee": 2060, "child_fee": 1060,
         "available_times": ["06:00","07:00","08:00","09:00","10:00","14:00"]},
        {"id": "lake_naivasha_boat", "name": "Lake Naivasha Boat Ride", "category": "Nature", "icon": "🚣",
         "description": "Spot hippos, fish eagles and 400+ bird species across papyrus reed beds.",
         "address": "YMCA / Fisherman's Camp, Naivasha", "duration": "1–2 hrs", "opening_hours": "7:00 AM – 6:00 PM",
         "entrance_fee": 2500, "child_fee": 1200,
         "available_times": ["07:00","08:00","09:00","10:00","14:00","15:00","16:00"]},
        {"id": "crescent_island", "name": "Crescent Island Game Sanctuary", "category": "Wildlife", "icon": "🦓",
         "description": "Walk freely among zebras, giraffes and wildebeest on a floating island sanctuary.",
         "address": "Lake Naivasha, near Elsamere", "duration": "2 hrs", "opening_hours": "7:30 AM – 5:30 PM",
         "entrance_fee": 2500, "child_fee": 1500,
         "available_times": ["07:30","08:00","09:00","10:00","11:00","14:00","15:00"]},
    ],
    "amboseli": [
        {"id": "amboseli_game_drive", "name": "Amboseli Game Drive", "category": "Safari", "icon": "🐘",
         "description": "Africa's best elephant watching with Kilimanjaro as the stunning backdrop.",
         "address": "Amboseli National Park", "duration": "3–4 hrs", "opening_hours": "6:00 AM – 6:00 PM",
         "entrance_fee": 4332, "child_fee": 2166,
         "available_times": ["06:00","07:00","15:00","16:00"]},
        {"id": "observation_hill", "name": "Observation Hill", "category": "Scenic", "icon": "🌄",
         "description": "Panoramic views of the park, Mount Kilimanjaro and the swamps below.",
         "address": "Amboseli National Park", "duration": "1 hr", "opening_hours": "6:00 AM – 6:00 PM",
         "entrance_fee": 0, "child_fee": 0,
         "available_times": ["06:00","07:00","08:00","16:00","17:00"]},
    ],
    "kisumu": [
        {"id": "kit_mikayi", "name": "Kit Mikayi Rock", "category": "Heritage", "icon": "🪨",
         "description": "Sacred Luo cultural site — a massive balancing rock with ancient spiritual significance.",
         "address": "Seme, Kisumu County", "duration": "1–2 hrs", "opening_hours": "6:00 AM – 6:00 PM",
         "entrance_fee": 500, "child_fee": 200,
         "available_times": ["08:00","09:00","10:00","11:00","14:00","15:00"]},
        {"id": "kisumu_impala_park", "name": "Kisumu Impala Sanctuary", "category": "Wildlife", "icon": "🦌",
         "description": "Urban wildlife sanctuary with impalas, hippos and 100+ bird species on Lake Victoria's shore.",
         "address": "Hippo Rd, Kisumu", "duration": "1–2 hrs", "opening_hours": "8:00 AM – 5:30 PM",
         "entrance_fee": 600, "child_fee": 300,
         "available_times": ["08:00","09:00","10:00","11:00","13:00","14:00","15:00"]},
    ],
    "diani": [
        {"id": "diani_beach", "name": "Diani Beach", "category": "Beach", "icon": "🏖️",
         "description": "Award-winning white sand beach — snorkelling, kite-surfing, beach horse riding.",
         "address": "Diani Beach Rd, Kwale County", "duration": "Full day", "opening_hours": "All day",
         "entrance_fee": 0, "child_fee": 0,
         "available_times": ["06:00","07:00","08:00","09:00","10:00"]},
        {"id": "colobus_conservation", "name": "Colobus Conservation Centre", "category": "Wildlife", "icon": "🐒",
         "description": "Meet rare Angolan colobus monkeys and learn about coastal forest conservation.",
         "address": "Diani Beach Rd", "duration": "1–2 hrs", "opening_hours": "8:00 AM – 5:00 PM",
         "entrance_fee": 1000, "child_fee": 500,
         "available_times": ["08:00","09:00","10:00","11:00","13:00","14:00"]},
    ],
}

# Purpose → amenity/keyword hints for matching listings
PURPOSE_KEYWORDS = {
    "leisure": ["beach", "pool", "resort", "relax", "spa", "view"],
    "business": ["wifi", "conference", "business", "city", "corporate", "cbd"],
    "adventure": ["safari", "camp", "wildlife", "trek", "mountain", "game"],
    "event": ["venue", "hall", "event", "conference", "meeting"],
}


def _score_service(service: Service, keywords: list[str]) -> int:
    meta = service.service_metadata or {}
    text = " ".join([
        service.title or "",
        service.description or "",
        meta.get("location", ""),
        " ".join(meta.get("amenities", [])),
    ]).lower()
    return sum(1 for kw in keywords if kw in text)


def _serialize_suggestion(service: Service) -> dict:
    meta = service.service_metadata or {}
    return {
        "id": str(service.id),
        "title": service.title,
        "type": service.type,
        "location": meta.get("location", ""),
        "price": float(service.price_base or 0),
        "pricing_type": service.pricing_type,
        "images": meta.get("images", []),
        "amenities": meta.get("amenities", []),
        "rating": meta.get("rating", 4.5),
    }


@router.post("/generate")
def generate_trip(data: TripGenerateRequest, db: Session = Depends(get_db)):
    nights = max(1, (data.check_out - data.check_in).days)
    keywords = PURPOSE_KEYWORDS.get(data.purpose, [])
    dest = data.destination.lower()

    approved = db.query(Service).filter(Service.approval_status == "approved").all()

    # Filter by destination text match — strict, no fallback for accommodations
    dest_services = [
        s for s in approved
        if dest in (s.service_metadata or {}).get("location", "").lower()
        or dest in (s.title or "").lower()
        or dest in (s.description or "").lower()
    ]

    # Accommodations: strict destination match only
    accommodations = sorted(
        [s for s in dest_services if s.type == "accommodation"],
        key=lambda s: _score_service(s, keywords),
        reverse=True,
    )

    # Transport: prefer destination match, fall back to all approved transport
    dest_transport = [s for s in dest_services if s.type == "transport"]
    transport_pool = dest_transport if dest_transport else [s for s in approved if s.type == "transport"]
    transports = sorted(
        transport_pool,
        key=lambda s: _score_service(s, keywords),
        reverse=True,
    )

    # Apply budget filter if provided
    if data.max_budget:
        nightly_budget = data.max_budget / nights
        accommodations = [s for s in accommodations if float(s.price_base or 0) <= nightly_budget]

    top_accommodation = accommodations[:3]
    top_transport = transports[:2]

    # Along-route suggestions: services whose location matches origin (max 6)
    along_route = []
    if data.origin:
        origin_lower = data.origin.lower()
        along_route = sorted(
            [
                s for s in approved
                if origin_lower in (s.service_metadata or {}).get("location", "").lower()
                or origin_lower in (s.title or "").lower()
            ],
            key=lambda s: _score_service(s, keywords),
            reverse=True,
        )[:6]

    # Build day-by-day itinerary
    itinerary = []
    for i in range(nights):
        day_date = data.check_in.isoformat() if i == 0 else f"Day {i + 1}"
        day = {"day": i + 1, "date": day_date, "activities": []}

        if i == 0 and top_transport:
            t = top_transport[0]
            day["activities"].append({
                "time": "09:00",
                "type": "transport",
                "description": f"Travel to {data.destination}",
                "service": _serialize_suggestion(t),
            })

        if top_accommodation:
            a = top_accommodation[0]
            day["activities"].append({
                "time": "14:00",
                "type": "check_in",
                "description": f"Check in at {a.title}",
                "service": _serialize_suggestion(a),
            })

        itinerary.append(day)

    estimated_cost = 0
    if top_accommodation:
        estimated_cost += float(top_accommodation[0].price_base or 0) * nights * data.group_size
    if top_transport:
        estimated_cost += float(top_transport[0].price_base or 0)

    return {
        "destination": data.destination,
        "origin": data.origin,
        "purpose": data.purpose,
        "check_in": data.check_in.isoformat(),
        "check_out": data.check_out.isoformat(),
        "nights": nights,
        "group_size": data.group_size,
        "estimated_cost": round(estimated_cost, 2),
        "itinerary": itinerary,
        "recommended_accommodation": [_serialize_suggestion(s) for s in top_accommodation],
        "recommended_transport": [_serialize_suggestion(s) for s in top_transport],
        "along_route_suggestions": [_serialize_suggestion(s) for s in along_route],
    }


@router.get("/suggestions")
def get_suggestions(destination: str = "", db: Session = Depends(get_db)):
    """Return top-rated approved listings for a destination."""
    query = db.query(Service).filter(Service.approval_status == "approved")
    if destination:
        dest = destination.lower()
        services = [
            s for s in query.all()
            if dest in (s.service_metadata or {}).get("location", "").lower()
            or dest in (s.title or "").lower()
        ]
    else:
        services = query.limit(20).all()

    return [_serialize_suggestion(s) for s in services[:20]]


@router.post("/save")
def save_trip(data: TripSaveRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    trip = Trip(
        user_id=user.id,
        status="planned",
        destination=data.destination,
        purpose=data.purpose,
        check_in=data.check_in,
        check_out=data.check_out,
    )
    db.add(trip)
    db.flush()

    segments = []
    order = 0

    if data.transport_id:
        transport = db.query(Service).filter(Service.id == data.transport_id).first()
        if transport:
            seg = TripSegment(
                trip_id=trip.id,
                origin="Origin",
                destination=data.destination,
                departure_time=datetime.combine(data.check_in, datetime.min.time()),
                arrival_time=datetime.combine(data.check_in, datetime.min.time()),
                service_id=transport.id,
                order_index=order,
            )
            db.add(seg)
            segments.append(seg)
            order += 1

    if data.accommodation_id:
        accom = db.query(Service).filter(Service.id == data.accommodation_id).first()
        if accom:
            seg = TripSegment(
                trip_id=trip.id,
                origin=data.destination,
                destination=data.destination,
                departure_time=datetime.combine(data.check_in, datetime.min.time()),
                arrival_time=datetime.combine(data.check_out, datetime.min.time()),
                service_id=accom.id,
                order_index=order,
            )
            db.add(seg)
            segments.append(seg)

    db.commit()
    db.refresh(trip)

    return {
        "id": str(trip.id),
        "destination": data.destination,
        "purpose": data.purpose,
        "check_in": data.check_in.isoformat(),
        "check_out": data.check_out.isoformat(),
        "status": trip.status,
        "segments": len(segments),
        "message": "Trip saved to your account",
    }


@router.get("/activities")
def get_activities(destination: str = ""):
    """Return hardcoded activity suggestions for a destination (fuzzy match)."""
    dest = destination.lower().strip()
    for key, acts in DESTINATION_ACTIVITIES.items():
        if key in dest or dest in key:
            return acts
    return []


@router.post("/activity-bookings")
async def book_activity(data: ActivityBookingCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    is_free = float(data.total_fee) == 0 or data.payment_method == "free"

    booking = ActivityBooking(
        user_id=user.id,
        activity_id=data.activity_id,
        activity_name=data.activity_name,
        activity_location=data.activity_location,
        destination=data.destination,
        date=data.date,
        time=data.time,
        participants=data.participants,
        total_fee=data.total_fee,
        status="confirmed" if is_free else "pending_payment",
        payment_status="free" if is_free else "pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    if is_free:
        return {"id": str(booking.id), "status": "confirmed", "payment_status": "free"}

    # ── Defer (add to cart, pay later) ──
    if data.payment_method == "defer":
        return {"id": str(booking.id), "status": "pending_payment", "payment_status": "pending"}

    # ── M-Pesa ──
    if data.payment_method == "mpesa":
        if not data.phone:
            raise HTTPException(400, "Phone number required for M-Pesa payment")
        try:
            daraja_resp = await daraja_service.stk_push(
                phone=data.phone,
                amount=float(data.total_fee),
                booking_id=str(booking.id),
            )
        except Exception as e:
            logger.error("Activity M-Pesa STK push failed: %s", e)
            raise HTTPException(502, "Failed to initiate M-Pesa payment. Please try again.")
        checkout_request_id = daraja_resp.get("CheckoutRequestID")
        if not checkout_request_id:
            raise HTTPException(502, "Invalid M-Pesa response. Please try again.")
        booking.payment_reference = checkout_request_id
        db.commit()
        return {
            "id": str(booking.id),
            "status": "pending_payment",
            "payment_status": "pending",
            "checkout_request_id": checkout_request_id,
            "message": "M-Pesa prompt sent. Check your phone and enter your PIN.",
        }

    # ── Card (Flutterwave) ──
    if data.payment_method == "card":
        if not settings.FLUTTERWAVE_SECRET_KEY:
            raise HTTPException(503, "Card payments are not configured. Please use M-Pesa.")
        tx_ref = f"afristay-act-{booking.id}-{uuid_lib.uuid4().hex[:8]}"
        flw_payload = {
            "tx_ref": tx_ref,
            "amount": float(data.total_fee),
            "currency": "KES",
            "redirect_url": f"{settings.FRONTEND_URL}/bookings?payment=success",
            "meta": {"activity_booking_id": str(booking.id)},
            "customer": {"email": user.email, "name": user.name or user.email.split("@")[0]},
            "customizations": {
                "title": "AfriStay Activities",
                "description": data.activity_name,
            },
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.flutterwave.com/v3/payments",
                    json=flw_payload,
                    headers={"Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"},
                )
                resp.raise_for_status()
                flw_data = resp.json()
        except Exception as e:
            logger.error("Flutterwave activity payment link failed: %s", e)
            raise HTTPException(502, "Failed to create card payment link. Please try M-Pesa.")
        payment_link = flw_data.get("data", {}).get("link")
        if not payment_link:
            raise HTTPException(502, "Invalid Flutterwave response.")
        booking.payment_reference = tx_ref
        db.commit()
        return {
            "id": str(booking.id),
            "status": "pending_payment",
            "payment_status": "pending",
            "payment_link": payment_link,
            "message": "Complete your payment on the checkout page.",
        }

    raise HTTPException(400, f"Unknown payment method: {data.payment_method}")


@router.get("/activity-bookings/{booking_id}/payment-status")
def get_activity_payment_status(booking_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(ActivityBooking).filter(
        ActivityBooking.id == booking_id,
        ActivityBooking.user_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    return {"id": str(booking.id), "status": booking.status, "payment_status": booking.payment_status}


class ActivityPaymentRequest(PydanticBase):
    method: str          # mpesa | card
    phone: Optional[str] = None


@router.post("/activity-bookings/{booking_id}/pay")
async def retry_activity_payment(
    booking_id: str,
    data: ActivityPaymentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(ActivityBooking).filter(
        ActivityBooking.id == booking_id,
        ActivityBooking.user_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status != "pending_payment":
        raise HTTPException(400, "Booking is not awaiting payment")

    if data.method == "mpesa":
        if not data.phone:
            raise HTTPException(400, "Phone number required for M-Pesa")
        try:
            daraja_resp = await daraja_service.stk_push(
                phone=data.phone, amount=float(booking.total_fee), booking_id=str(booking.id)
            )
        except Exception as e:
            logger.error("Activity M-Pesa retry failed: %s", e)
            raise HTTPException(502, "Failed to initiate M-Pesa payment. Please try again.")
        checkout_request_id = daraja_resp.get("CheckoutRequestID")
        if not checkout_request_id:
            raise HTTPException(502, "Invalid M-Pesa response")
        booking.payment_reference = checkout_request_id
        db.commit()
        return {"checkout_request_id": checkout_request_id, "message": "M-Pesa prompt sent to your phone."}

    if data.method == "card":
        if not settings.FLUTTERWAVE_SECRET_KEY:
            raise HTTPException(503, "Card payments are not configured. Please use M-Pesa.")
        tx_ref = f"afristay-act-{booking.id}-{uuid_lib.uuid4().hex[:8]}"
        flw_payload = {
            "tx_ref": tx_ref, "amount": float(booking.total_fee), "currency": "KES",
            "redirect_url": f"{settings.FRONTEND_URL}/cart?payment=success",
            "meta": {"activity_booking_id": str(booking.id)},
            "customer": {"email": user.email, "name": user.name or user.email.split("@")[0]},
            "customizations": {"title": "AfriStay Activities", "description": booking.activity_name},
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.flutterwave.com/v3/payments", json=flw_payload,
                    headers={"Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"},
                )
                resp.raise_for_status()
                flw_data = resp.json()
        except Exception as e:
            raise HTTPException(502, "Failed to create card payment link. Please try M-Pesa.")
        payment_link = flw_data.get("data", {}).get("link")
        if not payment_link:
            raise HTTPException(502, "Invalid Flutterwave response")
        booking.payment_reference = tx_ref
        db.commit()
        return {"payment_link": payment_link, "message": "Complete payment on the checkout page."}

    raise HTTPException(400, f"Unknown payment method: {data.method}")


@router.delete("/activity-bookings/{booking_id}")
def cancel_activity_booking(booking_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(ActivityBooking).filter(
        ActivityBooking.id == booking_id,
        ActivityBooking.user_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(400, "Booking is already cancelled")
    booking.status = "cancelled"
    db.commit()
    return {"message": "Booking cancelled", "id": str(booking.id)}


class ActivityBookingUpdate(PydanticBase):
    date: Optional[date_type] = None
    time: Optional[str] = None
    participants: Optional[int] = None
    total_fee: Optional[float] = None


@router.patch("/activity-bookings/{booking_id}")
def update_activity_booking(
    booking_id: str,
    data: ActivityBookingUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(ActivityBooking).filter(
        ActivityBooking.id == booking_id,
        ActivityBooking.user_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(400, "Cannot edit a cancelled booking")
    if data.date is not None:
        booking.date = data.date
    if data.time is not None:
        booking.time = data.time
    if data.participants is not None:
        booking.participants = data.participants
    if data.total_fee is not None:
        booking.total_fee = data.total_fee
    db.commit()
    db.refresh(booking)
    return {
        "id": str(booking.id),
        "date": booking.date.isoformat(),
        "time": booking.time,
        "participants": booking.participants,
        "total_fee": float(booking.total_fee),
        "status": booking.status,
    }


@router.delete("/{trip_id}")
def delete_trip(trip_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(404, "Trip not found")
    # Cancel all matching activity bookings
    if trip.check_in and trip.check_out:
        trip_dest = (trip.destination or "").lower().strip()
        acts = db.query(ActivityBooking).filter(
            ActivityBooking.user_id == user.id,
            ActivityBooking.status != "cancelled",
            ActivityBooking.date >= trip.check_in,
            ActivityBooking.date <= trip.check_out,
        ).all()
        for ab in acts:
            dest = ab.destination.lower()
            if trip_dest in dest or dest in trip_dest:
                ab.status = "cancelled"
    # Delete trip segments and trip
    for seg in trip.segments:
        db.delete(seg)
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted", "id": trip_id}


@router.get("/activity-bookings")
def get_activity_bookings(user=Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = (
        db.query(ActivityBooking)
        .filter(ActivityBooking.user_id == user.id)
        .order_by(ActivityBooking.date.asc())
        .all()
    )
    return [
        {
            "id": str(b.id),
            "activity_id": b.activity_id,
            "activity_name": b.activity_name,
            "activity_location": b.activity_location,
            "destination": b.destination,
            "date": b.date.isoformat(),
            "time": b.time,
            "participants": b.participants,
            "total_fee": float(b.total_fee),
            "status": b.status,
            "payment_status": b.payment_status,
            "created_at": b.created_at.isoformat(),
        }
        for b in bookings
    ]


@router.get("/saved")
def get_saved_trips(user=Depends(get_current_user), db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.user_id == user.id).order_by(Trip.created_at.desc()).all()

    # Fetch all non-cancelled activity bookings for this user once
    all_activities = (
        db.query(ActivityBooking)
        .filter(ActivityBooking.user_id == user.id, ActivityBooking.status != "cancelled")
        .all()
    )

    result = []
    for t in trips:
        nights = (t.check_out - t.check_in).days if t.check_in and t.check_out else 0
        trip_dest = (t.destination or "").lower().strip()

        # Match activity bookings to this trip by destination + date range
        def _in_trip(ab):
            if not t.check_in or not t.check_out:
                return False
            dest_ok = trip_dest in ab.destination.lower() or ab.destination.lower() in trip_dest
            date_ok = t.check_in <= ab.date <= t.check_out
            return dest_ok and date_ok

        trip_activities = [ab for ab in all_activities if _in_trip(ab)]

        # Build day-by-day structure
        days = []
        for i in range(max(nights, 1)):
            day_date = (t.check_in + timedelta(days=i)) if t.check_in else None
            day_date_str = day_date.isoformat() if day_date else None

            # Segments whose departure date falls on this day
            seg_events = []
            for seg in sorted(t.segments, key=lambda s: s.order_index):
                if seg.departure_time and seg.departure_time.date().isoformat() == day_date_str:
                    svc_info = None
                    if seg.service_id:
                        svc = db.query(Service).filter(Service.id == seg.service_id).first()
                        if svc:
                            meta = svc.service_metadata or {}
                            svc_info = {
                                "id": str(svc.id),
                                "title": svc.title,
                                "type": svc.type,
                                "location": meta.get("location", ""),
                            }
                    seg_events.append({
                        "time": seg.departure_time.strftime("%H:%M"),
                        "type": svc_info["type"] if svc_info else "segment",
                        "origin": seg.origin,
                        "destination": seg.destination,
                        "service": svc_info,
                    })

            # Activity bookings for this day
            day_act = [
                ab for ab in trip_activities
                if ab.date.isoformat() == day_date_str
            ]
            day_act_list = [
                {
                    "id": str(ab.id),
                    "activity_name": ab.activity_name,
                    "activity_location": ab.activity_location,
                    "time": ab.time,
                    "participants": ab.participants,
                    "total_fee": float(ab.total_fee),
                    "status": ab.status,
                    "payment_status": ab.payment_status,
                }
                for ab in sorted(day_act, key=lambda a: a.time)
            ]

            days.append({
                "day": i + 1,
                "date": day_date_str,
                "segments": seg_events,
                "activities": day_act_list,
            })

        result.append({
            "id": str(t.id),
            "destination": t.destination,
            "purpose": t.purpose,
            "check_in": t.check_in.isoformat() if t.check_in else None,
            "check_out": t.check_out.isoformat() if t.check_out else None,
            "nights": nights,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "days": days,
        })

    return result
