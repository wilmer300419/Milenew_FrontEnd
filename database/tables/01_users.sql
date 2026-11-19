-- =============================================================
-- Tabla: users
-- Roles: user (pasajero), driver (conductor), admin.
-- La contraseña se guarda SIEMPRE como hash (lo genera el BackEnd).
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL DEFAULT 'user',
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_role CHECK (role IN ('user', 'driver', 'admin')),
    CONSTRAINT chk_users_name_not_blank CHECK (length(trim(name)) > 0)
);

-- Email único sin distinguir mayúsculas/minúsculas
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(email));

-- ---- v5: sesiones revocables y aceptación de la política de datos (idempotente)
-- token_version: al subirlo, todas las sesiones abiertas del usuario dejan de valer
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
-- Ley 1581 de 2012: cuándo aceptó la política de tratamiento de datos
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Sesiones cerradas antes de vencer (identificador del token + vencimiento)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti         VARCHAR(64) PRIMARY KEY,
    expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_exp ON revoked_tokens (expires_at);
