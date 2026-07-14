BASE = "/api/v1"


def _token(client, username="rlai"):
    client.post(
        f"{BASE}/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": "password1"},
    )
    r = client.post(f"{BASE}/auth/login", data={"username": username, "password": "password1"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_ai_enrich_rate_limited(client):
    # 30 appels IA autorisés (mock → instant), le 31e est bloqué (429) + Retry-After.
    h = _token(client)
    for _ in range(30):
        r = client.post(f"{BASE}/ai/enrich", json={"code": "x=1", "language": "python"}, headers=h)
        assert r.status_code == 200
    r = client.post(f"{BASE}/ai/enrich", json={"code": "x=1", "language": "python"}, headers=h)
    assert r.status_code == 429
    assert "Retry-After" in r.headers


def test_ai_rate_limit_isolated_per_user(client):
    # Le quota IA est par utilisateur : Alice saturée, Bob encore libre.
    alice = _token(client, "alice")
    for _ in range(30):
        client.post(f"{BASE}/ai/enrich", json={"code": "x=1", "language": "python"}, headers=alice)
    assert client.post(f"{BASE}/ai/enrich", json={"code": "x=1", "language": "python"},
                       headers=alice).status_code == 429
    bob = _token(client, "bob")
    assert client.post(f"{BASE}/ai/enrich", json={"code": "x=1", "language": "python"},
                       headers=bob).status_code == 200


def test_semantic_search_rate_limited(client):
    # search/semantic partage le budget IA ; 30 OK puis 31e → 429.
    h = _token(client, "rlsem")
    for _ in range(30):
        r = client.get(f"{BASE}/search/semantic?query=test", headers=h)
        assert r.status_code == 200
    r = client.get(f"{BASE}/search/semantic?query=test", headers=h)
    assert r.status_code == 429
