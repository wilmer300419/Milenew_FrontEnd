"""Preferencias del usuario: database/functions/09_preferences.sql."""
from ..db import call_function_one


def get(user_id):
    return call_function_one("fn_preferences_get", user_id)


def update(user_id, theme, notify_arrivals, notify_news):
    return call_function_one("fn_preferences_update", user_id, theme, notify_arrivals, notify_news)
