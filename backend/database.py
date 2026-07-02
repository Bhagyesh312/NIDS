import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load .env file
load_dotenv()

# Read from environment variable — falls back to hardcoded value if .env missing
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:kali@localhost:5432/NIDS"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # verify connection is alive before using it
    pool_size=10,            # number of persistent connections
    max_overflow=20,         # extra connections allowed above pool_size
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency — inject into route functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
