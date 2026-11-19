-- =============================================================
-- Notificaciones. user_id NULL = aviso general para todos.
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER      REFERENCES users (id) ON DELETE CASCADE,
    title        VARCHAR(150) NOT NULL,
    description  VARCHAR(500) NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    read_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
