-- =============================================================
-- Tarjeta TuLlave: saldo por usuario y movimientos
-- =============================================================
CREATE TABLE IF NOT EXISTS wallets (
    user_id     INTEGER        PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    balance     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wallets_balance CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type           VARCHAR(20)    NOT NULL,
    amount         NUMERIC(12, 2) NOT NULL,
    balance_after  NUMERIC(12, 2) NOT NULL,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wallet_tx_type CHECK (type IN ('recharge', 'fare')),
    CONSTRAINT chk_wallet_tx_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions (user_id, created_at DESC);

-- ---- v2: descripción legible del movimiento (idempotente)
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS description VARCHAR(200);
