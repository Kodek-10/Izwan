from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Utilise DATABASE_URL si définie (ex: Supabase en prod), sinon utilise SQLite en local
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./snippets.db")

# Configuration spécifique pour SQLite (check_same_thread)
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Pour PostgreSQL, on n'a pas besoin de check_same_thread
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
