-- =============================================================
-- Tabla: auth_codes
-- Códigos de un solo uso enviados por correo:
--   two_factor -> segundo paso del login (2FA)
--   recovery   -> recuperación de contraseña
-- Solo se guarda el HASH del código, nunca el código.
-- =============================================================
CREATE TABLE IF NOT EXISTS auth_codes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose     VARCHAR(20)  NOT NULL,
    code_hash   VARCHAR(128) NOT NULL,
    attempts    INTEGER      NOT NULL DEFAULT 0,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_auth_codes_purpose CHECK (purpose IN ('two_factor', 'recovery'))
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_user_purpose ON auth_codes (user_id, purpose);
