-- =============================================================
-- Operación (panel de conductor): checklist y chat con la central
-- =============================================================
CREATE TABLE IF NOT EXISTS checklist_items (
    id         SERIAL PRIMARY KEY,
    label      VARCHAR(150) NOT NULL,
    sort_order   INTEGER      NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Estado del checklist por conductor y por día
CREATE TABLE IF NOT EXISTS checklist_entries (
    driver_id   INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    item_id     INTEGER     NOT NULL REFERENCES checklist_items (id) ON DELETE CASCADE,
    work_date   DATE        NOT NULL,
    done        BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (driver_id, item_id, work_date)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          SERIAL PRIMARY KEY,
    driver_id   INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    sender      VARCHAR(10)  NOT NULL,
    text        VARCHAR(500) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_chat_sender CHECK (sender IN ('driver', 'central')),
    CONSTRAINT chk_chat_text_not_blank CHECK (length(trim(text)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_chat_driver ON chat_messages (driver_id, created_at DESC);

-- ---- v4: mensajes leídos (para contadores en central y en el panel del operador)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_chat_unread ON chat_messages (driver_id, sender) WHERE read_at IS NULL;
