from flask import Blueprint, g, request

from ..services import operations_service, transit_service
from ..utils.auth import optional_login, role_required
from ..utils.responses import success
from ..utils.validation import get_json_body

transit_bp = Blueprint("transit", __name__)

DRIVER_ROLES = ("driver", "admin")


# ---------------------------------------------------------------- público
@transit_bp.get("/stations")
def stations():
    route = request.args.get("route", transit_service.DEFAULT_ROUTE)
    return success(transit_service.list_stations(route), "Estaciones obtenidas")


@transit_bp.get("/routes/<route_id>/status")
def route_status(route_id):
    return success(transit_service.route_status(route_id), "Estado de la ruta")


@transit_bp.get("/routes/<route_id>/vehicles")
def route_vehicles(route_id):
    return success(transit_service.route_vehicles(route_id), "Buses en la ruta")


@transit_bp.get("/stations/<int:station_id>/arrivals")
def station_arrivals(station_id):
    route = request.args.get("route", transit_service.DEFAULT_ROUTE)
    return success(transit_service.station_arrivals(station_id, route), "Próximas llegadas")


@transit_bp.get("/incident-categories")
def incident_categories():
    return success(transit_service.incident_categories(), "Categorías de incidencia")


@transit_bp.get("/trip-plan")
def trip_plan():
    route = request.args.get("route", transit_service.DEFAULT_ROUTE)
    return success(transit_service.trip_plan(request.args, route), "Viaje calculado")


@transit_bp.post("/incidents")
@optional_login
def create_incident():
    incident = transit_service.create_incident(get_json_body(), g.user_id)
    return success(incident, "Incidencia reportada. ¡Gracias!", 201)


# ---------------------------------------------------------------- conductor
@transit_bp.get("/vehicles/<vehicle_id>/telemetry")
@role_required(*DRIVER_ROLES)
def telemetry(vehicle_id):
    return success(transit_service.vehicle_telemetry(vehicle_id), "Telemetría")


@transit_bp.get("/my-vehicle")
@role_required(*DRIVER_ROLES)
def my_vehicle():
    return success(transit_service.my_vehicle(g.user_id), "Bus asignado")


@transit_bp.get("/checklist")
@role_required(*DRIVER_ROLES)
def get_checklist():
    return success(operations_service.get_checklist(g.user_id), "Checklist del día")


@transit_bp.post("/checklist")
@role_required(*DRIVER_ROLES)
def set_checklist_item():
    return success(operations_service.set_checklist_item(g.user_id, get_json_body()), "Checklist actualizado")


@transit_bp.get("/operations-chat")
@role_required(*DRIVER_ROLES)
def get_chat():
    return success(operations_service.get_chat(g.user_id), "Mensajes")


@transit_bp.post("/operations-chat")
@role_required(*DRIVER_ROLES)
def post_chat():
    return success(operations_service.post_chat_message(g.user_id, get_json_body()), "Mensaje enviado", 201)
