-- =============================================================
-- Funciones: notifications
-- =============================================================

-- Avisos generales + (si hay usuario) los personales, más recientes primero.
-- (v3 agregó la columna personal: se borra antes de recrearla)
DROP FUNCTION IF EXISTS fn_notification_list(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_notification_list(p_user_id INTEGER, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (id INTEGER, title VARCHAR, description VARCHAR, created_at TIMESTAMPTZ,
               personal BOOLEAN, unread BOOLEAN)
LANGUAGE sql
STABLE
AS $$
    SELECT n.id, n.title, n.description, n.created_at,
           (n.user_id IS NOT NULL) AS personal,
           (n.user_id IS NOT NULL AND n.read_at IS NULL) AS unread
    FROM notifications n
    WHERE n.user_id IS NULL
       OR (p_user_id IS NOT NULL AND n.user_id = p_user_id)
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
$$;

-- Marcar un aviso personal como leído. TRUE si cambió.
CREATE OR REPLACE FUNCTION fn_notification_mark_read(p_user_id INTEGER, p_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE notifications SET read_at = NOW()
    WHERE notifications.id = p_id AND notifications.user_id = p_user_id AND notifications.read_at IS NULL;
    RETURN FOUND;
END;
$$;

-- Marcar todos los avisos personales como leídos. Devuelve cuántos cambiaron.
CREATE OR REPLACE FUNCTION fn_notification_mark_all_read(p_user_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications SET read_at = NOW()
    WHERE notifications.user_id = p_user_id AND notifications.read_at IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION fn_notification_unread_count(p_user_id INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM notifications n
    WHERE n.user_id = p_user_id AND n.read_at IS NULL;
$$;
