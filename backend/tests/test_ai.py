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
