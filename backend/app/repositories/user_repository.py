"""Usuarios: solo funciones almacenadas (database/functions/01_users.sql)."""
from ..db import call_function_one


def create(name, email, password_hash, role="user"):
    return call_function_one("fn_user_create", name, email, password_hash, role)


def get_auth_by_email(email):
    return call_function_one("fn_user_get_auth_by_email", email)


def get_auth_by_id(user_id):
    return call_function_one("fn_user_get_auth_by_id", user_id)


def get_by_id(user_id):
    return call_function_one("fn_user_get_by_id", user_id)


def update_profile(user_id, name, email):
    return call_function_one("fn_user_update_profile", user_id, name, email)


def update_password(user_id, password_hash):
    row = call_function_one("fn_user_update_password", user_id, password_hash)
    return bool(row and row["fn_user_update_password"])
