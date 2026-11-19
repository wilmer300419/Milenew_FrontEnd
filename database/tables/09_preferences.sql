-- =============================================================
-- Preferencias del usuario (se crean con valores por defecto)
-- =============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id          INTEGER     PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    theme            VARCHAR(10) NOT NULL DEFAULT 'dark',
    notify_arrivals  BOOLEAN     NOT NULL DEFAULT TRUE,
    notify_news      BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_preferences_theme CHECK (theme IN ('dark', 'light'))
);
