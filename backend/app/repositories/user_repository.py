"""Usuarios: solo funciones almacenadas (database/functions/01_users.sql)."""
from ..db import call_function_one


def create(name, email, password_hash, role="user", accepted_terms=False):
    return call_function_one("fn_user_create", name, email, password_hash, role, accepted_terms)


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


def revoke_session(jti, expires_at):
    call_function_one("fn_session_revoke", jti, expires_at)


def bump_token_version(user_id):
    return call_function_one("fn_user_bump_token_version", user_id)["fn_user_bump_token_version"]


def delete(user_id):
    row = call_function_one("fn_user_delete", user_id)
    return bool(row and row["fn_user_delete"])
