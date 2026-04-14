import uuid
from datetime import datetime

from sqlalchemy import (
    String, Integer, Boolean, DateTime, ForeignKey,
    CheckConstraint, Numeric, Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column

from geoalchemy2 import Geography

from app.db.base import Base


# =========================
# USERS
# =========================
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    phone: Mapped[str] = mapped_column(String, unique=True, nullable=True)

    password_hash: Mapped[str] = mapped_column(String, nullable=True)
    google_id: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    auth_provider: Mapped[str] = mapped_column(String, default="email")

    role: Mapped[str] = mapped_column(String, default="guest")
    host_application_status: Mapped[str] = mapped_column(String, default="none")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    services = relationship("Service", back_populates="host")
    trips = relationship("Trip", back_populates="user")
    bookings = relationship("Booking", back_populates="user")
    reviews = relationship("Review", back_populates="user")


# =========================
# SERVICES (CORE)
# =========================
class Service(Base):
    __tablename__ = "services"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    host_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    type: Mapped[str] = mapped_column(String, nullable=False)  # accommodation | transport

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text)

    location = mapped_column(Geography("POINT", srid=4326))

    price_base: Mapped[float] = mapped_column(Numeric)
    pricing_type: Mapped[str] = mapped_column(String)

    service_metadata: Mapped[dict] = mapped_column(JSONB)
    approval_status: Mapped[str] = mapped_column(String, default="pending")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("type IN ('accommodation','transport')"),
        CheckConstraint("pricing_type IN ('per_night','per_hour','fixed','per_km')"),
        CheckConstraint("approval_status IN ('pending','approved','rejected')"),
    )

    # Relationships
    host = relationship("User", back_populates="services")
    accommodation = relationship("Accommodation", back_populates="service", uselist=False)
    transport = relationship("Transport", back_populates="service", uselist=False)

    availability = relationship("Availability", back_populates="service")
    bookings = relationship("Booking", back_populates="service")
    reviews = relationship("Review", back_populates="service")


# =========================
# ACCOMMODATION
# =========================
class Accommodation(Base):
    __tablename__ = "accommodations"

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True
    )

    rooms: Mapped[int] = mapped_column(Integer)
    amenities: Mapped[dict] = mapped_column(JSONB)

    check_in_time: Mapped[datetime] = mapped_column(DateTime)
    check_out_time: Mapped[datetime] = mapped_column(DateTime)

    service = relationship("Service", back_populates="accommodation")


# =========================
# TRANSPORT
# =========================
class Transport(Base):
    __tablename__ = "transport"

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True
    )

    vehicle_type: Mapped[str] = mapped_column(String)
    capacity: Mapped[int] = mapped_column(Integer)

    pickup_location = mapped_column(Geography("POINT", srid=4326))
    dropoff_location = mapped_column(Geography("POINT", srid=4326))

    route: Mapped[dict] = mapped_column(JSONB, nullable=True)

    price_per_km: Mapped[float] = mapped_column(Numeric, nullable=True)
    fixed_price: Mapped[float] = mapped_column(Numeric, nullable=True)

    service = relationship("Service", back_populates="transport")


# =========================
# AVAILABILITY
# =========================
class Availability(Base):
    __tablename__ = "availability"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE")
    )

    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime] = mapped_column(DateTime)

    is_available: Mapped[bool] = mapped_column(default=True)

    service = relationship("Service", back_populates="availability")


# =========================
# TRIPS (ITINERARY)
# =========================
class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE")
    )

    status: Mapped[str] = mapped_column(String, default="planned")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("status IN ('planned','booked','cancelled')"),
    )

    user = relationship("User", back_populates="trips")
    segments = relationship("TripSegment", back_populates="trip")
    bookings = relationship("Booking", back_populates="trip")


# =========================
# TRIP SEGMENTS (MULTI-LEG)
# =========================
class TripSegment(Base):
    __tablename__ = "trip_segments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trips.id", ondelete="CASCADE")
    )

    origin: Mapped[str] = mapped_column(String)
    destination: Mapped[str] = mapped_column(String)

    departure_time: Mapped[datetime] = mapped_column(DateTime)
    arrival_time: Mapped[datetime] = mapped_column(DateTime)

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id"),
        nullable=True
    )

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id"),
        nullable=True
    )

    order_index: Mapped[int] = mapped_column(Integer)

    trip = relationship("Trip", back_populates="segments")


# =========================
# BOOKINGS
# =========================
class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE")
    )

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id")
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trips.id"),
        nullable=True
    )

    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime] = mapped_column(DateTime)

    quantity: Mapped[int] = mapped_column(Integer, default=1)

    status: Mapped[str] = mapped_column(String, default="pending")

    total_price: Mapped[float] = mapped_column(Numeric)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("status IN ('pending','confirmed','cancelled')"),
    )

    user = relationship("User", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    trip = relationship("Trip", back_populates="bookings")


# =========================
# PAYMENTS
# =========================
class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE")
    )

    amount: Mapped[float] = mapped_column(Numeric)

    method: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")

    transaction_ref: Mapped[str] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("method IN ('mpesa','airtel','card')"),
        CheckConstraint("status IN ('pending','completed','failed')"),
    )


# =========================
# REVIEWS
# =========================
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE")
    )

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE")
    )

    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5"),
    )

    user = relationship("User", back_populates="reviews")
    service = relationship("Service", back_populates="reviews")