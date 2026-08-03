from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

from sqlalchemy import text
from fastapi.responses import JSONResponse
from .core.database import engine, Base
from .core.privacy import is_air_gapped
from .api import snippets, search, export, auth, collections, admin
from .api.ai import router as ai_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Izwan")

default_origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(default_origins)).split(",")
    if origin.strip()
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Snippet Manager IA API"}

@app.get("/health")
def health():
    """Sonde de disponibilité (publique) : réponse rapide pour UptimeRobot, le
    dashboard admin et le load test. Teste la base et remonte le mode IA courant.
    Renvoie 503 si la base est injoignable (permet à un moniteur d'alerter)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    ai_provider = "ollama" if (is_air_gapped() or not os.getenv("GROQ_API_KEY")) else "groq"
    body = {
        "status": "ok" if db_ok else "degraded",
        "database": "ok" if db_ok else "down",
        "ai_provider": ai_provider,
        "embeddings": "fastembed",
        "air_gapped": is_air_gapped(),
    }
    return JSONResponse(body, status_code=200 if db_ok else 503)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(snippets.router, prefix="/api/v1/snippets", tags=["snippets"])
app.include_router(collections.router, prefix="/api/v1/collections", tags=["collections"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(export.router, prefix="/api/v1/export", tags=["export"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
