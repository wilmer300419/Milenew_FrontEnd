from datetime import datetime, timezone

from ..repositories import notification_repository
from ..utils.errors import NotFoundError
from ..utils.validation import MAX_INT


def relative_time(moment, now=None):
    now = now or datetime.now(timezone.utc)
    seconds = max(0, int((now - moment).total_seconds()))
    if seconds < 60:
        return "ahora"
    if seconds < 3600:
        return f"hace {seconds // 60} min"
    if seconds < 86400:
        return f"hace {seconds // 3600} h"
    days = seconds // 86400
    return "ayer" if days == 1 else f"hace {days} días"


def list_notifications(user_id):
    rows = notification_repository.list_for(user_id)
    return [{**row, "relative_time": relative_time(row["created_at"])} for row in rows]


def unread_count(user_id):
    return notification_repository.unread_count(user_id) if user_id else 0


def mark_read(user_id, notification_id):
    if not 1 <= notification_id <= MAX_INT or not notification_repository.mark_read(user_id, notification_id):
        raise NotFoundError("Aviso no encontrado o ya leído")


def mark_all_read(user_id):
    return notification_repository.mark_all_read(user_id)
