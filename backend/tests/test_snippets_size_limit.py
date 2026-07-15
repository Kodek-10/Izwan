from backend.app import models
from backend.app.schemas import MAX_CODE_LEN, MAX_TITLE_LEN

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


def test_create_rejects_oversized_code(client, db):
    # code au-dela de la borne -> 422 (validation Pydantic, avant DB/IA/embedding), 0 snippet cree.
    h = _register_and_login(client, "size1")
    u = _user(db, "size1")
    r = client.post(
        f"{BASE}/snippets/",
        json={"title": "s", "language": "python", "code": "x" * (MAX_CODE_LEN + 1)},
        headers=h,
    )
    assert r.status_code == 422
    assert db.query(models.Snippet).filter(models.Snippet.owner_id == u.id).count() == 0


def test_create_accepts_within_limit(client, db):
    # happy path preserve : code sous la borne -> 201.
    h = _register_and_login(client, "size2")
    r = client.post(
        f"{BASE}/snippets/",
        json={"title": "s", "language": "python", "code": "x = 1"},
        headers=h,
    )
    assert r.status_code == 201


def test_update_rejects_oversized_code(client, db):
    # l'update doit aussi etre borne (sinon bypass via PUT).
    h = _register_and_login(client, "size3")
    u = _user(db, "size3")
    s = models.Snippet(title="s", language="python", code="x = 1", owner_id=u.id)
    db.add(s)
    db.commit()
    db.refresh(s)
    r = client.put(
        f"{BASE}/snippets/{s.id}",
        json={"code": "x" * (MAX_CODE_LEN + 1)},
        headers=h,
    )
    assert r.status_code == 422
    db.refresh(s)
    assert s.code == "x = 1"  # inchange


def test_create_rejects_oversized_title(client, db):
    # anti-bypass : un title geant est aussi rejete (pas seulement code).
    h = _register_and_login(client, "size4")
    u = _user(db, "size4")
    r = client.post(
        f"{BASE}/snippets/",
        json={"title": "x" * (MAX_TITLE_LEN + 1), "language": "python", "code": "x = 1"},
        headers=h,
    )
    assert r.status_code == 422
    assert db.query(models.Snippet).filter(models.Snippet.owner_id == u.id).count() == 0
