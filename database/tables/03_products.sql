-- =============================================================
-- Tabla: products
-- =============================================================
CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150)   NOT NULL,
    description     TEXT,
    price           NUMERIC(12, 2) NOT NULL,
    quantity        INTEGER        NOT NULL DEFAULT 0,
    created_by      INTEGER        REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_products_price CHECK (price >= 0),
    CONSTRAINT chk_products_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_products_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products (LOWER(name));
