from datetime import date

from ..repositories import operations_repository
from ..utils.errors import NotFoundError, ValidationError
from ..utils.validation import MAX_INT, get_str, is_int

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
