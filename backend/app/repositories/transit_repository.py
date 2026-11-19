"""Rutas, estaciones, vehículos e incidencias: database/functions/04_transit.sql."""
from ..db import call_function, call_function_one


def get_route(route_code):
    return call_function_one("fn_route_get", route_code)


def list_stations(route_code):
    return call_function("fn_station_list", route_code)


def list_incident_categories():
    return [row["name"] for row in call_function("fn_incident_category_list")]


def create_incident(category, description, user_id, route_code):
    return call_function_one("fn_incident_create", category, description, user_id, route_code)


def list_vehicles(route_code):
    return call_function("fn_vehicle_list_by_route", route_code)


def get_vehicle_by_driver(driver_id):
    return call_function_one("fn_vehicle_get_by_driver", driver_id)


def assign_driver(vehicle_code, driver_id):
    row = call_function_one("fn_vehicle_assign_driver", vehicle_code, driver_id)
    return bool(row and row["fn_vehicle_assign_driver"])


def list_routes():
    return call_function("fn_route_list")
