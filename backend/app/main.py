from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

from .core.database import engine, Base
from .api import snippets, search, export, auth, collections
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

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(snippets.router, prefix="/api/v1/snippets", tags=["snippets"])
app.include_router(collections.router, prefix="/api/v1/collections", tags=["collections"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(export.router, prefix="/api/v1/export", tags=["export"])
