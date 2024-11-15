# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from .config import RDS_HOST, RDS_PORT, RDS_USER, RDS_PASSWORD, DATABASE_NAME
from .models import Base

# Create the SQLAlchemy engine with connection pooling
DATABASE_URL = f"mysql+pymysql://{RDS_USER}:{RDS_PASSWORD}@{RDS_HOST}:{RDS_PORT}/{DATABASE_NAME}"

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a scoped session for thread safety
def get_db_connection():
    """Dependency to get a database connection."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        print(f"Error connecting to the database: {e}")
        raise
    finally:
        db.close()

# Ensure that all models are registered
Base.metadata.create_all(bind=engine)
