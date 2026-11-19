"""Checklist y chat del conductor: database/functions/07_operations.sql."""
from ..db import call_function, call_function_one


def list_checklist(driver_id, work_date):
    return call_function("fn_checklist_list", driver_id, work_date)


def set_checklist_item(driver_id, item_id, done, work_date):
    return call_function_one("fn_checklist_set", driver_id, item_id, done, work_date)


def list_chat(driver_id, limit=30):
    return call_function("fn_chat_list", driver_id, limit)


def create_chat_message(driver_id, sender, text):
    return call_function_one("fn_chat_create", driver_id, sender, text)


def mark_read(driver_id, sender):
    return call_function_one("fn_chat_mark_read", driver_id, sender)["fn_chat_mark_read"]
