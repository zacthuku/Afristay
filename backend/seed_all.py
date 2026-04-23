#!/usr/bin/env python3
"""
Comprehensive seed script for AfriStay.
Populates all tables with realistic African tourism data using Faker.
Run from backend/: python seed_all.py
"""
import sys
import uuid
import random
from datetime import datetime, timedelta, date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from faker import Faker
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.config import settings
from app.core.security import hash_password
from app.models.all_models import (
    User, Service, Accommodation, Transport, Availability,
    Booking, Payment, Review, CartItem, JobOpening,
    Country, ServiceCategory, Destination, ServiceType, RejectionReason,
)

fake = Faker()
Faker.seed(42)
random.seed(42)

db_url = str(settings.DATABASE_URL).replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(db_url, echo=False)
Session = sessionmaker(bind=engine)
db = Session()


# ─── helpers ─────────────────────────────────────────────────────────────────

def geo(lat, lng):
    return from_shape(Point(lng, lat), srid=4326)


def future_dt(days_from_now=0, offset_days=1):
    base = datetime.utcnow() + timedelta(days=days_from_now)
    return base.replace(hour=random.randint(8, 18), minute=0, second=0, microsecond=0)


# African city coords (lat, lng, city, country_code)
AFRICAN_CITIES = [
    (-1.286389, 36.817223, "Nairobi", "KE"),
    (-4.043477, 39.668206, "Mombasa", "KE"),
    (0.514277, 35.269780, "Eldoret", "KE"),
    (-3.386925, 36.682995, "Arusha", "TZ"),
    (-6.792354, 39.208328, "Zanzibar", "TZ"),
    (-6.162959, 35.739994, "Dodoma", "TZ"),
    (0.347596, 32.582520, "Kampala", "UG"),
    (0.671120, 30.279636, "Murchison", "UG"),
    (-1.940278, 29.873888, "Kigali", "RW"),
    (-2.000000, 29.916667, "Musanze", "RW"),
    (9.005401, 38.763611, "Addis Ababa", "ET"),
    (11.591592, 37.391975, "Gondar", "ET"),
    (6.524379, 3.379206, "Lagos", "NG"),
    (9.057850, 7.495760, "Abuja", "NG"),
    (5.614818, -0.205874, "Accra", "GH"),
    (-33.924870, 18.424055, "Cape Town", "ZA"),
    (-26.195246, 28.034088, "Johannesburg", "ZA"),
    (31.235712, 29.965782, "Alexandria", "EG"),
    (30.044420, 31.235712, "Cairo", "EG"),
    (33.886917, -5.554250, "Fes", "MA"),
    (31.629472, -7.981084, "Marrakech", "MA"),
    (13.512440, 2.112220, "Niamey", "NE"),
    (-13.961500, 33.787067, "Lilongwe", "MW"),
    (-15.416198, 28.283329, "Lusaka", "ZM"),
]


# ─── 1. Countries ────────────────────────────────────────────────────────────

COUNTRIES = [
    {"code": "KE", "name": "Kenya",        "flag": "🇰🇪", "currency_code": "KES", "currency_symbol": "KSh",
     "payment_methods": ["mpesa", "card"]},
    {"code": "TZ", "name": "Tanzania",     "flag": "🇹🇿", "currency_code": "TZS", "currency_symbol": "TSh",
     "payment_methods": ["mpesa", "card"]},
    {"code": "UG", "name": "Uganda",       "flag": "🇺🇬", "currency_code": "UGX", "currency_symbol": "USh",
     "payment_methods": ["mpesa", "card"]},
    {"code": "RW", "name": "Rwanda",       "flag": "🇷🇼", "currency_code": "RWF", "currency_symbol": "Fr",
     "payment_methods": ["card"]},
    {"code": "ET", "name": "Ethiopia",     "flag": "🇪🇹", "currency_code": "ETB", "currency_symbol": "Br",
     "payment_methods": ["card"]},
    {"code": "NG", "name": "Nigeria",      "flag": "🇳🇬", "currency_code": "NGN", "currency_symbol": "₦",
     "payment_methods": ["card"]},
    {"code": "GH", "name": "Ghana",        "flag": "🇬🇭", "currency_code": "GHS", "currency_symbol": "GH₵",
     "payment_methods": ["card"]},
    {"code": "ZA", "name": "South Africa", "flag": "🇿🇦", "currency_code": "ZAR", "currency_symbol": "R",
     "payment_methods": ["card"]},
    {"code": "EG", "name": "Egypt",        "flag": "🇪🇬", "currency_code": "EGP", "currency_symbol": "E£",
     "payment_methods": ["card"]},
    {"code": "MA", "name": "Morocco",      "flag": "🇲🇦", "currency_code": "MAD", "currency_symbol": "د.م.",
     "payment_methods": ["card"]},
]

