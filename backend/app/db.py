"""Conexión a PostgreSQL.

Se abre una conexión por petición (guardada en flask.g) y se cierra al
terminar. Los repositorios usan `call_function` / `call_function_one`, que
solo ejecutan funciones almacenadas fn_* definidas en database/functions.
"""
import psycopg
from flask import current_app, g
from psycopg.rows import dict_row


def get_db():
    if "db" not in g:
        cfg = current_app.config
        g.db = psycopg.connect(
            host=cfg["DATABASE_HOST"],
            port=cfg["DATABASE_PORT"],
            dbname=cfg["DATABASE_NAME"],
            user=cfg["DATABASE_USER"],
            password=cfg["DATABASE_PASSWORD"],
            row_factory=dict_row,
            connect_timeout=5,
        )
    return g.db


def close_db(exc=None):
    db = g.pop("db", None)
    if db is None:
        return
    try:
        if exc is None:
            db.commit()
        else:
            db.rollback()
    finally:
        db.close()


def _build_call(function_name, params):
    if not function_name.isidentifier():
        raise ValueError(f"Nombre de función inválido: {function_name}")
    placeholders = ", ".join(["%s"] * len(params))
    return f"SELECT * FROM {function_name}({placeholders})"


def call_function(function_name, *params):
    """Ejecuta una función que devuelve filas y retorna una lista de dicts."""
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(_build_call(function_name, params), params)
            rows = cur.fetchall()
        conn.commit()
        return rows
    except Exception:
        conn.rollback()
        raise


def call_function_one(function_name, *params):
    """Igual que call_function pero devuelve la primera fila o None."""
    rows = call_function(function_name, *params)
    return rows[0] if rows else None
