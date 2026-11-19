from .conftest import auth, register


def test_health_uses_real_database(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["data"] == {"api": "ok", "database": "ok"}


def test_register_login_me(client):
    data = register(client, email="ANA@Example.com")
    assert data["user"] == {"id": data["user"]["id"], "name": "Ana", "email": "ana@example.com", "role": "user"}

    res = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "secreta123",
                                               "captchaToken": "x"})
    body = res.get_json()
    assert res.status_code == 200 and body["data"]["token"]
    assert "requiresTwoFactor" not in body["data"]

    me = client.get("/api/users/me", headers=auth(body["data"]["token"]))
    assert me.get_json()["data"]["email"] == "ana@example.com"


def test_register_duplicate_and_validation(client, passenger):
    assert client.post("/api/auth/register", json={"name": "B", "email": "ana@example.com", "acceptTerms": True,
                                                   "password": "secreta123"}).status_code == 409
    res = client.post("/api/auth/register", json={"name": "", "email": "x", "password": "1"})
    assert res.status_code == 400
    assert set(res.get_json()["errors"]) == {"name", "email", "password", "acceptTerms"}


def test_login_wrong_password_same_message_as_unknown_email(client, passenger):
    a = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "malamala"})
    b = client.post("/api/auth/login", json={"email": "nadie@example.com", "password": "malamala"})
    assert a.status_code == b.status_code == 401
    assert a.get_json()["message"] == b.get_json()["message"] == "Correo o contraseña incorrectos"


def test_login_two_factor_flow(app, client, passenger, outbox):
    app.config["TWO_FACTOR_ENABLED"] = True
    res = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "secreta123"})
    assert res.status_code == 200
    assert res.get_json()["data"] == {"requiresTwoFactor": True}
    assert len(outbox) == 1 and outbox[0]["to"] == "ana@example.com"

    bad = client.post("/api/auth/login/verify-2fa", json={"email": "ana@example.com", "code": "000000"
                                                          if outbox[0]["code"] != "000000" else "111111"})
    assert bad.status_code == 400

    ok = client.post("/api/auth/login/verify-2fa", json={"email": "ana@example.com", "code": outbox[0]["code"]})
    assert ok.status_code == 200
    assert ok.get_json()["data"]["user"]["email"] == "ana@example.com"

    reused = client.post("/api/auth/login/verify-2fa", json={"email": "ana@example.com", "code": outbox[0]["code"]})
    assert reused.status_code == 400


def test_two_factor_locks_after_max_attempts(app, client, passenger, outbox):
    app.config.update(TWO_FACTOR_ENABLED=True, AUTH_CODE_MAX_ATTEMPTS=3)
    client.post("/api/auth/login", json={"email": "ana@example.com", "password": "secreta123"})
    good = outbox[0]["code"]
    wrong = "123456" if good != "123456" else "654321"
    msgs = [client.post("/api/auth/login/verify-2fa", json={"email": "ana@example.com", "code": wrong})
            .get_json()["message"] for _ in range(3)]
    assert "Demasiados intentos" in msgs[-1]
    # Ni siquiera el código correcto sirve ya
    assert client.post("/api/auth/login/verify-2fa",
                       json={"email": "ana@example.com", "code": good}).status_code == 400


def test_recovery_flow(client, passenger, outbox):
    unknown = client.post("/api/auth/recovery/request", json={"email": "nadie@example.com"})
    known = client.post("/api/auth/recovery/request", json={"email": "ana@example.com"})
    assert unknown.status_code == known.status_code == 200
    assert unknown.get_json()["message"] == known.get_json()["message"]
    assert [m["to"] for m in outbox] == ["ana@example.com"]

    code = outbox[0]["code"]
    res = client.post("/api/auth/recovery/reset",
                      json={"email": "ana@example.com", "code": code, "newPassword": "nuevaClave99"})
    assert res.status_code == 200

    again = client.post("/api/auth/recovery/reset",
                        json={"email": "ana@example.com", "code": code, "newPassword": "otraClave99"})
    assert again.status_code == 400

    assert client.post("/api/auth/login", json={"email": "ana@example.com",
                                                "password": "secreta123"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "ana@example.com",
                                                "password": "nuevaClave99"}).status_code == 200


def test_update_profile_and_password(client, passenger):
    h = auth(passenger["token"])
    register(client, email="otro@example.com")

    res = client.put("/api/users/me", json={"name": "Ana María", "email": "ana.maria@example.com"}, headers=h)
    assert res.status_code == 200
    assert res.get_json()["data"]["name"] == "Ana María"
    assert client.put("/api/users/me", json={"name": "X", "email": "otro@example.com"},
                      headers=h).status_code == 409

    wrong = client.put("/api/users/me/password", json={"currentPassword": "nope-nope",
                                                       "newPassword": "nuevaClave99"}, headers=h)
    assert wrong.status_code == 400  # 400, no 401: el FrontEnd no debe cerrar la sesión
    ok = client.put("/api/users/me/password", json={"currentPassword": "secreta123",
                                                    "newPassword": "nuevaClave99"}, headers=h)
    assert ok.status_code == 200
    assert client.post("/api/auth/login", json={"email": "ana.maria@example.com",
                                                "password": "nuevaClave99"}).status_code == 200
