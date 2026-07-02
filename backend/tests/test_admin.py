from backend.app import models

BASE = "/api/v1"


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _make(client, db, username, password, role="USER"):
    client.post(f"{BASE}/auth/register", json={"username": username, "password": password})
    if role == "ADMIN":
        user = db.query(models.User).filter(models.User.username == username).first()
        user.role = "ADMIN"
        db.commit()
    r = client.post(f"{BASE}/auth/login", data={"username": username, "password": password})
    return r.json()["access_token"]


def test_user_forbidden(client, db):
    token = _make(client, db, "bob", "password1")
    r = client.get(f"{BASE}/admin/users", headers=_auth(token))
    assert r.status_code == 403


def test_admin_lists_users(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    _make(client, db, "alice", "password2")
    r = client.get(f"{BASE}/admin/users", headers=_auth(admin))
    assert r.status_code == 200
    assert {"boss", "alice"} <= {u["username"] for u in r.json()}


def test_admin_changes_role(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    _make(client, db, "alice", "password2")
    alice = db.query(models.User).filter(models.User.username == "alice").first()
    r = client.patch(f"{BASE}/admin/users/{alice.id}", json={"role": "ADMIN"}, headers=_auth(admin))
    assert r.status_code == 200
    assert r.json()["role"] == "ADMIN"


def test_admin_cannot_delete_self(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    me = db.query(models.User).filter(models.User.username == "boss").first()
    r = client.delete(f"{BASE}/admin/users/{me.id}", headers=_auth(admin))
    assert r.status_code == 400


def test_admin_deletes_user(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    _make(client, db, "alice", "password2")
    alice = db.query(models.User).filter(models.User.username == "alice").first()
    r = client.delete(f"{BASE}/admin/users/{alice.id}", headers=_auth(admin))
    assert r.status_code == 204
    assert db.query(models.User).filter(models.User.username == "alice").first() is None


def test_roles_matrix_requires_admin(client, db):
    token = _make(client, db, "bob", "password1")  # USER
    r = client.get(f"{BASE}/admin/roles", headers=_auth(token))
    assert r.status_code == 403


def test_admin_roles_matrix(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    r = client.get(f"{BASE}/admin/roles", headers=_auth(admin))
    assert r.status_code == 200
    data = r.json()
    assert data["roles"] == ["USER", "ADMIN"]
    cap = next(c for c in data["capabilities"] if c["key"] == "manage_users")
    assert cap["roles"]["ADMIN"] is True and cap["roles"]["USER"] is False


def test_ai_usage_requires_admin(client, db):
    token = _make(client, db, "bob", "password1")  # USER
    r = client.get(f"{BASE}/admin/ai-usage", headers=_auth(token))
    assert r.status_code == 403


def test_ai_usage_counts(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    db.add(models.AiUsage(feature="enrich", user_id=None))
    db.add(models.AiUsage(feature="chat", user_id=None))
    db.add(models.AiUsage(feature="chat", user_id=None))
    db.commit()
    r = client.get(f"{BASE}/admin/ai-usage?days=3650", headers=_auth(admin))
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 3
    assert data["by_feature"]["chat"] == 2


def test_audit_requires_admin(client, db):
    token = _make(client, db, "bob", "password1")  # USER
    r = client.get(f"{BASE}/admin/audit", headers=_auth(token))
    assert r.status_code == 403


def test_audit_records_role_change(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    _make(client, db, "alice", "password2")
    alice = db.query(models.User).filter(models.User.username == "alice").first()
    client.patch(f"{BASE}/admin/users/{alice.id}", json={"role": "ADMIN"}, headers=_auth(admin))
    r = client.get(f"{BASE}/admin/audit?days=3650", headers=_auth(admin))
    assert r.status_code == 200
    events = r.json()
    assert any(e["action"] == "role_change" and e["target"] == "alice" for e in events)


def test_admin_snippets_requires_admin(client, db):
    token = _make(client, db, "bob", "password1")  # USER
    r = client.get(f"{BASE}/admin/snippets", headers=_auth(token))
    assert r.status_code == 403


def test_admin_lists_snippets_metadata_only(client, db):
    admin = _make(client, db, "boss", "password1", role="ADMIN")
    owner = db.query(models.User).filter(models.User.username == "boss").first()
    db.add(models.Snippet(title="Mon secret", language="python", code="API_KEY=xyz", owner_id=owner.id))
    db.commit()
    r = client.get(f"{BASE}/admin/snippets", headers=_auth(admin))
    assert r.status_code == 200
    data = r.json()
    assert any(s["title"] == "Mon secret" and s["language"] == "python" for s in data)
    # Confidentialité : le code n'est jamais exposé.
    assert all("code" not in s for s in data)
