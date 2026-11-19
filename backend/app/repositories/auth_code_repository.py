"""Códigos 2FA / recuperación: database/functions/02_auth_codes.sql."""
from ..db import call_function_one


def create(user_id, purpose, code_hash, ttl_minutes):
    row = call_function_one("fn_auth_code_create", user_id, purpose, code_hash, ttl_minutes)
    return row["fn_auth_code_create"]


def get_active(user_id, purpose):
    return call_function_one("fn_auth_code_get_active", user_id, purpose)


def register_failure(code_id):
    row = call_function_one("fn_auth_code_register_failure", code_id)
    return row["fn_auth_code_register_failure"]


def consume(code_id):
    row = call_function_one("fn_auth_code_consume", code_id)
    return bool(row and row["fn_auth_code_consume"])


def reset_password_with_code(user_id, code_id, password_hash):
    row = call_function_one("fn_user_reset_password_with_code", user_id, code_id, password_hash)
    return bool(row and row["fn_user_reset_password_with_code"])
