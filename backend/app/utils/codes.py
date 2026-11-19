"""Códigos numéricos de un solo uso (2FA y recuperación)."""
import hashlib
import hmac
import secrets

from flask import current_app


def generate_code():
    return f"{secrets.randbelow(10**6):06d}"


def hash_code(code):
    key = current_app.config["SECRET_KEY"].encode()
    return hmac.new(key, code.strip().encode(), hashlib.sha256).hexdigest()


def code_matches(code, code_hash):
    return hmac.compare_digest(hash_code(code), code_hash)