for c in COUNTRIES:
    db.add(Country(**c))
db.commit()
print(f"✅ Countries: {len(COUNTRIES)}")


# ─── 2. Destinations ─────────────────────────────────────────────────────────

DESTINATIONS = [
    {"name": "Nairobi",       "slug": "nairobi",        "subtitle": "The Green City in the Sun",           "country_code": "KE"},
    {"name": "Mombasa",       "slug": "mombasa",        "subtitle": "Coastal Paradise",                    "country_code": "KE"},
    {"name": "Maasai Mara",   "slug": "maasai-mara",    "subtitle": "Wildlife Safari Capital",             "country_code": "KE"},
    {"name": "Zanzibar",      "slug": "zanzibar",        "subtitle": "Spice Island Escape",                 "country_code": "TZ"},
    {"name": "Serengeti",     "slug": "serengeti",       "subtitle": "Endless Plains & Big Five",          "country_code": "TZ"},
    {"name": "Kigali",        "slug": "kigali",          "subtitle": "The Cleanest City in Africa",        "country_code": "RW"},
    {"name": "Bwindi",        "slug": "bwindi",          "subtitle": "Mountain Gorilla Trekking",          "country_code": "UG"},
    {"name": "Cape Town",     "slug": "cape-town",       "subtitle": "Mother City at the World's Edge",    "country_code": "ZA"},
    {"name": "Cairo",         "slug": "cairo",           "subtitle": "Pyramids & Pharaohs",                "country_code": "EG"},
    {"name": "Marrakech",     "slug": "marrakech",       "subtitle": "Imperial City of Morocco",           "country_code": "MA"},
    {"name": "Addis Ababa",   "slug": "addis-ababa",     "subtitle": "Cradle of African Diplomacy",        "country_code": "ET"},
    {"name": "Accra",         "slug": "accra",           "subtitle": "Gateway to West Africa",             "country_code": "GH"},
    {"name": "Lagos",         "slug": "lagos",           "subtitle": "Africa's Megacity",                  "country_code": "NG"},
    {"name": "Victoria Falls", "slug": "victoria-falls", "subtitle": "The Smoke That Thunders",            "country_code": "ZM"},
    {"name": "Amboseli",      "slug": "amboseli",        "subtitle": "Elephants Under Kilimanjaro",        "country_code": "KE"},
]

for i, d in enumerate(DESTINATIONS):
    db.add(Destination(display_order=i, is_featured=True, **d))
db.commit()
print(f"✅ Destinations: {len(DESTINATIONS)}")


# ─── 3. Service Types (config) ───────────────────────────────────────────────

SERVICE_TYPES_CONFIG = [
    {"slug": "hotel",       "label": "Hotel",            "icon": "🏨", "category": "accommodation", "pricing_types": ["per_night"],           "display_order": 1},
    {"slug": "hostel",      "label": "Hostel",           "icon": "🛏️", "category": "accommodation", "pricing_types": ["per_night"],           "display_order": 2},
    {"slug": "airbnb",      "label": "Vacation Rental",  "icon": "🏠", "category": "accommodation", "pricing_types": ["per_night"],           "display_order": 3},
    {"slug": "lodge",       "label": "Safari Lodge",     "icon": "🌿", "category": "accommodation", "pricing_types": ["per_night"],           "display_order": 4},
    {"slug": "car-hire",    "label": "Car Hire",         "icon": "🚗", "category": "transport",     "pricing_types": ["per_day", "per_km"],   "display_order": 5},
    {"slug": "shuttle",     "label": "Shuttle",          "icon": "🚐", "category": "transport",     "pricing_types": ["fixed", "per_person"], "display_order": 6},
    {"slug": "safari-jeep", "label": "Safari Jeep",      "icon": "🦁", "category": "transport",     "pricing_types": ["per_day"],             "display_order": 7},
    {"slug": "national-park","label": "National Park",   "icon": "🦏", "category": "attraction",    "pricing_types": ["per_entry"],           "display_order": 8},
    {"slug": "museum",      "label": "Museum",           "icon": "🏛️", "category": "attraction",    "pricing_types": ["per_entry"],           "display_order": 9},
    {"slug": "restaurant",  "label": "Restaurant",       "icon": "🍽️", "category": "restaurant",    "pricing_types": ["per_person"],          "display_order": 10},
    {"slug": "tour-guide",  "label": "Guided Tour",      "icon": "🗺️", "category": "tour",          "pricing_types": ["per_person", "fixed"], "display_order": 11},
    {"slug": "hiking",      "label": "Hiking & Trekking","icon": "🥾", "category": "adventure",     "pricing_types": ["per_person"],          "display_order": 12},
    {"slug": "diving",      "label": "Scuba Diving",     "icon": "🤿", "category": "adventure",     "pricing_types": ["per_person"],          "display_order": 13},
    {"slug": "spa",         "label": "Spa & Wellness",   "icon": "💆", "category": "wellness",      "pricing_types": ["per_person", "per_hour"], "display_order": 14},
    {"slug": "cruise",      "label": "Boat Cruise",      "icon": "⛵", "category": "cruise",        "pricing_types": ["per_person", "fixed"], "display_order": 15},
]

