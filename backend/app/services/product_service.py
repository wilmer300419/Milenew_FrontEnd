from decimal import Decimal

from ..repositories import product_repository
from ..utils.errors import NotFoundError, ValidationError
from ..utils.validation import is_int, is_number

MAX_LIMIT = 100
MAX_INT = 2_147_483_647  # rango de INTEGER en PostgreSQL
DEFAULT_LIMIT = 20


def _parse_positive_int(raw, default, field, errors, maximum=None):
    if raw is None or raw == "":
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        errors[field] = "Debe ser un número entero"
        return default
    if value < 1:
        errors[field] = "Debe ser mayor o igual a 1"
        return default
    if maximum is not None and value > maximum:
        errors[field] = f"No puede ser mayor a {maximum}"
        return default
    return value


def list_products(args):
    errors = {}
    page = _parse_positive_int(args.get("page"), 1, "page", errors)
    limit = _parse_positive_int(args.get("limit"), DEFAULT_LIMIT, "limit", errors, MAX_LIMIT)
    if errors:
        raise ValidationError(errors)
    search = (args.get("search") or "").strip() or None

    rows = product_repository.list_products(search, limit, (page - 1) * limit)
    total = rows[0]["total_count"] if rows else 0
    items = [{k: v for k, v in row.items() if k != "total_count"} for row in rows]
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit if total else 0,
    }
    return items, meta


def _check_id(product_id):
    if product_id > MAX_INT:
        raise NotFoundError("Producto no encontrado")


def get_product(product_id):
    _check_id(product_id)
    product = product_repository.get_by_id(product_id)
    if not product:
        raise NotFoundError("Producto no encontrado")
    return product


def _validate(data, partial):
    """Valida el cuerpo. partial=True (PATCH) permite omitir campos."""
    errors = {}
    clean = {"name": None, "description": None, "price": None, "quantity": None}

    if "name" in data or not partial:
        name = data.get("name")
        if not isinstance(name, str) or not name.strip():
            errors["name"] = "El nombre es obligatorio"
        elif len(name.strip()) > 150:
            errors["name"] = "El nombre no puede superar 150 caracteres"
        else:
            clean["name"] = name.strip()

    if "description" in data and data["description"] is not None:
        if not isinstance(data["description"], str):
            errors["description"] = "La descripción debe ser texto"
        else:
            clean["description"] = data["description"].strip()

    if "price" in data or not partial:
        price = data.get("price")
        if not is_number(price):
            errors["price"] = "El precio es obligatorio y debe ser numérico"
        elif price < 0:
            errors["price"] = "El precio no puede ser negativo"
        elif price >= 10**10:
            errors["price"] = "El precio es demasiado alto"
        else:
            # Decimal -> NUMERIC (un float se enviaría como double precision)
            clean["price"] = Decimal(str(price))

    if "quantity" in data:
        quantity = data["quantity"]
        if not is_int(quantity):
            errors["quantity"] = "La cantidad debe ser un número entero"
        elif quantity < 0:
            errors["quantity"] = "La cantidad no puede ser negativa"
        elif quantity > MAX_INT:
            errors["quantity"] = "La cantidad es demasiado alta"
        else:
            clean["quantity"] = quantity
    elif not partial:
        clean["quantity"] = 0

    if errors:
        raise ValidationError(errors)
    return clean


def create_product(data, user_id):
    clean = _validate(data, partial=False)
    return product_repository.create(
        clean["name"], clean["description"], clean["price"], clean["quantity"], user_id
    )


def update_product(product_id, data, partial):
    _check_id(product_id)
    clean = _validate(data, partial=partial)
    if partial and all(v is None for v in clean.values()):
        raise ValidationError({"body": "No se envió ningún campo para actualizar"})
    product = product_repository.update(
        product_id, clean["name"], clean["description"], clean["price"], clean["quantity"]
    )
    if not product:
        raise NotFoundError("Producto no encontrado")
    return product


def delete_product(product_id):
    _check_id(product_id)
    if not product_repository.delete(product_id):
        raise NotFoundError("Producto no encontrado")
