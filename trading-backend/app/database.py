# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from .config import RDS_HOST, RDS_PORT, RDS_USER, RDS_PASSWORD, DATABASE_NAME
from .models import Base

DATABASE_URL = f"mysql+pymysql://{RDS_USER}:{RDS_PASSWORD}@{RDS_HOST}:{RDS_PORT}/{DATABASE_NAME}"

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_connection():
    """Dependency to get a database connection."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        print(f"Database session error: {e}")
        raise
    finally:
        db.close()