for st in SERVICE_TYPES_CONFIG:
    db.add(ServiceType(**st))
db.commit()
print(f"✅ Service types: {len(SERVICE_TYPES_CONFIG)}")


# ─── 4. Service Categories ───────────────────────────────────────────────────

CATEGORIES = [
    {"slug": "stays",        "name": "Stays",         "icon": "🏨", "category_type": "accommodation", "display_bg": "bg-blue-50",   "display_border": "border-blue-200",  "display_text": "text-blue-700",  "display_order": 1},
    {"slug": "transport",    "name": "Transport",     "icon": "🚗", "category_type": "transport",     "display_bg": "bg-amber-50",  "display_border": "border-amber-200", "display_text": "text-amber-700", "display_order": 2},
    {"slug": "attractions",  "name": "Attractions",   "icon": "🦁", "category_type": "attraction",    "display_bg": "bg-green-50",  "display_border": "border-green-200", "display_text": "text-green-700", "display_order": 3},
    {"slug": "food",         "name": "Food & Drink",  "icon": "🍽️", "category_type": "restaurant",    "display_bg": "bg-red-50",    "display_border": "border-red-200",   "display_text": "text-red-700",   "display_order": 4},
    {"slug": "experiences",  "name": "Experiences",   "icon": "🗺️", "category_type": "experience",    "display_bg": "bg-purple-50", "display_border": "border-purple-200","display_text": "text-purple-700","display_order": 5},
    {"slug": "adventures",   "name": "Adventures",    "icon": "🥾", "category_type": "adventure",     "display_bg": "bg-orange-50", "display_border": "border-orange-200","display_text": "text-orange-700","display_order": 6},
    {"slug": "wellness",     "name": "Wellness",      "icon": "💆", "category_type": "wellness",      "display_bg": "bg-teal-50",   "display_border": "border-teal-200",  "display_text": "text-teal-700",  "display_order": 7},
    {"slug": "events",       "name": "Events",        "icon": "🎉", "category_type": "event",         "display_bg": "bg-pink-50",   "display_border": "border-pink-200",  "display_text": "text-pink-700",  "display_order": 8},
]

for cat in CATEGORIES:
    db.add(ServiceCategory(**cat))
db.commit()
print(f"✅ Categories: {len(CATEGORIES)}")


# ─── 5. Rejection Reasons ────────────────────────────────────────────────────

REJECTION_REASONS = [
    {"text": "Images are low quality or missing",       "applies_to": "service"},
    {"text": "Description is too short or unclear",     "applies_to": "service"},
    {"text": "Pricing is not competitive or unrealistic","applies_to": "service"},
    {"text": "Incomplete host profile information",     "applies_to": "host"},
    {"text": "Location or address is missing/incorrect","applies_to": "both"},
]

for r in REJECTION_REASONS:
    db.add(RejectionReason(**r))
db.commit()
print(f"✅ Rejection reasons: {len(REJECTION_REASONS)}")


# ─── 6. Admin user ───────────────────────────────────────────────────────────

admin = User(
    email="admin@afristay.co.ke",
    name="AfriStay Admin",
    phone="+254700000000",
    password_hash=hash_password("Afristay@1"),
    role="admin",
    is_verified=True,
    host_application_status="approved",
)
db.add(admin)
db.commit()
print("✅ Admin: admin@afristay.co.ke / Afristay@1")


# ─── 7. Host users ───────────────────────────────────────────────────────────

