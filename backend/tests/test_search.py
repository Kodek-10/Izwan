import pytest

@pytest.fixture
def auth_headers(client):
    client.post("/api/v1/auth/register", json={"username": "searchuser", "password": "pass"})
    resp = client.post("/api/v1/auth/login", data={"username": "searchuser", "password": "pass"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_search_by_title(client, auth_headers):
    client.post("/api/v1/snippets/", json={"title": "Unique Title", "language": "python", "code": "pass", "tags": []}, headers=auth_headers)
    client.post("/api/v1/snippets/", json={"title": "Other", "language": "python", "code": "pass", "tags": []}, headers=auth_headers)
    
    response = client.get("/api/v1/search/?q=Unique", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Unique Title"

def test_search_by_tag(client, auth_headers):
    client.post("/api/v1/snippets/", json={"title": "S1", "language": "python", "code": "pass", "tags": ["special"]}, headers=auth_headers)
    
    response = client.get("/api/v1/search/?q=special", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["tags"][0]["name"] == "special"

def test_semantic_search(client, auth_headers):
    # Create snippets
    client.post("/api/v1/snippets/", json={
        "title": "Date filtering function",
        "language": "python",
        "code": "def filter_by_date(items): return [i for i in items if i.date > now()]",
        "tags": []
    }, headers=auth_headers)
    
    # Search by intention
    response = client.get("/api/v1/search/semantic?query=function to filter list by date", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "Date filtering" in data[0]["title"]
