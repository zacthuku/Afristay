import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.all_models import User, Service, Accommodation
from app.core.security import hash_password


def seed_data(db: Session):
    # جلوگیری از دوباره‌کاری
    if db.query(Service).first():
        print("Data already seeded")
        return

    # =====================
    # ADMIN USER
    # =====================
    admin = User(
        email="admin@afristay.co.ke",
        password_hash=hash_password("Afistay@1"),
        role="admin",
        is_verified=True
    )

    db.add(admin)
    db.commit()

    # =====================
    # USERS (HOSTS)
    # =====================
    host1 = User(
        email="host1@afristay.com",
        password_hash=hash_password("password"),
        role="host",
        is_verified=True
    )

    host2 = User(
        email="host2@afristay.com",
        password_hash=hash_password("password"),
        role="host",
        is_verified=True
    )

    db.add_all([host1, host2])
    db.commit()

    # =====================
    # SERVICES
    # =====================
    services = [
        {
            "title": "Maasai Mara Safari Lodge",
            "description": "Luxury safari lodge with amazing savannah views.",
            "location": (-1.4061, 35.0400),
            "price": 120,
            "host": host1,
            "metadata": {
                "location": "Maasai Mara, Kenya",
                "images": [
                    "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
                    "https://images.unsplash.com/photo-1519821172141-b5d8d0f6c3f5",
                ],
                "amenities": ["WiFi", "Pool", "Game Drives"],
                "rating": 4.8,
                "reviews": 120,
                "superhost": True,
                "host_avatar": "https://randomuser.me/api/portraits/men/32.jpg"
            }
        },
        {
            "title": "Diani Beach Oceanfront Villa",
            "description": "Beachfront villa with ocean views.",
            "location": (-4.2840, 39.5940),
            "price": 150,
            "host": host2,
            "metadata": {
                "location": "Diani Beach, Kenya",
                "images": [
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
                    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
                ],
                "amenities": ["Beachfront", "WiFi", "Private Pool"],
                "rating": 4.7,
                "reviews": 98,
                "superhost": True,
                "host_avatar": "https://randomuser.me/api/portraits/women/44.jpg"
            }
        },
        {
            "title": "Nairobi Central Apartment",
            "description": "Modern apartment in Nairobi.",
            "location": (-1.286389, 36.817223),
            "price": 60,
            "host": host1,
            "metadata": {
                "location": "Nairobi, Kenya",
                "images": [
                    "https://images.unsplash.com/photo-1493809842364-78817add7ffb"
                ],
                "amenities": ["WiFi", "Kitchen"],
                "rating": 4.5,
                "reviews": 60,
                "superhost": False,
                "host_avatar": "https://randomuser.me/api/portraits/men/65.jpg"
            }
        }
    ]

    for item in services:
        service = Service(
            host_id=item["host"].id,
            type="accommodation",
            title=item["title"],
            description=item["description"],
            location=None,  # Will set location later if needed
            price_base=item["price"],
            pricing_type="per_night",
            service_metadata=item["metadata"]
        )

        db.add(service)
        db.flush()

        accommodation = Accommodation(
            service_id=service.id,
            rooms=3,
            amenities=item["metadata"]["amenities"],
            check_in_time=datetime.utcnow(),
            check_out_time=datetime.utcnow()
        )

        db.add(accommodation)

    db.commit()
    print("✅ Seed complete")