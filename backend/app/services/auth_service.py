from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash

from ..repositories import auth_code_repository, user_repository
from ..utils.auth import create_token
from ..utils.captcha import verify_captcha
from ..utils.codes import code_matches, generate_code, hash_code
from ..utils.errors import ApiError, ConflictError, NotFoundError, UnauthorizedError, ValidationError
from ..utils.mailer import code_email_html, send_mail
from ..utils.validation import EMAIL_RE, get_str, password_error

INVALID_CREDENTIALS = "Correo o contraseña incorrectos"
INVALID_CODE = "El código no es válido o expiró. Inténtalo de nuevo."
_dummy_hash = None


def public_user(user):
    return {k: user[k] for k in ("id", "name", "email", "role") if k in user}


def _session(user, remember=False):
    """Usuario público + token (la ruta lo pone en la cookie httpOnly)."""
    return {"user": public_user(user), "token": create_token(user, remember), "remember": remember}


def _check_password(user, password):
    """Compara siempre contra un hash (aunque el usuario no exista) para no filtrar
    por tiempo de respuesta qué correos están registrados."""
    global _dummy_hash
    if user is None:
        if _dummy_hash is None:
            _dummy_hash = generate_password_hash("dummy-password")
        check_password_hash(_dummy_hash, password)
        return False
    return check_password_hash(user["password_hash"], password)


# ---------------------------------------------------------------- registro
def register(data):
    name = get_str(data, "name").strip()
    email = get_str(data, "email").strip().lower()
    password = get_str(data, "password")

    errors = {}
    if not name:
        errors["name"] = "El nombre es obligatorio"
    elif len(name) > 100:
        errors["name"] = "El nombre no puede superar 100 caracteres"
    if not EMAIL_RE.match(email) or len(email) > 150:
        errors["email"] = "Correo electrónico inválido"
    if password_error(password):
        errors["password"] = password_error(password)
    if data.get("acceptTerms") is not True:
        errors["acceptTerms"] = "Debes aceptar la política de tratamiento de datos"
    if errors:
        raise ValidationError(errors)

    # Anti-bots también en el registro
    verify_captcha(data.get("captchaToken"))

    if user_repository.get_auth_by_email(email):
        raise ConflictError("Ya existe una cuenta con ese correo")

    user = user_repository.create(name, email, generate_password_hash(password), "user", True)
    return _session(user, remember=True)


# ---------------------------------------------------------------- login
def login(data):
    email = get_str(data, "email").strip().lower()
    password = get_str(data, "password")

    errors = {}
    if not email:
        errors["email"] = "El correo es obligatorio"
    if not password:
        errors["password"] = "La contraseña es obligatoria"
    if errors:
        raise ValidationError(errors)

    # El captcha se valida ANTES de comprobar credenciales.
    verify_captcha(data.get("captchaToken"))

    user = user_repository.get_auth_by_email(email)
    if not _check_password(user, password) or not user["is_active"]:
        raise UnauthorizedError(INVALID_CREDENTIALS)

    if current_app.config["TWO_FACTOR_ENABLED"]:
        _send_code(user, "two_factor")
        return {"requiresTwoFactor": True}

    return _session(user, remember=data.get("rememberMe") is True)


def verify_two_factor(data):
    email = get_str(data, "email").strip().lower()
    code = get_str(data, "code").strip()
    if not email or not code:
        raise ValidationError({"code": "Ingresa el código que te enviamos"})

    user = user_repository.get_auth_by_email(email)
    if not user or not user["is_active"]:
        raise ApiError(INVALID_CODE, 400)

    code_id = _check_code(user["id"], "two_factor", code)
    if not auth_code_repository.consume(code_id):
        raise ApiError(INVALID_CODE, 400)
    return _session(user, remember=data.get("rememberMe") is True)


# ---------------------------------------------------------------- recuperación
def request_recovery(data):
    email = get_str(data, "email").strip().lower()
    if not EMAIL_RE.match(email):
        raise ValidationError({"email": "Correo electrónico inválido"})

    user = user_repository.get_auth_by_email(email)
    # Respuesta idéntica exista o no el correo (no se revela quién está registrado).
    if user and user["is_active"]:
        _send_code(user, "recovery")


def reset_password(data):
    email = get_str(data, "email").strip().lower()
    code = get_str(data, "code").strip()
    new_password = get_str(data, "newPassword")

    errors = {}
    if not code:
        errors["code"] = "Ingresa el código que te enviamos"
    if password_error(new_password):
        errors["newPassword"] = password_error(new_password)
    if errors:
        raise ValidationError(errors)

    user = user_repository.get_auth_by_email(email)
    if not user or not user["is_active"]:
        raise ApiError(INVALID_CODE, 400)

    code_id = _check_code(user["id"], "recovery", code)
    if not auth_code_repository.reset_password_with_code(
        user["id"], code_id, generate_password_hash(new_password)
    ):
        raise ApiError(INVALID_CODE, 400)


# ---------------------------------------------------------------- perfil
def get_profile(user_id):
    user = user_repository.get_by_id(user_id)
    if not user:
        raise NotFoundError("Usuario no encontrado")
    return public_user(user)


# ---------------------------------------------------------------- helpers
def _send_code(user, purpose):
    cfg = current_app.config
    code = generate_code()
    auth_code_repository.create(user["id"], purpose, hash_code(code), cfg["AUTH_CODE_TTL_MINUTES"])

    if purpose == "two_factor":
        subject = "Tu código para iniciar sesión en Milenew"
        intro = "Usa este código para completar tu inicio de sesión:"
    else:
        subject = "Recupera tu cuenta de Milenew"
        intro = "Usa este código para crear una contraseña nueva:"
    minutes = cfg["AUTH_CODE_TTL_MINUTES"]
    body = (
        f"Hola {user['name']},\n\n{intro}\n\n    {code}\n\n"
        f"Vence en {minutes} minutos. Si no fuiste tú, ignora este correo."
    )
    send_mail(user["email"], subject, body, html=code_email_html(user["name"], intro, code, minutes))


def _check_code(user_id, purpose, code):
    """Devuelve el id del código si coincide; si no, suma un intento fallido
    e invalida el código al llegar al máximo."""
    active = auth_code_repository.get_active(user_id, purpose)
    if not active:
        raise ApiError(INVALID_CODE, 400)

    if not code_matches(code, active["code_hash"]):
        attempts = auth_code_repository.register_failure(active["id"])
        if attempts >= current_app.config["AUTH_CODE_MAX_ATTEMPTS"]:
            auth_code_repository.consume(active["id"])
            raise ApiError("Demasiados intentos. Solicita un código nuevo.", 400)
        raise ApiError(INVALID_CODE, 400)

    return active["id"]


# ---------------------------------------------------------------- sesiones y cuenta
def logout(jti, expires_at):
    if jti:
        user_repository.revoke_session(jti, expires_at)


def logout_everywhere(user_id):
    user_repository.bump_token_version(user_id)


def delete_account(user_id, data):
    """Derecho de supresión (Ley 1581): exige la contraseña actual."""
    password = get_str(data, "password")
    user = user_repository.get_auth_by_id(user_id)
    if not user:
        raise NotFoundError("Usuario no encontrado")
    if not password or not check_password_hash(user["password_hash"], password):
        raise ApiError("La contraseña no es correcta", 400, {"password": "Incorrecta"})
    user_repository.delete(user_id)
