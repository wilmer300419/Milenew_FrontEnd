"""Turnos, reportes y avisos del operador: database/functions/11_driver_ops.sql."""
from psycopg.types.json import Jsonb

from ..db import call_function, call_function_one


def get_open_shift(driver_id):
    return call_function_one("fn_shift_get_open", driver_id)


def get_last_shift(driver_id):
    return call_function_one("fn_shift_get_last", driver_id)


def start_shift(driver_id, vehicle_code, route_code):
    return call_function_one("fn_shift_start", driver_id, vehicle_code, route_code)


def set_break(driver_id, active):
    return call_function_one("fn_shift_set_break", driver_id, active)


def end_shift(driver_id, summary):
    return call_function_one("fn_shift_end", driver_id, Jsonb(summary))


def create_report(driver_id, category, description, priority, route_code, vehicle_code, location):
    return call_function_one("fn_driver_report_create", driver_id, category, description, priority,
                             route_code, vehicle_code, location)


def list_reports(driver_id):
    return call_function("fn_driver_report_list", driver_id)


def list_notices(user_id):
    return call_function("fn_driver_notice_list", user_id)


def ack_notice(notice_id, user_id):
    return call_function_one("fn_notice_ack", notice_id, user_id)["fn_notice_ack"]
