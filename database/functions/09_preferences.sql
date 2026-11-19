-- =============================================================
-- Funciones: preferencias del usuario
-- =============================================================

-- Preferencias (las crea con valores por defecto si no existen).
CREATE OR REPLACE FUNCTION fn_preferences_get(p_user_id INTEGER)
RETURNS TABLE (theme VARCHAR, notify_arrivals BOOLEAN, notify_news BOOLEAN, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_preferences (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
    RETURN QUERY
    SELECT p.theme, p.notify_arrivals, p.notify_news, p.updated_at
    FROM user_preferences p WHERE p.user_id = p_user_id;
END;
$$;

-- Actualizar: los parámetros NULL conservan el valor actual.
CREATE OR REPLACE FUNCTION fn_preferences_update(
    p_user_id         INTEGER,
    p_theme           VARCHAR DEFAULT NULL,
    p_notify_arrivals BOOLEAN DEFAULT NULL,
    p_notify_news     BOOLEAN DEFAULT NULL
)
RETURNS TABLE (theme VARCHAR, notify_arrivals BOOLEAN, notify_news BOOLEAN, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_preferences (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
    RETURN QUERY
    UPDATE user_preferences
    SET theme           = COALESCE(p_theme, user_preferences.theme),
        notify_arrivals = COALESCE(p_notify_arrivals, user_preferences.notify_arrivals),
        notify_news     = COALESCE(p_notify_news, user_preferences.notify_news),
        updated_at      = NOW()
    WHERE user_preferences.user_id = p_user_id
    RETURNING user_preferences.theme, user_preferences.notify_arrivals,
              user_preferences.notify_news, user_preferences.updated_at;
END;
$$;
