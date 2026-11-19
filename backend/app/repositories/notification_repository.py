"""Notificaciones: database/functions/06_notifications.sql."""
from ..db import call_function, call_function_one


def list_for(user_id, limit=20):
    return call_function("fn_notification_list", user_id, limit)


def mark_read(user_id, notification_id):
    row = call_function_one("fn_notification_mark_read", user_id, notification_id)
    return bool(row and row["fn_notification_mark_read"])


def mark_all_read(user_id):
    return call_function_one("fn_notification_mark_all_read", user_id)["fn_notification_mark_all_read"]


def unread_count(user_id):
    return call_function_one("fn_notification_unread_count", user_id)["fn_notification_unread_count"]
