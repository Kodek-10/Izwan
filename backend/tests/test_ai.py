from backend.app.services.ai_service import AIService


def _token(client, username="ai_user", password="pw"):
    client.post("/api/v1/auth/register", json={"username": username, "password": password})
    r = client.post("/api/v1/auth/login", data={"username": username, "password": password})
    return r.json()["access_token"]


def test_ai_enrich_requires_auth(client):
    # Durcissement : les endpoints IA exigent désormais une authentification.
    response = client.post(
        "/api/v1/ai/enrich",
        json={"code": "def hello(): pass", "language": "python"},
    )
    assert response.status_code == 401


def test_ai_enrichment(client):
    token = _token(client)
    response = client.post(
        "/api/v1/ai/enrich",
        json={"code": "def hello(): pass", "language": "python"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "tags" in data
    assert "description" in data
    assert "python" in [t.lower() for t in data["tags"]]


def test_ai_context_window_scales_with_input_size():
    service = AIService()

    small_window = service._select_context_window("short code")
    large_window = service._select_context_window("x" * 50000)

    assert small_window <= large_window
    assert large_window >= 16384


def test_ai_prepare_context_truncates_middle_for_large_inputs():
    service = AIService()
    text = "A" * 25000 + "B" * 25000

    prepared = service._prepare_context(text, context_window=4096)

    assert len(prepared) < len(text)
    assert "context truncated" in prepared
    assert prepared.startswith("A")
    assert prepared.endswith("B")
