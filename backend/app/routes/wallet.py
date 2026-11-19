from flask import Blueprint, g

from ..services import wallet_service
from ..utils.auth import login_required
from ..utils.responses import success
from ..utils.validation import get_json_body

wallet_bp = Blueprint("wallet", __name__)


@wallet_bp.get("")
@login_required
def get_wallet():
    return success(wallet_service.get_wallet(g.user_id), "Saldo de la tarjeta")


@wallet_bp.post("/recharge")
@login_required
def recharge():
    return success(wallet_service.recharge(g.user_id, get_json_body()), "Recarga aplicada")


@wallet_bp.get("/transactions")
@login_required
def transactions():
    return success(wallet_service.list_transactions(g.user_id), "Movimientos de la tarjeta")
