"""JWT: emisión, verificación y decoradores de acceso."""
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, request

from .errors import ForbiddenError, UnauthorizedError

ALGORITHM = "HS256"


def create_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "role": user["role"],
        "iat": now,
        "exp": now + timedelta(minutes=current_app.config["JWT_EXPIRES_MINUTES"]),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm=ALGORITHM)


def decode_token(token):
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("La sesión expiró, inicia sesión de nuevo") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Token inválido") from exc


def _bearer_token():
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def _set_user(payload):
    g.user_id = int(payload["sub"])
    g.user_role = payload.get("role", "user")


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _bearer_token()
        if not token:
            raise UnauthorizedError("Debes iniciar sesión")
        _set_user(decode_token(token))
        return fn(*args, **kwargs)

    return wrapper


def optional_login(fn):
    """Si llega un token válido, identifica al usuario; si no, sigue como anónimo."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.user_id = None
        g.user_role = None
        token = _bearer_token()
        if token:
            try:
                _set_user(decode_token(token))
            except UnauthorizedError:
                pass
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
