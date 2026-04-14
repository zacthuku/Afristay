from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def init_db() -> None:
    """
    Seed database ONLY.
    Tables must already exist via Alembic migrations.
    """

    print("🌱 Seeding database...")

    db: Session = SessionLocal()

    try:
        # Import here to avoid circular import
        from app.db.seed import seed_data
        seed_data(db)
        print("✅ Seeding completed")
    except Exception as e:
        print("❌ Error seeding database:", e)
        db.rollback()
    finally:
        db.close()

    print("🎉 Done!")


if __name__ == "__main__":
    init_db()