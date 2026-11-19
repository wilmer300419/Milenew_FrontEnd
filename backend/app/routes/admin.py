from flask import Blueprint, g, request

from ..services import central_service
from ..utils.auth import role_required
from ..utils.responses import success
from ..utils.validation import get_json_body

admin_bp = Blueprint("admin", __name__)
admin_only = role_required("admin")


@admin_bp.get("/summary")
@admin_only
def summary():
    return success(central_service.summary(), "Resumen de la operación")


@admin_bp.get("/incidents")
@admin_only
def incidents():
    return success(central_service.list_incidents(request.args.get("status")), "Incidencias")


@admin_bp.patch("/incidents/<int:incident_id>")
@admin_only
def update_incident(incident_id):
    return success(central_service.update_incident(g.user_id, incident_id, get_json_body()), "Incidencia actualizada")


@admin_bp.get("/conversations")
@admin_only
def conversations():
    return success(central_service.conversations(), "Conversaciones")


@admin_bp.get("/conversations/<int:driver_id>")
@admin_only
def conversation(driver_id):
    return success(central_service.conversation(driver_id), "Mensajes")


@admin_bp.post("/conversations/<int:driver_id>")
@admin_only
def reply(driver_id):
    return success(central_service.reply(driver_id, get_json_body()), "Mensaje enviado", 201)


@admin_bp.get("/fleet")
@admin_only
def fleet():
    return success(central_service.fleet(), "Flota")


@admin_bp.put("/fleet/<vehicle_code>/driver")
@admin_only
def assign(vehicle_code):
    return success(central_service.assign(vehicle_code, get_json_body()), "Asignación actualizada")


@admin_bp.get("/notices")
@admin_only
def notices():
    return success(central_service.notices(), "Avisos generales")


@admin_bp.post("/notices")
@admin_only
def create_notice():
    return success(central_service.create_notice(get_json_body()), "Aviso publicado", 201)


@admin_bp.delete("/notices/<int:notice_id>")
@admin_only
def delete_notice(notice_id):
    central_service.delete_notice(notice_id)
    return success(None, "Aviso eliminado")
