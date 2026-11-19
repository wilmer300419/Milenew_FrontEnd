"""Tests de integración contra PostgreSQL REAL.

Se activan definiendo TEST_DATABASE_ADMIN_URL (usuario con permiso para crear bases y roles):

    TEST_DATABASE_ADMIN_URL=postgresql://postgres:postgres@localhost:5432/postgres pytest -v

Crean una base temporal `milenew_test`, cargan database/ (en el orden de scripts/01_init.sql),
crean un rol de mínimos privilegios con scripts/02_app_role.sql y la app se conecta con ESE rol.
Al terminar borran la base y el rol. La base `milenew` no se toca.
"""
import os
import re
from pathlib import Path

import psycopg
import pytest
from psycopg.conninfo import conninfo_to_dict

from app import create_app
from app.services import auth_service
from tests.conftest import TEST_SECRET

ADMIN_URL = os.getenv("TEST_DATABASE_ADMIN_URL")
DB_DIR = Path(__file__).resolve().parents[3] / "database"
TEST_DB = "milenew_test"
TEST_ROLE = "milenew_test_app"
TEST_ROLE_PASSWORD = "milenew_test_pw"

pytestmark = pytest.mark.skipif(not ADMIN_URL, reason="TEST_DATABASE_ADMIN_URL no definida")


def _sql_files():
    """Archivos en el orden de scripts/01_init.sql (\\ir = relativo a scripts/)."""
    master = (DB_DIR / "scripts" / "01_init.sql").read_text(encoding="utf-8")
    return [(DB_DIR / "scripts" / rel).resolve() for rel in re.findall(r"^\\ir\s+(\S+)", master, flags=re.M)]


@pytest.fixture(scope="session")
def database():
    if not ADMIN_URL:
        pytest.skip("TEST_DATABASE_ADMIN_URL no definida")

    with psycopg.connect(ADMIN_URL, autocommit=True) as conn:
        conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
        conn.execute(f"CREATE DATABASE {TEST_DB}")

    with psycopg.connect(ADMIN_URL, dbname=TEST_DB) as conn:
        for path in _sql_files():
            conn.execute(path.read_text(encoding="utf-8"))
        role_sql = (DB_DIR / "scripts" / "02_app_role.sql").read_text(encoding="utf-8")
        role_sql = re.sub(r"^\\set.*$", "", role_sql, flags=re.M)
        role_sql = role_sql.replace(":app_password", f"'{TEST_ROLE_PASSWORD}'").replace("milenew_app", TEST_ROLE)
        conn.execute(role_sql)
        conn.commit()

    yield

    with psycopg.connect(ADMIN_URL, autocommit=True) as conn:
        conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
        conn.execute(f"DROP ROLE IF EXISTS {TEST_ROLE}")


@pytest.fixture
def app(database):
    # Cada test empieza sin usuarios ni datos creados por otros tests.
    with psycopg.connect(ADMIN_URL, dbname=TEST_DB) as conn:
        conn.execute("DELETE FROM users")
        conn.execute("DELETE FROM incidents")
        conn.execute("DELETE FROM trips")
        conn.execute("DELETE FROM notifications WHERE user_id IS NOT NULL")
        conn.commit()

    admin = conninfo_to_dict(ADMIN_URL)
    return create_app({
        "TESTING": True,
        "SECRET_KEY": TEST_SECRET,
        "RECAPTCHA_SECRET_KEY": "",
        "TWO_FACTOR_ENABLED": False,
        "DATABASE_HOST": admin.get("host", "localhost"),
        "DATABASE_PORT": int(admin.get("port", 5432)),
        "DATABASE_NAME": TEST_DB,
        "DATABASE_USER": TEST_ROLE,
        "DATABASE_PASSWORD": TEST_ROLE_PASSWORD,
    })


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def outbox(monkeypatch):
    """Captura los correos (códigos 2FA / recuperación) en vez de enviarlos."""
    sent = []
    monkeypatch.setattr(auth_service, "send_mail", lambda to, subject, body: sent.append(
        {"to": to, "subject": subject, "body": body, "code": re.search(r"\b(\d{6})\b", body).group(1)}
    ))
    return sent


def register(client, email="ana@example.com", password="secreta123", name="Ana"):
    res = client.post("/api/auth/register", json={"name": name, "email": email, "password": password})
    assert res.status_code == 201, res.get_json()
    return res.get_json()["data"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def passenger(client):
    return register(client)


@pytest.fixture
def driver(app, client):
    result = app.test_cli_runner().invoke(args=["seed-demo-users"])
    assert result.exit_code == 0, result.output
    res = client.post("/api/auth/login", json={"email": "conductor@milenew.co", "password": "Conductor123"})
    assert res.status_code == 200, res.get_json()
    return res.get_json()["data"]


@pytest.fixture
def admin(app, client, driver):
    """Central (rol admin), creada por seed-demo-users junto al conductor."""
    res = client.post("/api/auth/login", json={"email": "central@milenew.co", "password": "Central123"})
    assert res.status_code == 200, res.get_json()
    return res.get_json()["data"]
