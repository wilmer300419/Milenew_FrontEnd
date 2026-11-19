from werkzeug.security import check_password_hash, generate_password_hash

from ..repositories import user_repository
from ..utils.errors import ApiError, ConflictError, NotFoundError, ValidationError
from ..utils.validation import EMAIL_RE, get_str, password_error
from .auth_service import public_user


def update_profile(user_id, data):
    name = get_str(data, "name").strip()
    email = get_str(data, "email").strip().lower()

    errors = {}
    if not name:
        errors["name"] = "El nombre es obligatorio"
    elif len(name) > 100:
        errors["name"] = "El nombre no puede superar 100 caracteres"
    if not EMAIL_RE.match(email) or len(email) > 150:
        errors["email"] = "Correo electrónico inválido"
    if errors:
        raise ValidationError(errors)

    other = user_repository.get_auth_by_email(email)
    if other and other["id"] != user_id:
        raise ConflictError("Ya existe una cuenta con ese correo")

    user = user_repository.update_profile(user_id, name, email)
    if not user:
        raise NotFoundError("Usuario no encontrado")
    return public_user(user)


def change_password(user_id, data):
    current = get_str(data, "currentPassword")
    new = get_str(data, "newPassword")

    if not current:
        raise ValidationError({"currentPassword": "Ingresa tu contraseña actual"})
    if password_error(new):
        raise ValidationError({"newPassword": password_error(new)})

    user = user_repository.get_auth_by_id(user_id)
    if not user or not user["is_active"]:
        raise NotFoundError("Usuario no encontrado")
    # 400 (no 401) para que el FrontEnd no cierre la sesión por un error de tipeo.
    if not check_password_hash(user["password_hash"], current):
        raise ApiError("La contraseña actual no es correcta", 400, {"currentPassword": "Incorrecta"})
    if current == new:
        raise ValidationError({"newPassword": "La contraseña nueva debe ser distinta a la actual"})

    user_repository.update_password(user_id, generate_password_hash(new))
