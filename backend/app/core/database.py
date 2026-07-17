from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# La base est toujours explicite : plus de repli SQLite silencieux, qui laissait croire
# qu'on travaillait sur Supabase alors qu'on écrivait dans un fichier local.
#   Supabase : postgresql://...pooler.supabase.com:6543/postgres
#   SQLite   : sqlite:///./test.db  (réservé aux tests et à la coquille desktop hors-ligne)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Renseigne-la dans backend/.env (voir backend/.env.example)."
    )

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite : check_same_thread requis pour l'usage multi-thread de FastAPI.
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Postgres/Supabase : le pooler recycle les connexions inactives -> pool_pre_ping
    # évite les erreurs "server closed the connection unexpectedly".
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
