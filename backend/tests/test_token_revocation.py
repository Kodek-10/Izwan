from backend.app.core import security

BASE = "/api/v1"


def _register_and_login(client, username, password="password1"):
    client.post(
        f"{BASE}/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": password},
    )
    r = client.post(f"{BASE}/auth/login", data={"username": username, "password": password})
    return r.json()["access_token"]


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def _me(client, token):
    return client.get(f"{BASE}/auth/me", headers=_auth_header(token))


def test_change_password_revokes_old_token(client):
    # Scénario CWE-613 : token volé reste valide 24h. Apres change-password,
    # token_version est incrémentée -> le token antérieur (volé ou non) est révoqué.
    t1 = _register_and_login(client, "rev1", "password1")
    assert _me(client, t1).status_code == 200  # token valide avant

    r = client.post(
        f"{BASE}/auth/change-password",
        json={"current_password": "password1", "new_password": "password2"},
        headers=_auth_header(t1),
    )
    assert r.status_code == 200

    assert _me(client, t1).status_code == 401  # le token t1 n'est plus valide


def test_new_login_works_after_password_change(client):
    # Apres change-password, un fresh login émet un token valide (ver = nouvelle version).
    t1 = _register_and_login(client, "rev2", "password1")
    client.post(
        f"{BASE}/auth/change-password",
        json={"current_password": "password1", "new_password": "password2"},
        headers=_auth_header(t1),
    )
    t2 = client.post(f"{BASE}/auth/login", data={"username": "rev2", "password": "password2"}).json()["access_token"]
    assert _me(client, t2).status_code == 200  # nouveau token OK


def test_token_missing_ver_claim_rejected(client):
    # Token antérieur au fix (sans claim `ver`) -> rejeté (forward-compat / révoqué au déploiement).
    _register_and_login(client, "rev3", "password1")
    stale = security.create_access_token(data={"sub": "rev3", "role": "USER"})  # pas de `ver`
    assert _me(client, stale).status_code == 401


def test_token_with_wrong_ver_rejected(client):
    # Forge un token avec un `ver` incohérent avec la DB -> rejeté (anti-rejeu).
    _register_and_login(client, "rev4", "password1")  # token_version = 0 en DB
    forged = security.create_access_token(data={"sub": "rev4", "role": "USER", "ver": 999})
    assert _me(client, forged).status_code == 401
