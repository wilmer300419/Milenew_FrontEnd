import os

from dotenv import load_dotenv

load_dotenv()


def _bool(name, default="false"):
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "")
    JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))
    CORS_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
    ]

    DATABASE_HOST = os.getenv("DATABASE_HOST", "localhost")
    DATABASE_PORT = int(os.getenv("DATABASE_PORT", "5432"))
    DATABASE_NAME = os.getenv("DATABASE_NAME", "milenew")
    DATABASE_USER = os.getenv("DATABASE_USER", "")
    DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "")

    RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY", "")

    TWO_FACTOR_ENABLED = _bool("TWO_FACTOR_ENABLED")
    AUTH_CODE_TTL_MINUTES = int(os.getenv("AUTH_CODE_TTL_MINUTES", "10"))
    AUTH_CODE_MAX_ATTEMPTS = int(os.getenv("AUTH_CODE_MAX_ATTEMPTS", "5"))

    MAIL_SERVER = os.getenv("MAIL_SERVER", "")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = _bool("MAIL_USE_TLS", "true")
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM = os.getenv("MAIL_FROM", "Milenew <no-reply@milenew.local>")

    SIMULATION_SECONDS_PER_STOP = float(os.getenv("SIMULATION_SECONDS_PER_STOP", "20"))

    # ---- Sesión en cookie httpOnly (JavaScript no puede leer el token)
    SESSION_COOKIE_NAME_APP = os.getenv("AUTH_COOKIE_NAME", "milenew_session")
    AUTH_COOKIE_SECURE = _bool("AUTH_COOKIE_SECURE")          # true en producción (HTTPS)
    AUTH_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "Lax")  # None si el front está en otro dominio
    REMEMBER_DAYS = int(os.getenv("REMEMBER_DAYS", "30"))
    # Devolver el token también en el cuerpo (solo para clientes que no son navegador / pruebas)
    AUTH_TOKEN_IN_BODY = _bool("AUTH_TOKEN_IN_BODY")

    # ---- Límite de intentos (fuerza bruta)
    RATELIMIT_ENABLED = _bool("RATELIMIT_ENABLED", "true")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_HEADERS_ENABLED = True
    # Detrás de nginx/proxy: confiar en X-Forwarded-For para saber la IP real
    TRUST_PROXY = _bool("TRUST_PROXY")

    # ---- Pool de conexiones a PostgreSQL
    DB_POOL_ENABLED = _bool("DB_POOL_ENABLED", "true")
    DB_POOL_MIN = int(os.getenv("DB_POOL_MIN", "1"))
    DB_POOL_MAX = int(os.getenv("DB_POOL_MAX", "10"))
    DB_POOL_TIMEOUT = float(os.getenv("DB_POOL_TIMEOUT", "5"))