african_first = [
    "Amara","Kofi","Nia","Jabari","Zuri","Kwame","Aisha","Chidi","Imani","Tariq",
    "Yusuf","Fatima","Seun","Adaeze","Oluwaseun","Blessing","Emeka","Chiamaka","Tunde","Sade"
]
african_last = [
    "Osei","Mensah","Diallo","Kamau","Wanjiku","Achebe","Okonkwo","Ndlovu","Mutua","Abubakar",
    "Kariuki","Mwangi","Banda","Nkosi","Oduya","Eze","Afolabi","Ogundipe","Adeyemi","Fadahunsi"
]

hosts = []
for i in range(20):
    fn = african_first[i % len(african_first)]
    ln = african_last[i % len(african_last)]
    city_data = AFRICAN_CITIES[i % len(AFRICAN_CITIES)]
    h = User(
        email=f"host.{fn.lower()}.{ln.lower()}{i}@afristay.co.ke",
        name=f"{fn} {ln}",
        phone=f"+254{700000001 + i}",
        password_hash=hash_password("Host@1234"),
        role="host",
        is_verified=True,
        host_application_status="approved",
        host_application_data={"city": city_data[2], "country": city_data[3]},
    )
    hosts.append(h)
    db.add(h)
db.commit()
print(f"✅ Hosts: {len(hosts)}")


# ─── 8. Guest/client users ───────────────────────────────────────────────────

guests = []
for i in range(30):
    fn = fake.first_name()
    ln = fake.last_name()
    g = User(
        email=f"guest{i}@example.com",
        name=f"{fn} {ln}",
        phone=f"+254{720000000 + i}",
        password_hash=hash_password("Guest@1234"),
        role="client",
        is_verified=True,
    )
    guests.append(g)
    db.add(g)
db.commit()
print(f"✅ Guests: {len(guests)}")


# ─── 9. Services ─────────────────────────────────────────────────────────────

def make_metadata(svc_type, city, amenities=None, images=None):
    base_imgs = [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
        "https://images.unsplash.com/photo-1489171078254-c3365d6e359f?w=800",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800",
        "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800",
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
    ]
    return {
        "location": city,
        "amenities": amenities or [],
        "images": images or random.sample(base_imgs, k=random.randint(2, 4)),
        "host_avatar": f"https://i.pravatar.cc/150?img={random.randint(1, 70)}",
        "superhost": random.random() > 0.7,
        "rating": round(random.uniform(3.8, 5.0), 1),
        "reviews": random.randint(5, 200),
    }


ACCOMMODATION_DATA = [
    ("Savanna View Hotel",             "accommodation", "per_night", 120,  "hotel"),
    ("Kilimanjaro Safari Lodge",       "accommodation", "per_night", 280,  "lodge"),
    ("Baobab Beach Resort",            "accommodation", "per_night", 195,  "hotel"),
    ("Nairobi City Hostel",            "accommodation", "per_night", 25,   "hostel"),
    ("Zanzibar Stone Town Apartment",  "accommodation", "per_night", 85,   "airbnb"),
    ("Maasai Mara Tented Camp",        "accommodation", "per_night", 350,  "lodge"),
    ("Cape Town Clifton Suites",       "accommodation", "per_night", 210,  "hotel"),
    ("Kigali Green Hills Lodge",       "accommodation", "per_night", 140,  "hotel"),
    ("Diani Beachfront Villa",         "accommodation", "per_night", 320,  "airbnb"),
    ("Addis Ababa Skyline Hotel",      "accommodation", "per_night", 90,   "hotel"),
    ("Lagos Victoria Island Suites",   "accommodation", "per_night", 175,  "hotel"),
    ("Accra Airport Guesthouse",       "accommodation", "per_night", 60,   "hostel"),
    ("Marrakech Riad Oasis",           "accommodation", "per_night", 145,  "airbnb"),
    ("Serengeti Eco Camp",             "accommodation", "per_night", 420,  "lodge"),
    ("Kampala Garden Inn",             "accommodation", "per_night", 75,   "hotel"),
    ("Amboseli Elephant View Lodge",   "accommodation", "per_night", 390,  "lodge"),
    ("Mombasa Backpacker Hub",         "accommodation", "per_night", 20,   "hostel"),
    ("Rwenzori Mountain Retreat",      "accommodation", "per_night", 160,  "lodge"),
    ("Cairo Nile-View Apartment",      "accommodation", "per_night", 110,  "airbnb"),
    ("Johannesburg Boutique Stay",     "accommodation", "per_night", 135,  "hotel"),
    ("Eldoret Highland Guesthouse",    "accommodation", "per_night", 45,   "hostel"),
    ("Fes Medina Riad",                "accommodation", "per_night", 120,  "airbnb"),
    ("Bwindi Gorilla Inn",             "accommodation", "per_night", 480,  "lodge"),
    ("Zanzibar Dhow Palace Hotel",     "accommodation", "per_night", 230,  "hotel"),
    ("Nairobi Westlands Apartment",    "accommodation", "per_night", 70,   "airbnb"),
]

