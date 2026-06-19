from backend.app.services.ai_service import AIService


def test_ai_enrichment(client):
    response = client.post(
        "/api/v1/ai/enrich",
        json={"code": "def hello(): pass", "language": "python"}
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
