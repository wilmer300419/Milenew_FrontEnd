from flask import Blueprint, current_app, g

from ..extensions import limiter
from ..services import auth_service
from ..utils.auth import clear_session_cookie, login_required, optional_login, set_session_cookie
from ..utils.responses import success
from ..utils.validation import get_json_body

auth_bp = Blueprint("auth", __name__)


def session_response(result, message, status=200):
    """Pone el token en la cookie httpOnly y (salvo en pruebas) no lo expone en el cuerpo."""
    token = result.pop("token")
    remember = result.pop("remember", False)
    if current_app.config["AUTH_TOKEN_IN_BODY"]:
        result["token"] = token
    response, code = success(result, message, status)
    set_session_cookie(response, token, remember)
    return response, code


@auth_bp.post("/register")
@limiter.limit("5 per minute")
def register():
    return session_response(auth_service.register(get_json_body()), "Usuario registrado correctamente", 201)


@auth_bp.post("/login")
@limiter.limit("10 per minute")
def login():
    result = auth_service.login(get_json_body())
    if result.get("requiresTwoFactor"):
        return success(result, "Te enviamos un código de verificación a tu correo")
    return session_response(result, "Inicio de sesión exitoso")


@auth_bp.post("/login/verify-2fa")
@limiter.limit("10 per minute")
def verify_two_factor():
    return session_response(auth_service.verify_two_factor(get_json_body()), "Inicio de sesión exitoso")


@auth_bp.post("/logout")
@optional_login
def logout():
    # Siempre borra la cookie; si la sesión era válida, además la revoca en la base
    if g.user_id:
        auth_service.logout(g.jti, g.token_exp)
    response, code = success(None, "Sesión cerrada")
    return clear_session_cookie(response), code


@auth_bp.post("/logout-all")
@login_required
def logout_all():
    auth_service.logout_everywhere(g.user_id)
    response, code = success(None, "Cerraste sesión en todos tus dispositivos")
    return clear_session_cookie(response), code


@auth_bp.post("/recovery/request")
@limiter.limit("5 per 15 minutes")
def recovery_request():
    auth_service.request_recovery(get_json_body())
    return success(None, "Si el correo existe en nuestro sistema, te enviamos un código de un solo uso.")


@auth_bp.post("/recovery/reset")
@limiter.limit("10 per 15 minutes")
def recovery_reset():
    auth_service.reset_password(get_json_body())
    return success(None, "Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.")