TRANSPORT_DATA = [
    ("Nairobi Airport Shuttle",         "transport", "fixed",      35,  "minibus"),
    ("Mombasa Coast Safari Jeep",       "transport", "per_day",   120,  "4x4"),
    ("Zanzibar Island Tuk-Tuk",         "transport", "per_hour",   15,  "tuk-tuk"),
    ("Kigali City Car Hire",            "transport", "per_day",    80,  "sedan"),
    ("Serengeti Game Drive Vehicle",    "transport", "per_day",   180,  "4x4"),
    ("Cape Town Airport Transfer",      "transport", "fixed",      45,  "sedan"),
    ("Kampala Boda Boda Experience",    "transport", "per_hour",    8,  "motorbike"),
    ("Cairo Pyramid Tour Bus",          "transport", "fixed",       60,  "bus"),
    ("Lagos Executive Car Service",     "transport", "per_day",   150,  "SUV"),
    ("Accra City Shuttle",              "transport", "fixed",       25,  "minibus"),
    ("Marrakech Desert 4x4 Safari",     "transport", "per_day",   200,  "4x4"),
    ("Nairobi Matatu Experience",       "transport", "fixed",        5,  "matatu"),
    ("Arusha Mountain Cruiser",         "transport", "per_day",   160,  "4x4"),
    ("Addis Ababa Minibus Hire",        "transport", "fixed",       30,  "minibus"),
    ("Lusaka Corporate Car Hire",       "transport", "per_day",    90,  "sedan"),
]

ATTRACTION_DATA = [
    ("Maasai Mara National Reserve",    "attraction", "per_entry",  80,  "wildlife"),
    ("Serengeti National Park",         "attraction", "per_entry", 100,  "wildlife"),
    ("Kilimanjaro National Park",       "attraction", "per_entry",  70,  "mountain"),
    ("Bwindi Impenetrable Forest",      "attraction", "per_entry", 700,  "gorilla"),
    ("Table Mountain",                  "attraction", "per_entry",  35,  "mountain"),
    ("Giza Pyramids",                   "attraction", "per_entry",  25,  "heritage"),
    ("Victoria Falls",                  "attraction", "per_entry",  30,  "waterfall"),
    ("Amboseli National Park",          "attraction", "per_entry",  65,  "wildlife"),
    ("Robben Island",                   "attraction", "per_entry",  22,  "heritage"),
    ("Zanzibar Spice Farms",            "attraction", "per_entry",  20,  "cultural"),
    ("Diani Beach",                     "attraction", "per_entry",   0,  "beach"),
    ("Nairobi National Museum",         "attraction", "per_entry",  10,  "museum"),
    ("Akagera National Park",           "attraction", "per_entry",  40,  "wildlife"),
    ("Lamu Old Town",                   "attraction", "per_entry",   5,  "heritage"),
    ("Ngorongoro Crater",               "attraction", "per_entry",  60,  "wildlife"),
]

RESTAURANT_DATA = [
    ("Carnivore Restaurant Nairobi",    "restaurant", "per_person", 40, "nyama choma"),
    ("Mama Oliech Nairobi",             "restaurant", "per_person", 10, "local"),
    ("Zanzibar Night Market Forodhani", "restaurant", "per_person", 12, "seafood"),
    ("Cape Town Harbour House",         "restaurant", "per_person", 55, "seafood"),
    ("Kigali Fusion Kitchen",           "restaurant", "per_person", 25, "fusion"),
    ("Lagos Yellow Chilli",             "restaurant", "per_person", 30, "nigerian"),
    ("Accra Buka Restaurant",           "restaurant", "per_person", 15, "ghanaian"),
    ("Marrakech Nomad Rooftop",         "restaurant", "per_person", 35, "moroccan"),
    ("Cairo Khan el-Khalili Café",      "restaurant", "per_person", 18, "egyptian"),
    ("Addis Ababa Yod Abyssinia",       "restaurant", "per_person", 22, "ethiopian"),
]

