import pytest

@pytest.fixture
def auth_headers(client):
    client.post("/api/v1/auth/register", json={"username": "exportuser", "password": "pass"})
    resp = client.post("/api/v1/auth/login", data={"username": "exportuser", "password": "pass"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_export_markdown(client, auth_headers):
    client.post("/api/v1/snippets/", json={"title": "MD Snippet", "language": "python", "code": "print('md')", "tags": []}, headers=auth_headers)
    response = client.get("/api/v1/export/markdown", headers=auth_headers)
    assert response.status_code == 200
    assert "# Snippets Export" in response.text
    assert "## MD Snippet" in response.text

def test_export_pdf(client, auth_headers):
    client.post("/api/v1/snippets/", json={"title": "PDF Snippet", "language": "python", "code": "print('pdf')", "tags": []}, headers=auth_headers)
    response = client.get("/api/v1/export/pdf", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
