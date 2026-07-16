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


def _create_snippet(db, owner_id, collection_id):
    s = models.Snippet(title="s", language="python", code="x=1", owner_id=owner_id, collection_id=collection_id)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def test_delete_collection_nullifies_snippets(client, db):
    # Alice supprime sa collection : ses snippets survivent, collection_id -> None (pas d'orphelin).
    h = _register_and_login(client, "dca1")
    alice = _user(db, "dca1")
    col = _create_collection(db, alice.id, "Col")
    s1 = _create_snippet(db, alice.id, col.id)
    s2 = _create_snippet(db, alice.id, col.id)
    r = client.delete(f"{BASE}/collections/{col.id}", headers=h)
    assert r.status_code == 200
    db.refresh(s1)
    db.refresh(s2)
    assert s1.collection_id is None
    assert s2.collection_id is None
    assert db.query(models.Collection).filter(models.Collection.id == col.id).count() == 0


def test_delete_collection_isolated_per_owner(client, db):
    # La suppression d'une collection d'Alice n'affecte pas les snippets de Bob.
    _register_and_login(client, "dca2a")
    alice = _user(db, "dca2a")
    alice_col = _create_collection(db, alice.id, "AliceCol")
    alice_s = _create_snippet(db, alice.id, alice_col.id)

    bob_h = _register_and_login(client, "dca2b")
    bob = _user(db, "dca2b")
    bob_col = _create_collection(db, bob.id, "BobCol")
    bob_s = _create_snippet(db, bob.id, bob_col.id)

    r = client.delete(f"{BASE}/collections/{alice_col.id}", headers=(_register_and_login(client, "dca2a")))
    assert r.status_code == 200
    db.refresh(bob_s)
    assert bob_s.collection_id == bob_col.id  # inchangé pour Bob
    db.refresh(alice_s)
    assert alice_s.collection_id is None  # Alice détachée


def test_delete_empty_collection_succeeds(client, db):
    # DELETE d'une collection sans snippet -> succès (la requête update ne casse pas le cas vide).
    h = _register_and_login(client, "dca3")
    alice = _user(db, "dca3")
    col = _create_collection(db, alice.id, "Empty")
    r = client.delete(f"{BASE}/collections/{col.id}", headers=h)
    assert r.status_code == 200
    assert db.query(models.Collection).filter(models.Collection.id == col.id).count() == 0


def test_delete_collection_not_found(client, db):
    # 404 préservé (owner-filter + existence).
    h = _register_and_login(client, "dca4")
    r = client.delete(f"{BASE}/collections/99999", headers=h)
    assert r.status_code == 404
