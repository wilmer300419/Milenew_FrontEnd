"""Central de operaciones (admin): database/functions/10_central.sql."""
from ..db import call_function, call_function_one


def summary():
    return call_function_one("fn_central_summary")


def list_incidents(status, limit=50):
    return call_function("fn_incident_list", status, limit)


def update_incident(incident_id, status, note, admin_id):
    return call_function_one("fn_incident_update", incident_id, status, note, admin_id)


def conversations():
    return call_function("fn_chat_conversations")


def mark_chat_read(driver_id, sender):
    return call_function_one("fn_chat_mark_read", driver_id, sender)["fn_chat_mark_read"]


def fleet():
    return call_function("fn_fleet_list")


def drivers():
    return call_function("fn_driver_list")


def unassign_vehicle(vehicle_code):
    row = call_function_one("fn_vehicle_unassign", vehicle_code)
    return bool(row and row["fn_vehicle_unassign"])


def create_notice(title, description):
    return call_function_one("fn_notice_create", title, description)


def delete_notice(notice_id):
    row = call_function_one("fn_notice_delete", notice_id)
    return bool(row and row["fn_notice_delete"])
