import logging

import psycopg
from psycopg_pool import PoolTimeout
from psycopg import errors as pg_errors
from werkzeug.exceptions import HTTPException

from .responses import error

logger = logging.getLogger(__name__)


class ApiError(Exception):
    """Error controlado que se convierte en respuesta JSON."""

    def __init__(self, message, status=400, errors=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.errors = errors


class ValidationError(ApiError):
    def __init__(self, errors, message="Datos inválidos"):
        super().__init__(message, 400, errors)


class NotFoundError(ApiError):
    def __init__(self, message="Recurso no encontrado"):
        super().__init__(message, 404)


class UnauthorizedError(ApiError):
    def __init__(self, message="No autorizado"):
        super().__init__(message, 401)


class ForbiddenError(ApiError):
    def __init__(self, message="No tienes permisos para esta acción"):
        super().__init__(message, 403)


class ConflictError(ApiError):
    def __init__(self, message="El recurso ya existe"):
        super().__init__(message, 409)


HTTP_MESSAGES = {
    400: "Solicitud inválida",
    404: "Recurso no encontrado",
    405: "Método no permitido",
    415: "El cuerpo debe ser JSON (Content-Type: application/json)",
}


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(exc):
        return error(exc.message, exc.status, exc.errors)

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        return error(HTTP_MESSAGES.get(exc.code, exc.name), exc.code)

    @app.errorhandler(pg_errors.UniqueViolation)
    def handle_unique(exc):
        return error("El registro ya existe", 409)

    @app.errorhandler(pg_errors.ForeignKeyViolation)
    def handle_fk(exc):
        return error("Uno de los datos enviados hace referencia a algo que no existe", 400)

    @app.errorhandler(pg_errors.CheckViolation)
    def handle_check(exc):
        return error("Los datos no cumplen las restricciones", 400)

    @app.errorhandler(429)
    def handle_rate_limit(exc):
        return error("Demasiados intentos. Espera un momento y vuelve a intentarlo.", 429)

    @app.errorhandler(PoolTimeout)
    def handle_pool_timeout(exc):
        logger.exception("Sin conexiones disponibles a la base de datos")
        return error("Servicio de base de datos no disponible", 503)

    @app.errorhandler(psycopg.OperationalError)
    def handle_db_down(exc):
        logger.exception("No se pudo conectar a la base de datos")
        return error("Servicio de base de datos no disponible", 503)

    @app.errorhandler(Exception)
    def handle_unexpected(exc):
        # Nunca se envían detalles internos (SQL, trazas) al FrontEnd.
        logger.exception("Error no controlado")
        return error("Error interno del servidor", 500)
