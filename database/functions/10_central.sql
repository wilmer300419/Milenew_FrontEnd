-- =============================================================
-- Funciones: central de operaciones (rol admin)
-- =============================================================

-- ---------------- resumen
-- (v7 agregó SOS abiertos y operadores en turno: se borra antes de recrearla)
DROP FUNCTION IF EXISTS fn_central_summary();

CREATE OR REPLACE FUNCTION fn_central_summary()
RETURNS TABLE (open_incidents BIGINT, in_progress_incidents BIGINT, drivers BIGINT,
               assigned_vehicles BIGINT, vehicles BIGINT, unread_messages BIGINT, passengers BIGINT,
               sos_open BIGINT, active_shifts BIGINT)
LANGUAGE sql
STABLE
AS $$
    SELECT
        (SELECT COUNT(*) FROM incidents WHERE status = 'open'),
        (SELECT COUNT(*) FROM incidents WHERE status = 'in_progress'),
        (SELECT COUNT(*) FROM users WHERE role = 'driver' AND is_active),
        (SELECT COUNT(*) FROM vehicles WHERE driver_id IS NOT NULL),
        (SELECT COUNT(*) FROM vehicles),
        (SELECT COUNT(*) FROM chat_messages WHERE sender = 'driver' AND read_at IS NULL),
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active),
        (SELECT COUNT(*) FROM incidents WHERE priority = 'sos' AND status <> 'closed'),
        (SELECT COUNT(*) FROM driver_shifts WHERE ended_at IS NULL);
$$;

-- ---------------- incidencias
-- (v7 agregó prioridad, bus y ubicación: se borra antes de recrearla)
DROP FUNCTION IF EXISTS fn_incident_list(VARCHAR, INTEGER);

-- Los SOS sin cerrar van primero; luego abiertas, en curso y cerradas.
CREATE OR REPLACE FUNCTION fn_incident_list(p_status VARCHAR DEFAULT NULL, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (id INTEGER, category VARCHAR, description VARCHAR, status VARCHAR,
               resolution_note VARCHAR, reporter_name VARCHAR, route_name VARCHAR,
               handled_by_name VARCHAR, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
               priority VARCHAR, vehicle_label VARCHAR, location VARCHAR, from_driver BOOLEAN)
LANGUAGE sql
STABLE
AS $$
    SELECT i.id, i.category, i.description, i.status, i.resolution_note,
           COALESCE(u.name, 'Anónimo')::VARCHAR, r.name, h.name, i.created_at, i.updated_at,
           i.priority, COALESCE(v.label, i.vehicle_code)::VARCHAR, i.location, i.vehicle_code IS NOT NULL
    FROM incidents i
    LEFT JOIN users u ON u.id = i.user_id
    LEFT JOIN users h ON h.id = i.handled_by
    LEFT JOIN routes r ON r.id = i.route_id
    LEFT JOIN vehicles v ON v.code = i.vehicle_code
    WHERE p_status IS NULL OR i.status = p_status
    ORDER BY (i.priority = 'sos' AND i.status <> 'closed') DESC,
             CASE i.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, i.created_at DESC
    LIMIT GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);
$$;

-- Cambia el estado (y la nota). 0 filas si la incidencia no existe.
CREATE OR REPLACE FUNCTION fn_incident_update(p_id INTEGER, p_status VARCHAR, p_note VARCHAR, p_admin_id INTEGER)
RETURNS TABLE (id INTEGER, status VARCHAR, resolution_note VARCHAR, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
    v_prev   VARCHAR;
    v_user   INTEGER;
    v_cat    VARCHAR;
BEGIN
    SELECT i.status, i.user_id, i.category INTO v_prev, v_user, v_cat FROM incidents i WHERE i.id = p_id;

    -- Al cerrarla, el pasajero que la reportó recibe un aviso personal
    IF FOUND AND p_status = 'closed' AND v_prev <> 'closed' AND v_user IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, description)
        VALUES (v_user, 'Tu reporte fue atendido',
                'La central cerró tu reporte de "' || v_cat || '"'
                || COALESCE(': ' || NULLIF(trim(p_note), ''), '.'));
    END IF;

    RETURN QUERY
    UPDATE incidents
    SET status          = p_status,
        resolution_note = COALESCE(NULLIF(trim(p_note), ''), incidents.resolution_note),
        handled_by      = p_admin_id,
        updated_at      = NOW()
    WHERE incidents.id = p_id
    RETURNING incidents.id, incidents.status, incidents.resolution_note, incidents.updated_at;
END;
$$;

-- ---------------- chat con operadores
-- Una fila por conductor (tenga o no mensajes), con el último mensaje y los no leídos.
CREATE OR REPLACE FUNCTION fn_chat_conversations()
RETURNS TABLE (driver_id INTEGER, driver_name VARCHAR, vehicle_label VARCHAR, last_text VARCHAR,
               last_sender VARCHAR, last_at TIMESTAMPTZ, unread BIGINT)
