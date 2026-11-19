from flask import Blueprint, g

from ..services import auth_service
from ..utils.auth import login_required
from ..utils.responses import success
from ..utils.validation import get_json_body

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    return success(auth_service.register(get_json_body()), "Usuario registrado correctamente", 201)


@auth_bp.post("/login")
def login():
    result = auth_service.login(get_json_body())
    if result.get("requiresTwoFactor"):
        return success(result, "Te enviamos un código de verificación a tu correo")
    return success(result, "Inicio de sesión exitoso")


@auth_bp.post("/login/verify-2fa")
def verify_two_factor():
    return success(auth_service.verify_two_factor(get_json_body()), "Inicio de sesión exitoso")


@auth_bp.post("/logout")
@login_required
def logout():
    # JWT es stateless: el FrontEnd borra el token. Se mantiene por contrato.
    return success(None, "Sesión cerrada")


@auth_bp.get("/me")
@login_required
def me():
    return success(auth_service.get_profile(g.user_id), "Usuario autenticado")


@auth_bp.post("/recovery/request")
def recovery_request():
    auth_service.request_recovery(get_json_body())
    return success(None, "Si el correo existe en nuestro sistema, te enviamos un código de un solo uso.")


@auth_bp.post("/recovery/reset")
def recovery_reset():
    auth_service.reset_password(get_json_body())
    return success(None, "Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.")
