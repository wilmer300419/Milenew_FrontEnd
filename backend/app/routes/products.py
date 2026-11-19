from flask import Blueprint, g, request

from ..services import product_service
from ..utils.auth import login_required
from ..utils.responses import success
from ..utils.validation import get_json_body

products_bp = Blueprint("products", __name__)


@products_bp.get("")
def list_products():
    items, meta = product_service.list_products(request.args)
    return success(items, "Productos obtenidos", meta=meta)


@products_bp.get("/<int:product_id>")
def get_product(product_id):
    return success(product_service.get_product(product_id), "Producto obtenido")


@products_bp.post("")
@login_required
def create_product():
    product = product_service.create_product(get_json_body(), g.user_id)
    return success(product, "Producto creado correctamente", 201)


@products_bp.put("/<int:product_id>")
@login_required
def replace_product(product_id):
    product = product_service.update_product(product_id, get_json_body(), partial=False)
    return success(product, "Producto actualizado correctamente")


@products_bp.patch("/<int:product_id>")
@login_required
def patch_product(product_id):
    product = product_service.update_product(product_id, get_json_body(), partial=True)
    return success(product, "Producto actualizado correctamente")


@products_bp.delete("/<int:product_id>")
@login_required
def delete_product(product_id):
    product_service.delete_product(product_id)
    return success(None, "Producto eliminado correctamente")
