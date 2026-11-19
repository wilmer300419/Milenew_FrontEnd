from decimal import Decimal

from ..repositories import wallet_repository
from ..utils.errors import ValidationError
from ..utils.validation import is_int

MIN_RECHARGE = 1_000
MAX_RECHARGE = 500_000


def _public(wallet):
    return {"balance": wallet["balance"], "currency": "COP", "updatedAt": wallet["updated_at"]}


def get_wallet(user_id):
    return _public(wallet_repository.get(user_id))


def recharge(user_id, data):
    amount = data.get("amount")
    if not is_int(amount) or not MIN_RECHARGE <= amount <= MAX_RECHARGE:
        raise ValidationError(
            {"amount": f"El monto debe ser un entero entre {MIN_RECHARGE:,} y {MAX_RECHARGE:,}".replace(",", ".")}
        )
    return _public(wallet_repository.recharge(user_id, Decimal(amount)))


def list_transactions(user_id):
    return wallet_repository.list_transactions(user_id)
