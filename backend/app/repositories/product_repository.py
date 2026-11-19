"""Acceso a datos de productos: solo funciones almacenadas (database/functions/02_products.sql)."""
from ..db import call_function, call_function_one


def list_products(search, limit, offset):
    return call_function("fn_product_list", search, limit, offset)


def get_by_id(product_id):
    return call_function_one("fn_product_get_by_id", product_id)


def create(name, description, price, quantity, created_by):
    return call_function_one("fn_product_create", name, description, price, quantity, created_by)


def update(product_id, name, description, price, quantity):
    return call_function_one("fn_product_update", product_id, name, description, price, quantity)


def delete(product_id):
    row = call_function_one("fn_product_delete", product_id)
    return bool(row and row["fn_product_delete"])
