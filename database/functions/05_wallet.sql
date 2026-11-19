-- =============================================================
-- Funciones: tarjeta TuLlave (wallet)
-- =============================================================

-- Saldo del usuario (crea la tarjeta en 0 si aún no existe).
CREATE OR REPLACE FUNCTION fn_wallet_get(p_user_id INTEGER)
RETURNS TABLE (user_id INTEGER, balance NUMERIC, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
    RETURN QUERY
    SELECT w.user_id, w.balance, w.updated_at FROM wallets w WHERE w.user_id = p_user_id;
END;
$$;

-- Recarga: suma saldo, registra el movimiento y crea una notificación,
-- todo en la misma transacción.
CREATE OR REPLACE FUNCTION fn_wallet_recharge(p_user_id INTEGER, p_amount NUMERIC)
RETURNS TABLE (user_id INTEGER, balance NUMERIC, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'El monto de recarga debe ser positivo' USING ERRCODE = 'check_violation';
    END IF;

    INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;

    UPDATE wallets SET balance = wallets.balance + p_amount
    WHERE wallets.user_id = p_user_id
    RETURNING wallets.balance INTO v_balance;

    INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'recharge', p_amount, v_balance, 'Recarga TuLlave');

    INSERT INTO notifications (user_id, title, description)
    VALUES (p_user_id, 'Recarga exitosa',
            'Se recargaron $' || to_char(p_amount, 'FM999G999G990') || ' a tu tarjeta TuLlave.');

    RETURN QUERY
    SELECT w.user_id, w.balance, w.updated_at FROM wallets w WHERE w.user_id = p_user_id;
END;
$$;

-- Movimientos de la tarjeta, más recientes primero.
CREATE OR REPLACE FUNCTION fn_wallet_transaction_list(p_user_id INTEGER, p_limit INTEGER DEFAULT 30)
RETURNS TABLE (id INTEGER, type VARCHAR, amount NUMERIC, balance_after NUMERIC,
               description VARCHAR, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT t.id, t.type, t.amount, t.balance_after,
           COALESCE(t.description, CASE t.type WHEN 'recharge' THEN 'Recarga TuLlave' ELSE 'Pasaje' END)::VARCHAR,
           t.created_at
    FROM wallet_transactions t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC, t.id DESC
    LIMIT GREATEST(LEAST(COALESCE(p_limit, 30), 100), 1);
$$;
