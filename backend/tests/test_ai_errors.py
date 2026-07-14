from backend.app.services.ai_service import ai_service

BASE = "/api/v1"


def _token(client, username="aiuser"):
    client.post(
        f"{BASE}/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": "password1"},
    )
    r = client.post(f"{BASE}/auth/login", data={"username": username, "password": "password1"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def _raise_secret(*a, **k):
    raise RuntimeError("SECRET_PATH=/etc/passwd OLLAMA_URL=http://u:p@host:11434")


def test_ai_enrich_error_generic_fr(monkeypatch, client):
    # Échec IA simulé : la réponse ne doit PAS fuiter l'interne (CWE-209). Défaut = FR.
    monkeypatch.setattr(ai_service, "generate_tags_and_description", _raise_secret)
    r = client.post(f"{BASE}/ai/enrich", json={"code": "x=1", "language": "python"},
                    headers=_token(client))
    assert r.status_code == 500
    detail = r.json()["detail"]
    assert detail == "Le service IA est temporairement indisponible."
    assert "SECRET_PATH" not in detail and "OLLAMA_URL" not in detail


def test_ai_enrich_error_generic_en(monkeypatch, client):
    # Accept-Language: en → message Anglais.
    monkeypatch.setattr(ai_service, "generate_tags_and_description", _raise_secret)
    h = _token(client, "aiuser2")
    h["Accept-Language"] = "en"
    r = client.post(f"{BASE}/ai/enrich", json={"code": "x=1", "language": "python"}, headers=h)
    assert r.status_code == 500
    assert r.json()["detail"] == "The AI service is temporarily unavailable."
