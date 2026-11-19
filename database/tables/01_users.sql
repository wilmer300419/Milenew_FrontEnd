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
