from backend.app import models

BASE = "/api/v1"


def _register_and_login(client, username):
    client.post(
        f"{BASE}/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": "password1"},
    )
    r = client.post(f"{BASE}/auth/login", data={"username": username, "password": "password1"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _user(db, username):
    return db.query(models.User).filter(models.User.username == username).first()


def _create_collection(db, owner_id, name):
    c = models.Collection(name=name, owner_id=owner_id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def test_create_snippet_rejects_other_user_collection(client, db):
    # Bob tente de rattacher un snippet à la collection d'Alice → 404 (anti-IDOR, anti-énumération).
    _register_and_login(client, "alice")  # crée l'utilisateur Alice
    alice_col = _create_collection(db, _user(db, "alice").id, "Alice")
    bob_h = _register_and_login(client, "bob")
    bob = _user(db, "bob")
    r = client.post(
        f"{BASE}/snippets/",
        json={"title": "s", "language": "python", "code": "x=1",
              "description": "d", "tags": ["t"], "collection_id": alice_col.id},
        headers=bob_h,
    )
    assert r.status_code == 404
    assert db.query(models.Snippet).filter(models.Snippet.owner_id == bob.id).count() == 0


def test_create_snippet_accepts_own_collection(client, db):
    # Bob rattache à SA propre collection → 201 (happy path préservé).
    bob_h = _register_and_login(client, "bob2")
    bob = _user(db, "bob2")
    bob_col = _create_collection(db, bob.id, "Bob")
    r = client.post(
        f"{BASE}/snippets/",
        json={"title": "s", "language": "python", "code": "x=1",
              "description": "d", "tags": ["t"], "collection_id": bob_col.id},
        headers=bob_h,
    )
    assert r.status_code == 201
    assert r.json()["collection_ref"]["id"] == bob_col.id


def test_update_snippet_rejects_other_user_collection(client, db):
    # Bob tente de déplacer son snippet vers la collection d'Alice → 404, collection inchangée.
    bob_h = _register_and_login(client, "bob3")
    bob = _user(db, "bob3")
    _register_and_login(client, "alice3")
    alice_col = _create_collection(db, _user(db, "alice3").id, "Alice")
    s = models.Snippet(title="s", language="python", code="x=1", owner_id=bob.id)
    db.add(s)
    db.commit()
    db.refresh(s)
    r = client.put(f"{BASE}/snippets/{s.id}", json={"collection_id": alice_col.id}, headers=bob_h)
    assert r.status_code == 404
    db.refresh(s)
    assert s.collection_id is None
