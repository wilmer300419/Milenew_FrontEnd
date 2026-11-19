-- =============================================================
-- Funciones: users
-- Solo fn_user_get_auth_by_* devuelven el hash (para verificar
-- la contraseña en el BackEnd). Las demás nunca lo exponen.
-- =============================================================

-- Crear usuario. Lanza unique_violation (23505) si el email ya existe.
CREATE OR REPLACE FUNCTION fn_user_create(
    p_name          VARCHAR,
    p_email         VARCHAR,
    p_password_hash VARCHAR,
    p_role          VARCHAR DEFAULT 'user'
)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO users (name, email, password_hash, role)
    VALUES (trim(p_name), lower(trim(p_email)), p_password_hash, COALESCE(p_role, 'user'))
    RETURNING users.id, users.name, users.email, users.role, users.created_at;
END;
$$;

-- Datos para autenticar por email (incluye hash).
CREATE OR REPLACE FUNCTION fn_user_get_auth_by_email(p_email VARCHAR)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR,
               password_hash VARCHAR, is_active BOOLEAN)
LANGUAGE sql
STABLE
AS $$
    SELECT u.id, u.name, u.email, u.role, u.password_hash, u.is_active
    FROM users u
    WHERE lower(u.email) = lower(trim(p_email));
$$;

-- Datos para autenticar por id (cambio de contraseña con sesión iniciada).
CREATE OR REPLACE FUNCTION fn_user_get_auth_by_id(p_id INTEGER)
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, role VARCHAR,
               password_hash VARCHAR, is_active BOOLEAN)
LANGUAGE sql
STABLE
AS $$
    SELECT u.id, u.name, u.email, u.role, u.password_hash, u.is_active
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
    UPDATE users SET password_hash = p_password_hash WHERE users.id = p_id AND users.is_active;
    RETURN FOUND;
END;
$$;
