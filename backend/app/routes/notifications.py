from flask import Blueprint, g

from ..services import notification_service
from ..utils.auth import login_required, optional_login
from ..utils.responses import success

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("")
@optional_login
def list_notifications():
    # Anónimo: solo avisos generales. Con sesión: también los personales.
    items = notification_service.list_notifications(g.user_id)
    return success(items, "Notificaciones", meta={"unread_count": notification_service.unread_count(g.user_id)})


@notifications_bp.post("/<int:notification_id>/read")
@login_required
def mark_read(notification_id):
    notification_service.mark_read(g.user_id, notification_id)
    return success({"unread_count": notification_service.unread_count(g.user_id)}, "Aviso marcado como leído")


@notifications_bp.post("/read-all")
@login_required
def mark_all_read():
    changed = notification_service.mark_all_read(g.user_id)
    return success({"updated": changed, "unread_count": 0}, "Todos los avisos están leídos")