EXPERIENCE_DATA = [
    ("Nairobi Walking City Tour",       "experience", "per_person", 25, "cultural"),
    ("Maasai Village Cultural Tour",    "experience", "per_person", 50, "cultural"),
    ("Zanzibar Sunset Dhow Cruise",     "experience", "per_person", 45, "cruise"),
    ("Cairo Nile Felucca Ride",         "experience", "per_person", 20, "cruise"),
    ("Marrakech Medina Food Walk",      "experience", "per_person", 35, "food"),
    ("Kigali Genocide Memorial Tour",   "experience", "per_person",  0, "cultural"),
    ("Accra Slave Castle Tour",         "experience", "per_person", 15, "heritage"),
    ("Cape Town Township Tour",         "experience", "per_person", 30, "cultural"),
    ("Addis Ababa Coffee Ceremony",     "experience", "per_person", 20, "cultural"),
    ("Kampala Night Market Tour",       "experience", "per_person", 18, "food"),
]

ADVENTURE_DATA = [
    ("Kilimanjaro Summit Trek 7 Days",  "adventure", "per_person", 2200, "trekking"),
    ("Gorilla Trekking Bwindi",         "adventure", "per_person",  700, "wildlife"),
    ("Diani Kitesurfing Lessons",       "adventure", "per_person",  120, "water sports"),
    ("Nile Rafting Jinja",              "adventure", "per_person",  130, "water sports"),
    ("Cape Town Paragliding",           "adventure", "per_person",  180, "air sports"),
    ("Table Mountain Hike",             "adventure", "per_person",   40, "hiking"),
    ("Sahara Desert Camel Trek",        "adventure", "per_person",  250, "trekking"),
    ("Zanzibar Scuba Diving",           "adventure", "per_person",  95,  "diving"),
    ("Mount Kenya Day Hike",            "adventure", "per_person",  150, "hiking"),
    ("Livingstone Bungee Jump",         "adventure", "per_person",  160, "extreme"),
]

WELLNESS_DATA = [
    ("Nairobi Spa & Wellness Centre",   "wellness", "per_hour",   60, "spa"),
    ("Diani Beachside Yoga Retreat",    "wellness", "per_day",   120, "yoga"),
    ("Cape Town Clifton Spa",           "wellness", "per_hour",   90, "spa"),
    ("Zanzibar Seaweed Massage",        "wellness", "per_hour",   40, "massage"),
    ("Kigali Urban Wellness Studio",    "wellness", "per_hour",   50, "yoga"),
    ("Marrakech Hammam Tradition",      "wellness", "per_person", 35, "hammam"),
    ("Mombasa Ayurvedic Retreat",       "wellness", "per_day",   200, "ayurvedic"),
    ("Nairobi Forest Meditation",       "wellness", "per_person", 30, "meditation"),
]

OTHER_DATA = [
    ("Lake Victoria Sunset Cruise",     "cruise",   "per_person", 80,  "boat"),
    ("Nile Dinner Cruise Cairo",        "cruise",   "per_person", 65,  "boat"),
    ("Zanzibar Dolphin Boat Tour",      "cruise",   "per_person", 55,  "boat"),
    ("Nairobi Tech & Culture Expo",     "event",    "per_entry",  25,  "expo"),
    ("Cape Town Jazz Festival",         "event",    "per_entry",  40,  "music"),
    ("Lagos Afrobeats Concert",         "event",    "per_entry",  30,  "music"),
    ("Marrakech Film Festival",         "event",    "per_entry",  20,  "festival"),
]

ALL_SERVICE_SPECS = (
    ACCOMMODATION_DATA
    + TRANSPORT_DATA
    + ATTRACTION_DATA
    + RESTAURANT_DATA
    + EXPERIENCE_DATA
    + ADVENTURE_DATA
    + WELLNESS_DATA
    + OTHER_DATA
)

