"""Tarjeta TuLlave: database/functions/05_wallet.sql."""
from ..db import call_function_one


def get(user_id):
    return call_function_one("fn_wallet_get", user_id)


def recharge(user_id, amount):
    return call_function_one("fn_wallet_recharge", user_id, amount)


def list_transactions(user_id, limit=30):
    from ..db import call_function
    return call_function("fn_wallet_transaction_list", user_id, limit)
