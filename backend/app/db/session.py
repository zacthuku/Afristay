from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Normalize URL: Render gives postgres://, SQLAlchemy 2.x needs postgresql://
sync_url = settings.DATABASE_URL \
    .replace("postgresql+asyncpg://", "postgresql://") \
    .replace("postgres://", "postgresql://")

# Sync engine for app runtime
engine = create_engine(
    sync_url,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

def get_db():
    """Dependency for getting database session in FastAPI routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()