# Build long descriptions per type
DESC_TEMPLATES = {
    "accommodation": lambda name, sub: f"{name} offers a memorable stay in the heart of Africa. Guests enjoy {sub} ambience, stunning views, and world-class hospitality. Each room is thoughtfully designed for comfort and style.",
    "transport":     lambda name, sub: f"{name} provides reliable and comfortable {sub} transport across the region. Our professional drivers know every route and ensure you arrive safely and on time.",
    "attraction":    lambda name, sub: f"{name} is one of Africa's iconic {sub} destinations. Visitors discover breathtaking landscapes, diverse wildlife, and rich cultural heritage that stays with them forever.",
    "restaurant":    lambda name, sub: f"{name} brings authentic {sub} flavours to life with fresh locally sourced ingredients. Enjoy signature dishes in a warm, welcoming atmosphere.",
    "experience":    lambda name, sub: f"{name} is a curated {sub} experience that connects you with the soul of Africa. Knowledgeable guides lead you through stories, tastes, and traditions.",
    "tour":          lambda name, sub: f"{name} is a guided {sub} tour designed for curious travellers. Our expert guides bring history and culture to life at every stop.",
    "adventure":     lambda name, sub: f"{name} is an exhilarating {sub} adventure for thrill-seekers. Safety-certified guides and top equipment ensure an unforgettable experience.",
    "wellness":      lambda name, sub: f"{name} is a sanctuary for mind, body, and soul. Indulge in {sub} treatments inspired by ancient African healing traditions.",
    "event":         lambda name, sub: f"{name} is a vibrant {sub} event celebrating African art, culture, and creativity. Connect with fellow enthusiasts from around the world.",
    "cruise":        lambda name, sub: f"{name} is a scenic {sub} cruise on Africa's majestic waterways. Relax on deck and enjoy spectacular views as the sun sets over the horizon.",
}

services = []
for i, (title, svc_type, pricing_type, price, subtype) in enumerate(ALL_SERVICE_SPECS):
    city_row = AFRICAN_CITIES[i % len(AFRICAN_CITIES)]
    lat, lng, city, country = city_row

    # Slight jitter on coordinates
    lat += random.uniform(-0.05, 0.05)
    lng += random.uniform(-0.05, 0.05)

    desc = DESC_TEMPLATES.get(svc_type, lambda n, s: fake.paragraph(nb_sentences=3))(title, subtype)

    amenities = []
    if svc_type == "accommodation":
        amenities = random.sample(["WiFi", "Pool", "Restaurant", "Parking", "Air conditioning", "Gym", "Spa", "Bar", "Safari tours", "Room service"], k=random.randint(3, 7))

    svc = Service(
        host_id=random.choice(hosts).id,
        type=svc_type,
        title=title,
        description=desc,
        location=geo(lat, lng),
        price_base=price,
        pricing_type=pricing_type,
        approval_status="approved",
        country_code=country,
        service_metadata=make_metadata(svc_type, city, amenities),
    )
    services.append(svc)
    db.add(svc)

db.commit()
print(f"✅ Services: {len(services)}")


# ─── 10. Accommodation & Transport detail rows ────────────────────────────────

accom_services = [s for s in services if s.type == "accommodation"]
transport_services = [s for s in services if s.type == "transport"]

for svc in accom_services:
    db.add(Accommodation(
        service_id=svc.id,
        rooms=random.randint(1, 80),
        amenities=svc.service_metadata.get("amenities", []),
        check_in_time=datetime.utcnow().replace(hour=14, minute=0, second=0, microsecond=0),
        check_out_time=datetime.utcnow().replace(hour=11, minute=0, second=0, microsecond=0),
    ))

VEHICLE_TYPES = ["sedan", "SUV", "4x4", "minibus", "bus", "tuk-tuk", "matatu", "motorbike"]

for svc in transport_services:
    city_row = AFRICAN_CITIES[transport_services.index(svc) % len(AFRICAN_CITIES)]
    lat, lng = city_row[0], city_row[1]
    db.add(Transport(
        service_id=svc.id,
        vehicle_type=random.choice(VEHICLE_TYPES),
        capacity=random.choice([2, 4, 7, 12, 30, 50]),
        pickup_location=geo(lat + random.uniform(-0.02, 0.02), lng + random.uniform(-0.02, 0.02)),
        dropoff_location=geo(lat + random.uniform(-0.1, 0.1), lng + random.uniform(-0.1, 0.1)),
        price_per_km=round(random.uniform(0.5, 3.0), 2) if svc.pricing_type == "per_km" else None,
        fixed_price=float(svc.price_base) if svc.pricing_type == "fixed" else None,
    ))

db.commit()
print(f"✅ Accommodation details: {len(accom_services)}, Transport details: {len(transport_services)}")


# ─── 11. Availability ────────────────────────────────────────────────────────

avail_count = 0
for svc in services:
    for j in range(3):
        start = future_dt(days_from_now=j * 10 + 2)
        db.add(Availability(
            service_id=svc.id,
            start_time=start,
            end_time=start + timedelta(hours=8),
            is_available=True,
        ))
        avail_count += 1

