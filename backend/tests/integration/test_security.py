"""Sesión en cookie httpOnly, CSRF, revocación, cuenta y pool de conexiones."""
from app import create_app

from .conftest import TEST_DB, TEST_ROLE, TEST_ROLE_PASSWORD, auth, register

XHR = {"X-Requested-With": "XMLHttpRequest"}


def _login(browser, email="ana@example.com", password="secreta123", **extra):
    res = browser.post("/api/auth/login", json={"email": email, "password": password, **extra})
    assert res.status_code == 200, res.get_json()
    return res


def test_session_cookie_is_httponly_and_not_in_body(app, browser, passenger):
    app.config["AUTH_TOKEN_IN_BODY"] = False
    res = _login(browser)
    cookie = res.headers["Set-Cookie"]
    assert "milenew_session=" in cookie and "HttpOnly" in cookie and "Path=/api" in cookie
    assert "Max-Age" not in cookie  # sin "recordarme": se borra al cerrar el navegador
    assert "token" not in res.get_json()["data"]
    assert browser.get("/api/auth/me").get_json()["data"]["email"] == "ana@example.com"

    remembered = _login(browser, rememberMe=True).headers["Set-Cookie"]
    assert "Max-Age=2592000" in remembered


def test_csrf_header_required_with_cookie(browser, passenger):
    _login(browser)
    assert browser.post("/api/wallet/recharge", json={"amount": 5000}).status_code == 403
    assert browser.post("/api/wallet/recharge", json={"amount": 5000}, headers=XHR).status_code == 200


def test_logout_revokes_the_token(client, passenger):
    token = passenger["token"]
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 200
    assert client.post("/api/auth/logout", headers=auth(token)).status_code == 200
    res = client.get("/api/auth/me", headers=auth(token))
    assert res.status_code == 401 and "sesión se cerró" in res.get_json()["message"]


def test_logout_clears_cookie_even_without_session(browser):
    res = browser.post("/api/auth/logout", headers=XHR)
    assert res.status_code == 200 and "milenew_session=;" in res.headers["Set-Cookie"]


def test_logout_everywhere(client, passenger):
    other = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "secreta123"}).get_json()["data"]
    assert client.post("/api/auth/logout-all", headers=auth(other["token"])).status_code == 200
    for token in (passenger["token"], other["token"]):
        assert client.get("/api/auth/me", headers=auth(token)).status_code == 401


def test_password_change_closes_other_sessions_but_not_this_one(browser, client, passenger):
    _login(browser)
    res = browser.put("/api/users/me/password", headers=XHR,
                      json={"currentPassword": "secreta123", "newPassword": "nuevaClave99"})
    assert res.status_code == 200 and "milenew_session=" in res.headers["Set-Cookie"]
    assert browser.get("/api/auth/me").status_code == 200          # esta sesión sigue
    assert client.get("/api/auth/me", headers=auth(passenger["token"])).status_code == 401  # las otras no


def test_recovery_closes_sessions(client, passenger, outbox):
    client.post("/api/auth/recovery/request", json={"email": "ana@example.com"})
    client.post("/api/auth/recovery/reset",
                json={"email": "ana@example.com", "code": outbox[0]["code"], "newPassword": "nuevaClave99"})
    assert client.get("/api/auth/me", headers=auth(passenger["token"])).status_code == 401


def test_delete_account(client, passenger):
    h = auth(passenger["token"])
    client.post("/api/wallet/recharge", json={"amount": 5000}, headers=h)
    client.post("/api/transit/incidents", json={"category": "Seguridad"}, headers=h)
    bad = client.delete("/api/users/me", json={"password": "otra-clave"}, headers=h)
    assert bad.status_code == 400
    assert client.delete("/api/users/me", json={"password": "secreta123"}, headers=h).status_code == 200
    assert client.get("/api/auth/me", headers=h).status_code == 401
    assert client.post("/api/auth/login", json={"email": "ana@example.com", "password": "secreta123"}).status_code == 401
    register(client)  # el correo queda libre


def test_connection_pool(database):
    from tests.integration.conftest import ADMIN_URL
    from psycopg.conninfo import conninfo_to_dict

    admin = conninfo_to_dict(ADMIN_URL)
    app = create_app({
        "SECRET_KEY": "x" * 32, "DB_POOL_ENABLED": True, "DB_POOL_MIN": 1, "DB_POOL_MAX": 2,
        "DATABASE_HOST": admin.get("host", "localhost"), "DATABASE_PORT": int(admin.get("port", 5432)),
        "DATABASE_NAME": TEST_DB, "DATABASE_USER": TEST_ROLE, "DATABASE_PASSWORD": TEST_ROLE_PASSWORD,
    })
    try:
        client = app.test_client()
        for _ in range(5):  # más peticiones que conexiones: el pool las reutiliza
            assert client.get("/api/transit/stations").status_code == 200
        assert app.extensions["db_pool"].get_stats()["pool_max"] == 2
    finally:
        app.extensions["db_pool"].close()