LANGUAGE sql
STABLE
AS $$
    SELECT d.id, d.name, COALESCE(v.label, v.code)::VARCHAR, last.text, last.sender, last.created_at,
           (SELECT COUNT(*) FROM chat_messages m
            WHERE m.driver_id = d.id AND m.sender = 'driver' AND m.read_at IS NULL)
    FROM users d
    LEFT JOIN vehicles v ON v.driver_id = d.id
    LEFT JOIN LATERAL (
        SELECT m.text, m.sender, m.created_at FROM chat_messages m
        WHERE m.driver_id = d.id ORDER BY m.id DESC LIMIT 1
    ) last ON TRUE
    WHERE d.role = 'driver' AND d.is_active
    ORDER BY last.created_at DESC NULLS LAST, d.name;
$$;

-- Marca como leídos los mensajes de un lado de la conversación. Devuelve cuántos.
CREATE OR REPLACE FUNCTION fn_chat_mark_read(p_driver_id INTEGER, p_sender VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE chat_messages SET read_at = NOW()
    WHERE chat_messages.driver_id = p_driver_id AND chat_messages.sender = p_sender
      AND chat_messages.read_at IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

DROP FUNCTION IF EXISTS fn_chat_unread_count(INTEGER, VARCHAR);  -- retirada

-- ---------------- flota
-- (v7 agregó el estado del turno del operador: se borra antes de recrearla)
DROP FUNCTION IF EXISTS fn_fleet_list();

-- shift_status: off (fuera de turno), on (en turno) o break (en pausa)
CREATE OR REPLACE FUNCTION fn_fleet_list()
RETURNS TABLE (code VARCHAR, label VARCHAR, service VARCHAR, route_code VARCHAR, route_name VARCHAR,
               driver_id INTEGER, driver_name VARCHAR, shift_status VARCHAR)
LANGUAGE sql
STABLE
AS $$
    SELECT v.code, COALESCE(v.label, v.code)::VARCHAR, v.service, r.code, r.name, v.driver_id, d.name,
           (CASE WHEN s.id IS NULL THEN 'off' WHEN s.break_started_at IS NOT NULL THEN 'break' ELSE 'on' END)::VARCHAR
    FROM vehicles v
    JOIN routes r ON r.id = v.route_id
    LEFT JOIN users d ON d.id = v.driver_id
    LEFT JOIN driver_shifts s ON s.driver_id = v.driver_id AND s.ended_at IS NULL
    ORDER BY r.code, v.code;
$$;

CREATE OR REPLACE FUNCTION fn_driver_list()
RETURNS TABLE (id INTEGER, name VARCHAR, email VARCHAR, vehicle_code VARCHAR)
LANGUAGE sql
STABLE
AS $$
    SELECT u.id, u.name, u.email, v.code
    FROM users u
    LEFT JOIN vehicles v ON v.driver_id = u.id
    WHERE u.role = 'driver' AND u.is_active
    ORDER BY u.name;
$$;

-- Deja un bus sin conductor. TRUE si el bus existe.
CREATE OR REPLACE FUNCTION fn_vehicle_unassign(p_vehicle_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE vehicles SET driver_id = NULL WHERE vehicles.code = p_vehicle_code;
    RETURN FOUND;
END;
$$;

-- ---------------- avisos generales
-- (v7 agregó el público del aviso: se borra antes de recrearla)
DROP FUNCTION IF EXISTS fn_notice_create(VARCHAR, VARCHAR);

-- p_audience: 'all' (todos) o 'drivers' (solo operadores)
CREATE OR REPLACE FUNCTION fn_notice_create(p_title VARCHAR, p_description VARCHAR, p_audience VARCHAR DEFAULT 'all')
RETURNS TABLE (id INTEGER, title VARCHAR, description VARCHAR, audience VARCHAR, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO notifications (user_id, title, description, audience)
    VALUES (NULL, trim(p_title), COALESCE(trim(p_description), ''), p_audience)
    RETURNING notifications.id, notifications.title, notifications.description, notifications.audience,
              notifications.created_at;
END;
$$;

-- Avisos generales con cuántos operadores confirmaron haberlos leído.
CREATE OR REPLACE FUNCTION fn_notice_list(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (id INTEGER, title VARCHAR, description VARCHAR, audience VARCHAR, created_at TIMESTAMPTZ,
               acks BIGINT)
LANGUAGE sql
STABLE
AS $$
    SELECT n.id, n.title, n.description, n.audience, n.created_at,
           (SELECT COUNT(*) FROM notice_acks a WHERE a.notice_id = n.id)
    FROM notifications n
    WHERE n.user_id IS NULL
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);
$$;

-- Borra un aviso GENERAL (nunca uno personal). TRUE si existía.
CREATE OR REPLACE FUNCTION fn_notice_delete(p_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM notifications WHERE notifications.id = p_id AND notifications.user_id IS NULL;
    RETURN FOUND;
END;
$$;
