"""Sesiones: JWT dentro de una cookie httpOnly, revocables desde la base de datos.

- El navegador guarda el token en una cookie que JavaScript NO puede leer
  (protege contra robo de sesión por XSS).
- Peticiones que modifican datos con cookie deben traer `X-Requested-With`
  (un formulario de otro sitio no puede enviarlo → protección CSRF).
- Cada token lleva un `jti` (para cerrar UNA sesión) y la `ver`sión del usuario
  (subirla cierra TODAS sus sesiones: cambio de contraseña, "cerrar en todos lados").
- Clientes que no son navegador pueden usar `Authorization: Bearer <token>`.
"""
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, request

from ..db import call_function_one
from .errors import ForbiddenError, UnauthorizedError

ALGORITHM = "HS256"
SAFE_METHODS = ("GET", "HEAD", "OPTIONS")


def _cookie_name():
    return current_app.config["SESSION_COOKIE_NAME_APP"]


def create_token(user, remember=False):
    now = datetime.now(timezone.utc)
    minutes = current_app.config["JWT_EXPIRES_MINUTES"]
    lifetime = timedelta(days=current_app.config["REMEMBER_DAYS"]) if remember else timedelta(minutes=minutes)
    payload = {
        "sub": str(user["id"]),
        "role": user["role"],
        "ver": user.get("token_version", 0),
        "jti": uuid.uuid4().hex,
        "iat": now,
        "exp": now + lifetime,
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm=ALGORITHM)


def set_session_cookie(response, token, remember=False):
    cfg = current_app.config
    response.set_cookie(
        _cookie_name(),
        token,
        max_age=cfg["REMEMBER_DAYS"] * 86400 if remember else None,  # sin max_age = se borra al cerrar el navegador
        httponly=True,
        secure=cfg["AUTH_COOKIE_SECURE"],
        samesite=cfg["AUTH_COOKIE_SAMESITE"],
        path="/api",
    )
    return response


def clear_session_cookie(response):
    cfg = current_app.config
    response.delete_cookie(
        _cookie_name(), path="/api", secure=cfg["AUTH_COOKIE_SECURE"], samesite=cfg["AUTH_COOKIE_SAMESITE"]
    )
    return response


def decode_token(token):
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("La sesión expiró, inicia sesión de nuevo") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Token inválido") from exc


def _read_token():
    """(token, viene_de_cookie) o (None, False)."""
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() == "bearer" and token.strip():
        return token.strip(), False
    cookie = request.cookies.get(_cookie_name())
    return (cookie, True) if cookie else (None, False)


def _authenticate():
    token, from_cookie = _read_token()
    if not token:
        raise UnauthorizedError("Debes iniciar sesión")
    if from_cookie and request.method not in SAFE_METHODS and request.headers.get("X-Requested-With") != "XMLHttpRequest":
        raise ForbiddenError("Solicitud rechazada por seguridad (CSRF)")
    payload = decode_token(token)
    user_id = int(payload["sub"])
    row = call_function_one("fn_session_check", user_id, payload.get("jti", ""), payload.get("ver", 0))
    if not (row and row["fn_session_check"]):
        raise UnauthorizedError("Tu sesión se cerró. Inicia sesión de nuevo.")
    g.user_id = user_id
    g.user_role = payload.get("role", "user")
    g.jti = payload.get("jti")
    g.token_exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        _authenticate()
        return fn(*args, **kwargs)

    return wrapper


def optional_login(fn):
    """Si llega una sesión válida, identifica al usuario; si no, sigue como anónimo."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.user_id = None
        g.user_role = None
        try:
            _authenticate()
        except (UnauthorizedError, ForbiddenError):
            g.user_id = None
            g.user_role = None
        return fn(*args, **kwargs)

    return wrapper


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @login_required
        def wrapper(*args, **kwargs):
            if g.user_role not in roles:
                raise ForbiddenError()
            return fn(*args, **kwargs)

        return wrapper

    return decorator
