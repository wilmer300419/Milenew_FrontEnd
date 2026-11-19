from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, g

from ..services import auth_service, preferences_service, trip_service, user_service
from ..utils.auth import clear_session_cookie, create_token, login_required, set_session_cookie
from ..utils.responses import success
from ..utils.validation import get_json_body

users_bp = Blueprint("users", __name__)


@users_bp.get("/me")
@login_required
def get_me():
    return success(auth_service.get_profile(g.user_id), "Perfil obtenido")


@users_bp.put("/me")
@login_required
def update_me():
    return success(user_service.update_profile(g.user_id, get_json_body()), "Tus datos se actualizaron correctamente")


@users_bp.put("/me/password")
@login_required
def change_password():
    user = user_service.change_password(g.user_id, get_json_body())
    # Las demás sesiones quedan cerradas; esta continúa con un token nuevo
    remember = g.token_exp - datetime.now(timezone.utc) > timedelta(minutes=current_app.config["JWT_EXPIRES_MINUTES"])
    response, code = success(None, "Contraseña actualizada. Cerramos tus otras sesiones.")
    return set_session_cookie(response, create_token(user, remember), remember), code


@users_bp.delete("/me")
@login_required
def delete_me():
    auth_service.delete_account(g.user_id, get_json_body())
    response, code = success(None, "Tu cuenta y tus datos fueron eliminados")
    return clear_session_cookie(response), code


@users_bp.get("/me/favorites")
@login_required
def favorites():
    return success(trip_service.list_favorites(g.user_id), "Estaciones favoritas")


@users_bp.put("/me/favorites/<int:station_id>")
@login_required
def add_favorite(station_id):
    return success(trip_service.add_favorite(g.user_id, station_id), "Estación añadida a favoritas")


@users_bp.delete("/me/favorites/<int:station_id>")
@login_required
def remove_favorite(station_id):
    return success(trip_service.remove_favorite(g.user_id, station_id), "Estación retirada de favoritas")


@users_bp.get("/me/preferences")
@login_required
def get_preferences():
    return success(preferences_service.get_preferences(g.user_id), "Preferencias")


@users_bp.put("/me/preferences")
@login_required
def update_preferences():
    return success(preferences_service.update_preferences(g.user_id, get_json_body()), "Preferencias guardadas")
