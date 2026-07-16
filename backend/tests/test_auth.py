from backend.app.core import rate_limit


def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "testuser@example.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_login_user(client):
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={"username": "loginuser", "email": "loginuser@example.com", "password": "loginpassword"}
    )
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "loginuser", "password": "loginpassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_register_rate_limited(client):
    # 10 tentatives autorisées, la 11e est bloquée (429) avec Retry-After.
    for i in range(10):
        r = client.post(
            "/api/v1/auth/register",
            json={"username": f"rluser{i}", "email": f"rluser{i}@example.com", "password": "password1"},
        )
        assert r.status_code == 200
    r = client.post(
        "/api/v1/auth/register",
        json={"username": "blocked", "email": "blocked@example.com", "password": "password1"},
    )
    assert r.status_code == 429
    assert "Retry-After" in r.headers


def test_register_uses_xff_behind_proxy(monkeypatch, client):
    # Derriere proxy : /register cle sur X-Forwarded-For (premier hop) — distingue les IP.
    monkeypatch.setattr(rate_limit, "BEHIND_PROXY", True)
    ipA = {"X-Forwarded-For": "203.0.113.1"}
    ipB = {"X-Forwarded-For": "198.51.100.1"}
    for i in range(10):  # sature le quota de l'IP A
        r = client.post("/api/v1/auth/register",
            json={"username": f"a{i}", "email": f"a{i}@example.com", "password": "password1"}, headers=ipA)
        assert r.status_code == 200
    r = client.post("/api/v1/auth/register",
        json={"username": "aX", "email": "aX@example.com", "password": "password1"}, headers=ipA)
    assert r.status_code == 429  # IP A bloquee
    r = client.post("/api/v1/auth/register",
        json={"username": "b0", "email": "b0@example.com", "password": "password1"}, headers=ipB)
    assert r.status_code == 200  # IP B distincte, autorisee


def test_register_ignores_xff_without_proxy(monkeypatch, client):
    # Sans proxy : XFF ignore, tout partage l'IP TestClient → 11e bloquee.
    monkeypatch.setattr(rate_limit, "BEHIND_PROXY", False)
    for i in range(10):
        client.post("/api/v1/auth/register",
            json={"username": f"n{i}", "email": f"n{i}@example.com", "password": "password1"},
            headers={"X-Forwarded-For": f"10.0.0.{i}"})
    r = client.post("/api/v1/auth/register",
        json={"username": "blocked", "email": "blocked@example.com", "password": "password1"},
        headers={"X-Forwarded-For": "10.0.0.99"})
    assert r.status_code == 429
