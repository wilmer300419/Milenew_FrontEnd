"""Validación de Google reCAPTCHA v2 en el servidor."""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from flask import current_app, request

from .errors import ApiError

logger = logging.getLogger(__name__)
VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


def verify_captcha(token):
    secret = current_app.config.get("RECAPTCHA_SECRET_KEY")
    if not secret:
        current_app.logger.warning("RECAPTCHA_SECRET_KEY vacío: el captcha NO se está validando (solo desarrollo)")
        return

    if not isinstance(token, str) or not token:
        raise ApiError('Debes completar la verificación "No soy un robot"', 400)

    payload = urllib.parse.urlencode(
        {"secret": secret, "response": token, "remoteip": request.remote_addr or ""}
    ).encode()
    try:
        with urllib.request.urlopen(VERIFY_URL, data=payload, timeout=5) as resp:
            result = json.loads(resp.read().decode())
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        logger.exception("No se pudo contactar a Google reCAPTCHA")
        raise ApiError("No se pudo verificar el captcha. Inténtalo de nuevo.", 503) from exc

    if not result.get("success"):
        raise ApiError("No se pudo verificar que eres humano. Inténtalo de nuevo.", 400)
