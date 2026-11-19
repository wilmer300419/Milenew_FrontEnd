-- =============================================================
-- Funciones: users
-- Solo fn_user_get_auth_by_* devuelven el hash (para verificar
-- la contraseña en el BackEnd). Las demás nunca lo exponen.
-- =============================================================

-- (v5 cambió parámetros y columnas: se borran antes de recrearlas)
DROP FUNCTION IF EXISTS fn_user_create(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_user_create(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_user_get_auth_by_email(VARCHAR);
DROP FUNCTION IF EXISTS fn_user_get_auth_by_id(INTEGER);

-- Crear usuario. Lanza unique_violation (23505) si el email ya existe.
CREATE OR REPLACE FUNCTION fn_user_create(
    p_name           VARCHAR,
    p_email          VARCHAR,
    p_password_hash  VARCHAR,
    p_role           VARCHAR DEFAULT 'user',
    p_accepted_terms BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR, token_version INTEGER,
               created_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO users (name, email, password_hash, role, terms_accepted_at)
    VALUES (trim(p_name), lower(trim(p_email)), p_password_hash, COALESCE(p_role, 'user'),
            CASE WHEN p_accepted_terms THEN NOW() END)
    RETURNING users.id, users.name, users.email, users.role, users.token_version, users.created_at;
END;
$$;

-- Datos para autenticar por email (incluye hash).
CREATE OR REPLACE FUNCTION fn_user_get_auth_by_email(p_email VARCHAR)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR,
               password_hash VARCHAR, is_active BOOLEAN, token_version INTEGER)
LANGUAGE sql
STABLE
AS $$
    SELECT u.id, u.name, u.email, u.role, u.password_hash, u.is_active, u.token_version
    FROM users u
    WHERE lower(u.email) = lower(trim(p_email));
$$;

-- Datos para autenticar por id (cambio de contraseña con sesión iniciada).
CREATE OR REPLACE FUNCTION fn_user_get_auth_by_id(p_id INTEGER)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR,
               password_hash VARCHAR, is_active BOOLEAN, token_version INTEGER)
LANGUAGE sql
STABLE
AS $$
    SELECT u.id, u.name, u.email, u.role, u.password_hash, u.is_active, u.token_version
    FROM users u
    WHERE u.id = p_id;
$$;

-- Perfil público de un usuario activo (sin hash).
CREATE OR REPLACE FUNCTION fn_user_get_by_id(p_id INTEGER)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT u.id, u.name, u.email, u.role, u.created_at
    FROM users u
    WHERE u.id = p_id AND u.is_active;
$$;

-- Actualizar nombre y correo. Lanza 23505 si el correo ya está en uso.
CREATE OR REPLACE FUNCTION fn_user_update_profile(p_id INTEGER, p_name VARCHAR, p_email VARCHAR)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE users
    SET name  = trim(p_name),
        email = lower(trim(p_email))
    WHERE users.id = p_id AND users.is_active
    RETURNING users.id, users.name, users.email, users.role, users.created_at;
END;
$$;

-- Cambiar contraseña (el hash lo genera el BackEnd). TRUE si se actualizó.
CREATE OR REPLACE FUNCTION fn_user_update_password(p_id INTEGER, p_password_hash VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- cambiar la contraseña cierra todas las sesiones abiertas
    UPDATE users SET password_hash = p_password_hash, token_version = users.token_version + 1
    WHERE users.id = p_id AND users.is_active;
    RETURN FOUND;
END;
$$;

-- ---------------- sesiones (JWT revocables)

-- TRUE si la sesión sigue valiendo: usuario activo, misma versión y no revocada.
CREATE OR REPLACE FUNCTION fn_session_check(p_user_id INTEGER, p_jti VARCHAR, p_version INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = p_user_id AND u.is_active AND u.token_version = p_version
    ) AND NOT EXISTS (SELECT 1 FROM revoked_tokens r WHERE r.jti = p_jti);
$$;

-- Cierra una sesión (logout). Aprovecha para limpiar las ya vencidas.
CREATE OR REPLACE FUNCTION fn_session_revoke(p_jti VARCHAR, p_expires_at TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM revoked_tokens WHERE revoked_tokens.expires_at < NOW();
    INSERT INTO revoked_tokens (jti, expires_at) VALUES (p_jti, p_expires_at) ON CONFLICT DO NOTHING;
    RETURN TRUE;
END;
$$;

-- Cierra TODAS las sesiones del usuario. Devuelve la nueva versión.
CREATE OR REPLACE FUNCTION fn_user_bump_token_version(p_user_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_version INTEGER;
BEGIN
    UPDATE users SET token_version = users.token_version + 1
    WHERE users.id = p_user_id
    RETURNING users.token_version INTO v_version;
    RETURN v_version;
END;
$$;

-- Derecho de supresión (Ley 1581): borra la cuenta y sus datos personales.
-- Viajes, tarjeta, favoritas, avisos y chat se borran en cascada; las
-- incidencias reportadas quedan anónimas.
CREATE OR REPLACE FUNCTION fn_user_delete(p_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM users WHERE users.id = p_user_id;
    RETURN FOUND;
END;
$$;