db.commit()
print(f"✅ Availability slots: {avail_count}")


# ─── 12. Bookings & Payments ─────────────────────────────────────────────────

BOOKING_STATUSES = ["confirmed", "confirmed", "confirmed", "pending", "cancelled"]
bookings = []

for i in range(60):
    guest = random.choice(guests)
    svc = random.choice(services)
    status = random.choice(BOOKING_STATUSES)
    nights = random.randint(1, 7)
    qty = random.randint(1, 3)
    start = future_dt(days_from_now=random.randint(-30, 60))
    end = start + timedelta(days=nights)
    total = float(svc.price_base) * nights * qty

    booking = Booking(
        user_id=guest.id,
        service_id=svc.id,
        start_time=start,
        end_time=end,
        quantity=qty,
        status=status,
        total_price=total,
        created_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
    )
    bookings.append(booking)
    db.add(booking)

db.commit()

pay_count = 0
for booking in bookings:
    if booking.status == "confirmed":
        db.add(Payment(
            booking_id=booking.id,
            amount=booking.total_price,
            method=random.choice(["mpesa", "card"]),
            status="completed",
            transaction_ref=f"TXN{fake.hexify(text='^^^^^^^^').upper()}",
        ))
        pay_count += 1

db.commit()
print(f"✅ Bookings: {len(bookings)}, Payments: {pay_count}")


# ─── 13. Reviews ─────────────────────────────────────────────────────────────

REVIEW_COMMENTS = [
    "Absolutely amazing experience! Would recommend to everyone.",
    "Fantastic service and great value for money.",
    "Very professional staff and clean facilities.",
    "The views were breathtaking and the food was delicious.",
    "A truly authentic African experience. Will definitely return.",
    "Exceeded all expectations. Wonderful hosts.",
    "Well-organised and incredibly memorable.",
    "Perfect for families. Kids loved every moment.",
    "Beautiful location and very comfortable accommodation.",
    "The guide was knowledgeable and made the trip so special.",
    "Good overall but could improve on the waiting times.",
    "Decent experience. Friendly staff and reasonable pricing.",
    "Met most expectations. Scenic area with helpful team.",
    "Solid option for the price. Would visit again.",
]

review_count = 0
for svc in services:
    reviewers = random.sample(guests, k=random.randint(2, 5))
    for g in reviewers:
        db.add(Review(
            user_id=g.id,
            service_id=svc.id,
            rating=random.choices([3, 4, 4, 5, 5, 5], k=1)[0],
            comment=random.choice(REVIEW_COMMENTS),
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 180)),
        ))
        review_count += 1

db.commit()
print(f"✅ Reviews: {review_count}")


# ─── 14. Job openings ────────────────────────────────────────────────────────

JOBS = [
    {"title": "Senior Backend Engineer",  "team": "Engineering",  "location": "Nairobi / Remote", "employment_type": "Full-time", "description": "Build and scale AfriStay's backend APIs using FastAPI and PostgreSQL.", "requirements": "3+ years Python, FastAPI, PostgreSQL experience."},
    {"title": "Mobile Developer (React Native)", "team": "Engineering", "location": "Remote",  "employment_type": "Full-time", "description": "Lead development of AfriStay's mobile app for iOS and Android.", "requirements": "2+ years React Native, REST API integration."},
    {"title": "Customer Success Manager", "team": "Operations",   "location": "Nairobi",         "employment_type": "Full-time", "description": "Support hosts and travellers through onboarding and ongoing service delivery.", "requirements": "2+ years customer-facing role, tourism background a plus."},
    {"title": "Growth Marketing Lead",    "team": "Marketing",    "location": "Lagos / Remote",  "employment_type": "Full-time", "description": "Drive user acquisition and retention across East and West Africa.", "requirements": "3+ years digital marketing, SEO, paid ads, content."},
    {"title": "Data Analyst",             "team": "Data",         "location": "Remote",          "employment_type": "Contract",  "description": "Analyse booking trends, pricing, and user behaviour to inform product decisions.", "requirements": "SQL, Python (pandas), data visualisation tools."},
]

for job in JOBS:
    db.add(JobOpening(**job))
db.commit()
print(f"✅ Job openings: {len(JOBS)}")

print("\n🎉 Seed complete!")
print("   Admin login: admin@afristay.co.ke / Afristay@1")
print(f"   {len(services)} services across {len(set(s.type for s in services))} categories")
print(f"   {len(hosts)} hosts | {len(guests)} guests | {len(bookings)} bookings | {review_count} reviews")
