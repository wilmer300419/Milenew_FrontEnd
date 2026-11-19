"""Formato estándar de respuestas (contrato FrontEnd <-> BackEnd).

Éxito:  {"success": true,  "message": "...", "data": ..., "meta": {...}?}
Error:  {"success": false, "message": "...", "errors": {...}?}

Las claves se envían en camelCase (como las usa React): is_express_stop -> isExpressStop.
"""
from datetime import date, datetime
from decimal import Decimal

from flask import jsonify


def to_camel(key):
    if not isinstance(key, str) or "_" not in key:
        return key
    head, *rest = key.split("_")
    return head + "".join(part[:1].upper() + part[1:] for part in rest)


def serialize(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {to_camel(k): serialize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [serialize(v) for v in value]
    return value


def success(data=None, message="OK", status=200, meta=None):
    body = {"success": True, "message": message, "data": serialize(data)}
    if meta is not None:
        body["meta"] = serialize(meta)
    return jsonify(body), status


def error(message, status=400, errors=None):
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return jsonify(body), status
