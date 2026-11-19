import pytest

from app import create_app

TEST_SECRET = "test-secret-key-0123456789abcdef0123456789"


@pytest.fixture
def unit_app():
    """App sin base de datos (para tests unitarios)."""
    return create_app({
        "TESTING": True, "SECRET_KEY": TEST_SECRET, "RECAPTCHA_SECRET_KEY": "",
        "DATABASE_HOST": "127.0.0.1", "DATABASE_PORT": 1,
        "DB_POOL_ENABLED": False, "RATELIMIT_ENABLED": False, "AUTH_TOKEN_IN_BODY": True,
    })
