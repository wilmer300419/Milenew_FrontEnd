from ..repositories import preferences_repository
from ..utils.errors import ValidationError

THEMES = ("dark", "light")


def _public(row):
    return {"theme": row["theme"], "notify_arrivals": row["notify_arrivals"], "notify_news": row["notify_news"]}


def get_preferences(user_id):
    return _public(preferences_repository.get(user_id))


def update_preferences(user_id, data):
    errors = {}
    theme = data.get("theme")
    if theme is not None and theme not in THEMES:
        errors["theme"] = "Tema inválido (dark o light)"
    flags = {}
    for key in ("notifyArrivals", "notifyNews"):
        value = data.get(key)
        if value is not None and not isinstance(value, bool):
            errors[key] = "Debe ser true o false"
        flags[key] = value
    if errors:
        raise ValidationError(errors)
    if theme is None and all(v is None for v in flags.values()):
        raise ValidationError({"body": "No se envió ninguna preferencia"})
    row = preferences_repository.update(user_id, theme, flags["notifyArrivals"], flags["notifyNews"])
    return _public(row)
