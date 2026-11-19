from flask import Blueprint

from ..db import call_function_one
from ..utils.responses import error, success

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    """Comprueba que la API está arriba y que puede hablar con PostgreSQL."""
    try:
        call_function_one("version")
        return success({"api": "ok", "database": "ok"}, "Servicio operativo")
    except Exception:
        return error("La API está arriba pero no hay conexión con la base de datos", 503)
