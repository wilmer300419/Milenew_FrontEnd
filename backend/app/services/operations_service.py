from datetime import date

from ..repositories import driver_ops_repository, operations_repository, transit_repository
from ..utils.errors import NotFoundError, ValidationError
from ..utils.validation import MAX_INT, get_str, is_int
from .notification_service import relative_time
from .transit_service import driver_vehicle, vehicle_location

SOS_CATEGORY = "Emergencia (SOS)"

def _today():
    return date.today()


def get_checklist(driver_id):
    return operations_repository.list_checklist(driver_id, _today())


def set_checklist_item(driver_id, data):
    item_id = data.get("itemId")
    done = data.get("done")
    errors = {}
    if not is_int(item_id) or not 1 <= item_id <= MAX_INT:
        errors["itemId"] = "Ítem inválido"
    if not isinstance(done, bool):
        errors["done"] = "Debe ser true o false"
    if errors:
        raise ValidationError(errors)

    item = operations_repository.set_checklist_item(driver_id, item_id, done, _today())
    if not item:
        raise NotFoundError("Ítem de checklist no encontrado")
    return item


def public_message(m):
    return {"id": m["id"], "from": m["sender"], "text": m["text"], "created_at": m["created_at"]}


def get_chat(driver_id):
    # Al abrir el chat, el operador da por leídos los mensajes de la central
    operations_repository.mark_read(driver_id, "central")
    return [public_message(m) for m in operations_repository.list_chat(driver_id)]


def post_chat_message(driver_id, data):
    text = get_str(data, "message").strip()
    if not text:
        raise ValidationError({"message": "El mensaje no puede estar vacío"})
    if len(text) > 500:
        raise ValidationError({"message": "El mensaje no puede superar 500 caracteres"})

    return public_message(operations_repository.create_chat_message(driver_id, "driver", text))


# ---------------------------------------------------------------- reportes (novedades y SOS)
def list_reports(driver_id):
    return driver_ops_repository.list_reports(driver_id)


def create_report(driver_id, data):
    """Novedad o SOS del operador: llega a la central con el bus y su ubicación."""
    sos = data.get("sos") is True
    category = SOS_CATEGORY if sos else get_str(data, "category").strip()
    description = get_str(data, "description").strip()
    errors = {}
    allowed = report_categories()
    if not sos and category not in allowed:
        errors["category"] = "Categoría inválida. Opciones: " + ", ".join(allowed)
    if len(description) > 500:
        errors["description"] = "La descripción no puede superar 500 caracteres"
    if errors:
        raise ValidationError(errors)

    vehicle = driver_vehicle(driver_id)
    return driver_ops_repository.create_report(driver_id, category, description or None, "sos" if sos else "normal",
                                               vehicle["route_code"], vehicle["code"], vehicle_location(vehicle))


def report_categories():
    return [c for c in transit_repository.list_incident_categories("driver") if c != SOS_CATEGORY]


# ---------------------------------------------------------------- avisos de la central
def list_notices(driver_id):
    return [{**n, "relative_time": relative_time(n["created_at"])} for n in driver_ops_repository.list_notices(driver_id)]


def ack_notice(driver_id, notice_id):
    if notice_id > MAX_INT or not driver_ops_repository.ack_notice(notice_id, driver_id):
        raise NotFoundError("Aviso no encontrado")
