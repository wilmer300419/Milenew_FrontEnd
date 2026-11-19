from flask import Blueprint, g

from ..services import auth_service, preferences_service, trip_service, user_service
from ..utils.auth import login_required
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
    user_service.change_password(g.user_id, get_json_body())
    return success(None, "Tu contraseña se actualizó correctamente")


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
