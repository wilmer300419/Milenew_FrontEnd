-- =============================================================
-- Funciones: auth_codes (2FA y recuperación de cuenta)
-- =============================================================

-- Crea un código nuevo e invalida los anteriores sin usar del mismo tipo.
CREATE OR REPLACE FUNCTION fn_auth_code_create(
    p_user_id     INTEGER,
    p_purpose     VARCHAR,
    p_code_hash   VARCHAR,
    p_ttl_minutes INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id INTEGER;
BEGIN
    UPDATE auth_codes
    SET used_at = NOW()
    WHERE auth_codes.user_id = p_user_id
      AND auth_codes.purpose = p_purpose
      AND auth_codes.used_at IS NULL;

    INSERT INTO auth_codes (user_id, purpose, code_hash, expires_at)
    VALUES (p_user_id, p_purpose, p_code_hash, NOW() + make_interval(mins => p_ttl_minutes))
    RETURNING auth_codes.id INTO v_id;

    RETURN v_id;
END;
$$;

-- Código vigente (no usado y no vencido) más reciente.
CREATE OR REPLACE FUNCTION fn_auth_code_get_active(p_user_id INTEGER, p_purpose VARCHAR)
RETURNS TABLE (id INTEGER, code_hash VARCHAR, attempts INTEGER, expires_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT c.id, c.code_hash, c.attempts, c.expires_at
    FROM auth_codes c
    WHERE c.user_id = p_user_id
      AND c.purpose = p_purpose
      AND c.used_at IS NULL
      AND c.expires_at > NOW()
    ORDER BY c.id DESC
    LIMIT 1;
$$;

-- Registra un intento fallido; devuelve el total de intentos.
CREATE OR REPLACE FUNCTION fn_auth_code_register_failure(p_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempts INTEGER;
BEGIN
    UPDATE auth_codes SET attempts = auth_codes.attempts + 1
    WHERE auth_codes.id = p_id
    RETURNING auth_codes.attempts INTO v_attempts;
    RETURN COALESCE(v_attempts, 0);
END;
$$;

-- Marca el código como usado. TRUE si estaba vigente.
CREATE OR REPLACE FUNCTION fn_auth_code_consume(p_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE auth_codes SET used_at = NOW()
    WHERE auth_codes.id = p_id AND auth_codes.used_at IS NULL AND auth_codes.expires_at > NOW();
    RETURN FOUND;
END;
$$;

-- Recuperación: consume el código y cambia la contraseña en UNA transacción.
CREATE OR REPLACE FUNCTION fn_user_reset_password_with_code(
    p_user_id       INTEGER,
    p_code_id       INTEGER,
    p_password_hash VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE auth_codes SET used_at = NOW()
    WHERE auth_codes.id = p_code_id
      AND auth_codes.user_id = p_user_id
      AND auth_codes.purpose = 'recovery'
      AND auth_codes.used_at IS NULL
      AND auth_codes.expires_at > NOW();
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- recuperar la contraseña cierra todas las sesiones abiertas
    UPDATE users SET password_hash = p_password_hash, token_version = users.token_version + 1
    WHERE users.id = p_user_id;
    RETURN FOUND;
END;
$$;
