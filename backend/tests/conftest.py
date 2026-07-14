import os
# Force sqlite for tests before app imports load_dotenv or database.py
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.core import rate_limit as _rl
from backend.app.services.ai_service import ai_service

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def _mock_ai(monkeypatch):
    """Mock les appels LLM (Ollama/Groq) en tests → rapide, déterministe, hors-réseau.
    embedding_service (fastembed local) reste réel mais rapide en cache. Un test peut
    surcharger une méthode (ex: test_ai_errors force un raise)."""
    async def _enrich(*a, **k): return {"tags": ["mock"], "description": "mock"}
    async def _explain(*a, **k): return "mock explanation"
    async def _chat(*a, **k): return "mock answer"
    async def _adapt(*a, **k): return "mock adapted code"
    async def _translate(*a, **k): return {"translated_code": "mock", "description": None, "tags": None}
    monkeypatch.setattr(ai_service, "generate_tags_and_description", _enrich)
    monkeypatch.setattr(ai_service, "explain_code", _explain)
    monkeypatch.setattr(ai_service, "chat_with_context", _chat)
    monkeypatch.setattr(ai_service, "adapt_code", _adapt)
    monkeypatch.setattr(ai_service, "translate_code", _translate)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    _rl._failures.clear()        # isole les compteurs de rate-limit entre tests
    _rl._creation_counts.clear()
    _rl._ai_counts.clear()       # (H3) quota IA
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
