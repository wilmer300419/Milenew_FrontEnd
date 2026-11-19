"""Conexión a PostgreSQL.

En producción se usa un POOL de conexiones (psycopg_pool): cada petición toma
una conexión prestada y la devuelve al terminar. Con DB_POOL_ENABLED=false se
abre una conexión por petición (útil en pruebas).

Los repositorios usan `call_function` / `call_function_one`, que solo ejecutan
funciones almacenadas fn_* definidas en database/functions.
"""
import psycopg
from flask import current_app, g
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


def _conninfo(cfg):
    return psycopg.conninfo.make_conninfo(
        host=cfg["DATABASE_HOST"],
        port=cfg["DATABASE_PORT"],
        dbname=cfg["DATABASE_NAME"],
        user=cfg["DATABASE_USER"],
        password=cfg["DATABASE_PASSWORD"],
        connect_timeout=5,
        application_name="milenew-api",
    )


def init_db(app):
    app.teardown_appcontext(close_db)
    if app.config["DB_POOL_ENABLED"]:
        app.extensions["db_pool"] = ConnectionPool(
            _conninfo(app.config),
            min_size=app.config["DB_POOL_MIN"],
            max_size=app.config["DB_POOL_MAX"],
            timeout=app.config["DB_POOL_TIMEOUT"],
            kwargs={"row_factory": dict_row},
            open=False,
            name="milenew",
        )


def _pool():
    pool = current_app.extensions.get("db_pool")
    if pool is not None and pool.closed:
        pool.open(wait=False)
    return pool


def get_db():
    if "db" not in g:
        pool = _pool()
        if pool is not None:
            g.db = pool.getconn()
            g.db_pool = pool
        else:
            g.db = psycopg.connect(_conninfo(current_app.config), row_factory=dict_row)
    return g.db


def close_db(exc=None):
    db = g.pop("db", None)
    pool = g.pop("db_pool", None)
    if db is None:
        return
    try:
        if exc is None:
            db.commit()
        else:
            db.rollback()
    finally:
        if pool is not None:
            pool.putconn(db)
        else:
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
