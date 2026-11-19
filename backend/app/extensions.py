"""Extensiones compartidas (se inicializan en create_app)."""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Sin límites globales: se aplican por ruta (login, registro, recuperación…)
limiter = Limiter(key_func=get_remote_address, default_limits=[])
