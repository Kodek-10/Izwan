"""H2 (CWE-922) : le JWT vit en cookie httpOnly, lisible par JS seulement via le
flag de présence. Vérifie dual-read (cookie OU header), logout serveur, attribut HttpOnly."""

BASE = "/api/v1"


def _register_and_login_cookie(client, username, password="password1"):
    """Login via le flow navigateur : renvoie rien, le cookie est stocké par TestClient."""
    client.post(
        f"{BASE}/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": password},
    )
    client.post(f"{BASE}/auth/login", data={"username": username, "password": password})


def _bearer_login(client, username, password="password1"):
    """Login style API/client : extrait le access_token du corps pour l'en-tête Bearer."""
    client.post(
        f"{BASE}/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": password},
    )
    r = client.post(f"{BASE}/auth/login", data={"username": username, "password": password})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_login_sets_httponly_cookie(client, db):
    _register_and_login_cookie(client, "ck1")
    # TestClient expose les cookies ; on inspecte les en-têtes Set-Cookie bruts
    # (le cookie jar ne conserve pas les attributs comme HttpOnly).
    r = client.post(f"{BASE}/auth/login", data={"username": "ck1", "password": "password1"})
    cookies = r.headers.get_list("set-cookie")
    token_cookie = next((c for c in cookies if c.startswith("token=")), None)
    session_cookie = next((c for c in cookies if c.startswith("session=")), None)
    assert token_cookie is not None and "HttpOnly" in token_cookie  # JS ne peut lire -> CWE-922 fermé
    assert session_cookie is not None and "HttpOnly" not in session_cookie  # flag lisible par JS


def test_cookie_auth_without_bearer_header(client, db):
    # Scénario navigateur : aucune requête ne met Authorization ; le cookie seul authentifie.
    _register_and_login_cookie(client, "ck2")
    # On retire explicitement tout en-tête Authorization -> seul le cookie joue.
    r = client.get(f"{BASE}/auth/me", headers={})
    assert r.status_code == 200
    assert r.json()["username"] == "ck2"


def test_logout_clears_cookie(client, db):
    _register_and_login_cookie(client, "ck3")
    assert client.get(f"{BASE}/auth/me", headers={}).status_code == 200
    r = client.post(f"{BASE}/auth/logout")
    assert r.status_code == 200
    # Cookie vidée côté serveur -> la requête suivante est 401.
    assert client.get(f"{BASE}/auth/me", headers={}).status_code == 401


def test_bearer_header_still_accepted_dual_read(client, db):
    # Back-compat clients API / tests existants : en-tête Authorization Bearer marche.
    h = _bearer_login(client, "ck4")
    r = client.get(f"{BASE}/auth/me", headers=h)
    assert r.status_code == 200
    assert r.json()["username"] == "ck4"


def test_cookie_revoked_by_password_change(client, db):
    # Composition H2+H4 : change_password incrémente token_version -> le cookie
    # (dont le JWT porte l'ancienne ver) devient invalide -> re-login requis.
    _register_and_login_cookie(client, "ck5")
    assert client.get(f"{BASE}/auth/me", headers={}).status_code == 200
    # change-password requiert le cookie courant (cookie seul OK)
    r = client.post(
        f"{BASE}/auth/change-password",
        json={"current_password": "password1", "new_password": "password2"},
        headers={},
    )
    assert r.status_code == 200
    # le cookie antérieur est révoqué (ver incohérent)
    assert client.get(f"{BASE}/auth/me", headers={}).status_code == 401
