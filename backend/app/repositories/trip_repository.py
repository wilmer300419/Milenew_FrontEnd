"""Favoritas y viajes: database/functions/08_trips.sql."""
from ..db import call_function, call_function_one


def list_favorites(user_id):
    return [row["station_id"] for row in call_function("fn_favorite_list", user_id)]


def add_favorite(user_id, station_id):
    call_function_one("fn_favorite_add", user_id, station_id)


def remove_favorite(user_id, station_id):
    row = call_function_one("fn_favorite_remove", user_id, station_id)
    return bool(row and row["fn_favorite_remove"])


def create_trip(user_id, route_code, from_id, to_id, service, fare, minutes):
    return call_function_one("fn_trip_create", user_id, route_code, from_id, to_id, service, fare, minutes)


def get_active(user_id):
    return call_function_one("fn_trip_get_active", user_id)


def finish(user_id, trip_id):
    row = call_function_one("fn_trip_finish", user_id, trip_id)
    return bool(row and row["fn_trip_finish"])


def list_trips(user_id, limit=20):
    return call_function("fn_trip_list", user_id, limit)
