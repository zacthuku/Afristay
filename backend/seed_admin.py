#!/usr/bin/env python3
"""
Standalone script to seed admin user into the database.
"""
import os
import sys
from pathlib import Path

# Add the project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.all_models import User
from app.core.security import hash_password
from app.core.config import settings

# Convert async URL to sync for seeding
db_url = (str(settings.DATABASE_URL)
          .replace("postgresql+asyncpg://", "postgresql://")
          .replace("postgres://", "postgresql://"))

# Create engine and session
engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
db = Session()

try:
    # Check if admin already exists
    admin = db.query(User).filter(User.email == "admin@afristay.co.ke").first()
    
    if admin:
        if admin.role != "admin" or not admin.is_verified:
            admin.role = "admin"
            admin.is_verified = True
            db.commit()
            print(f"✅ Admin user updated: {admin.email}")
        else:
            print(f"✅ Admin user already exists: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"   Verified: {admin.is_verified}")
    else:
        # Create new admin user
        admin_user = User(
            email="admin@afristay.co.ke",
            password_hash=hash_password("Afristay@1"),
            role="admin",
            is_verified=True
        )
        db.add(admin_user)
        db.commit()
        print(f"✅ Admin user created successfully!")
        print(f"   Email: admin@afristay.co.ke")
        print(f"   Password: Afristay@1")
        print(f"   Role: admin")
        
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
