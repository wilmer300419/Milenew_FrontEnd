import re

from flask import request

from .errors import ApiError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8
MAX_INT = 2_147_483_647  # rango de INTEGER en PostgreSQL


def get_json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("El cuerpo debe ser un objeto JSON", 400)
    return data


def get_str(data, key):
    value = data.get(key)
    return value if isinstance(value, str) else ""


def is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def password_error(password):
    if len(password) < MIN_PASSWORD_LENGTH:
        return f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres"
    if len(password) > 128:
        return "La contraseña no puede superar 128 caracteres"
    return None
