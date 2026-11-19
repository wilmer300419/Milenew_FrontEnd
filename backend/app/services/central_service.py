from ..repositories import central_repository, operations_repository, transit_repository
from ..utils.errors import NotFoundError, ValidationError
from ..utils.validation import MAX_INT, get_str, is_int
from .notification_service import relative_time
from .operations_service import public_message

STATUSES = ("open", "in_progress", "closed")


def summary():
    return central_repository.summary()


# ---------------------------------------------------------------- incidencias
def list_incidents(status):
    if status and status not in STATUSES:
        raise ValidationError({"status": "Estado inválido (open, in_progress o closed)"})
    return central_repository.list_incidents(status or None)


def update_incident(admin_id, incident_id, data):
    status = get_str(data, "status")
    note = get_str(data, "note").strip()
    errors = {}
    if status not in STATUSES:
        errors["status"] = "Estado inválido (open, in_progress o closed)"
    if len(note) > 500:
        errors["note"] = "La nota no puede superar 500 caracteres"
    if errors:
        raise ValidationError(errors)
    row = central_repository.update_incident(incident_id, status, note or None, admin_id) if incident_id <= MAX_INT else None
    if not row:
        raise NotFoundError("Incidencia no encontrada")
    return row


# ---------------------------------------------------------------- chat
def conversations():
    return central_repository.conversations()


def _check_driver(driver_id):
    if driver_id > MAX_INT or not any(d["id"] == driver_id for d in central_repository.drivers()):
        raise NotFoundError("Operador no encontrado")


def conversation(driver_id):
    _check_driver(driver_id)
    central_repository.mark_chat_read(driver_id, "driver")
    return [public_message(m) for m in operations_repository.list_chat(driver_id, 100)]


def reply(driver_id, data):
    _check_driver(driver_id)
    text = get_str(data, "message").strip()
    if not text:
        raise ValidationError({"message": "El mensaje no puede estar vacío"})
    if len(text) > 500:
        raise ValidationError({"message": "El mensaje no puede superar 500 caracteres"})
    central_repository.mark_chat_read(driver_id, "driver")
    return public_message(operations_repository.create_chat_message(driver_id, "central", text))


# ---------------------------------------------------------------- flota
def fleet():
    return {"vehicles": central_repository.fleet(), "drivers": central_repository.drivers()}


def assign(vehicle_code, data):
    driver_id = data.get("driverId")
    if driver_id is None:
        if not central_repository.unassign_vehicle(vehicle_code):
            raise NotFoundError("Bus no encontrado")
        return fleet()
    if not is_int(driver_id) or not 1 <= driver_id <= MAX_INT:
        raise ValidationError({"driverId": "Operador inválido"})
    _check_driver(driver_id)
    if not transit_repository.assign_driver(vehicle_code, driver_id):
        raise NotFoundError("Bus no encontrado")
    return fleet()


# ---------------------------------------------------------------- avisos
AUDIENCES = ("all", "drivers")


def notices():
    return [{**r, "relative_time": relative_time(r["created_at"])} for r in central_repository.list_notices()]


def create_notice(data):
    title = get_str(data, "title").strip()
    description = get_str(data, "description").strip()
    audience = get_str(data, "audience").strip() or "all"
    errors = {}
    if audience not in AUDIENCES:
        errors["audience"] = "Público inválido (all o drivers)"
    if not 3 <= len(title) <= 150:
        errors["title"] = "El título debe tener entre 3 y 150 caracteres"
    if len(description) > 500:
        errors["description"] = "La descripción no puede superar 500 caracteres"
    if errors:
        raise ValidationError(errors)
    return central_repository.create_notice(title, description, audience)


def delete_notice(notice_id):
    if notice_id > MAX_INT or not central_repository.delete_notice(notice_id):
        raise NotFoundError("Aviso no encontrado")
