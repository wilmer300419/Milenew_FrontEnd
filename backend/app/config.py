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
