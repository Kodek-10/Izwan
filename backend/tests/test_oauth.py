"""Durcissement OAuth (Google/GitHub) : validation du redirect_uri (anti-exfiltration
du JWT), jeton anti-CSRF `state`, et refus de consentement propre (pas de 422).
Ces tests restent hors-réseau : ils s'arrêtent avant tout échange de code avec le provider."""
import pytest
from backend.app.api import auth as authmod

BASE = "/api/v1"


# --- Helpers purs -----------------------------------------------------------

def test_is_safe_vscode_redirect():
    assert authmod._is_safe_vscode_redirect("vscode://kodek10.izwan-vscode/cb")
    assert authmod._is_safe_vscode_redirect("vscode-insiders://kodek10.izwan-vscode/cb")
    # Tout http(s) externe (ou schéma exotique) est refusé -> pas de fuite du token.
    assert not authmod._is_safe_vscode_redirect("https://evil.example/cb")
    assert not authmod._is_safe_vscode_redirect("http://localhost/cb")
    assert not authmod._is_safe_vscode_redirect("javascript:alert(1)")
    assert not authmod._is_safe_vscode_redirect("")
    assert not authmod._is_safe_vscode_redirect(None)


def test_encode_state_roundtrip_keeps_only_safe_vscode_context():
    # redirect_uri vscode: -> le contexte VSCode est conservé.
    ok = authmod._decode_state(authmod._encode_state("csrf-1", "vscode://ext/cb", "st"))
    assert ok["csrf"] == "csrf-1"
    assert authmod._vscode_from_state(ok) == ok
    assert ok["redirect_uri"] == "vscode://ext/cb"

    # redirect_uri http externe -> contexte VSCode ignoré, seul le csrf survit.
    bad = authmod._decode_state(authmod._encode_state("csrf-2", "https://evil.example/cb", "st"))
    assert bad["csrf"] == "csrf-2"
    assert "redirect_uri" not in bad
    assert authmod._vscode_from_state(bad) is None


def test_decode_state_tolerates_garbage():
    assert authmod._decode_state(None) == {}
    assert authmod._decode_state("not-base64!!") == {}


# --- Endpoints --------------------------------------------------------------

@pytest.fixture
def configured(monkeypatch):
    """Simule des providers OAuth configurés (sans vraies clés)."""
    monkeypatch.setattr(authmod, "GITHUB_CLIENT_ID", "gh-id")
    monkeypatch.setattr(authmod, "GITHUB_CLIENT_SECRET", "gh-secret")
    monkeypatch.setattr(authmod, "GOOGLE_CLIENT_ID", "gg-id")
    monkeypatch.setattr(authmod, "GOOGLE_CLIENT_SECRET", "gg-secret")


@pytest.mark.parametrize("provider,authorize_host", [
    ("github", "https://github.com/login/oauth/authorize"),
    ("google", "https://accounts.google.com/o/oauth2/v2/auth"),
])
def test_login_sets_state_cookie_and_redirects(client, configured, provider, authorize_host):
    r = client.get(f"{BASE}/auth/{provider}", follow_redirects=False)
    assert r.status_code in (302, 307)
    assert r.headers["location"].startswith(authorize_host)
    assert "state=" in r.headers["location"]
    # Le jeton anti-CSRF est posé en cookie httpOnly côté backend.
    assert "oauth_state" in r.headers.get("set-cookie", "")


@pytest.mark.parametrize("provider", ["github", "google"])
def test_callback_without_code_redirects_to_error(client, configured, provider):
    # Refus de consentement : le provider revient avec ?error=... et sans code.
    r = client.get(f"{BASE}/auth/{provider}/callback", params={"error": "access_denied"},
                   follow_redirects=False)
    assert r.status_code in (302, 307)
    assert r.headers["location"] == authmod.OAUTH_ERROR_URL


@pytest.mark.parametrize("provider", ["github", "google"])
def test_callback_rejects_state_without_matching_cookie(client, configured, provider):
    # `code` présent mais aucun cookie oauth_state -> anti-CSRF -> erreur,
    # AVANT tout échange réseau avec le provider.
    r = client.get(f"{BASE}/auth/{provider}/callback",
                   params={"code": "abc", "state": authmod._encode_state("attacker")},
                   follow_redirects=False)
    assert r.status_code in (302, 307)
    assert r.headers["location"] == authmod.OAUTH_ERROR_URL


@pytest.mark.parametrize("provider", ["github", "google"])
def test_login_unconfigured_returns_501(client, monkeypatch, provider):
    # Sans clés en environnement, l'endpoint renvoie une erreur explicite (501), pas un crash.
    monkeypatch.setattr(authmod, f"{provider.upper()}_CLIENT_ID", "")
    monkeypatch.setattr(authmod, f"{provider.upper()}_CLIENT_SECRET", "")
    r = client.get(f"{BASE}/auth/{provider}", follow_redirects=False)
    assert r.status_code == 501
