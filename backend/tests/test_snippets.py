import pytest

@pytest.fixture
def auth_headers(client):
    client.post(
        "/api/v1/auth/register",
        json={"username": "user1", "password": "password"}
    )
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "user1", "password": "password"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_snippet(client, auth_headers):
    response = client.post(
        "/api/v1/snippets/",
        json={
            "title": "Test Snippet",
            "language": "python",
            "code": "print('hello')",
            "description": "A test snippet",
            "tags": ["test", "python"]
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Snippet"

def test_read_snippets(client, auth_headers):
    # Create one snippet first
    client.post(
        "/api/v1/snippets/",
        json={"title": "S1", "language": "js", "code": "const x = 1", "tags": []},
        headers=auth_headers
    )
    response = client.get("/api/v1/snippets/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "S1"

def test_read_snippet_by_id(client, auth_headers):
    post_resp = client.post(
        "/api/v1/snippets/",
        json={"title": "S2", "language": "js", "code": "const x = 2", "tags": []},
        headers=auth_headers
    )
    snippet_id = post_resp.json()["id"]
    
    response = client.get(f"/api/v1/snippets/{snippet_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "S2"

def test_update_snippet(client, auth_headers):
    post_resp = client.post(
        "/api/v1/snippets/",
        json={"title": "Old Title", "language": "js", "code": "const x = 1", "tags": ["old"]},
        headers=auth_headers
    )
    snippet_id = post_resp.json()["id"]
    
    response = client.put(
        f"/api/v1/snippets/{snippet_id}",
        json={"title": "New Title", "tags": ["new", "test"]},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"

def test_delete_snippet(client, auth_headers):
    post_resp = client.post(
        "/api/v1/snippets/",
        json={"title": "To Delete", "language": "js", "code": "const x = 1", "tags": []},
        headers=auth_headers
    )
    snippet_id = post_resp.json()["id"]
    
    response = client.delete(f"/api/v1/snippets/{snippet_id}", headers=auth_headers)
    assert response.status_code == 204
    
    get_resp = client.get(f"/api/v1/snippets/{snippet_id}", headers=auth_headers)
    assert get_resp.status_code == 404
