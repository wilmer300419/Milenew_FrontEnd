-- =============================================================
-- Funciones: turnos del operador, reportes (SOS) y avisos con confirmación
-- =============================================================

-- ---------------- turnos
CREATE OR REPLACE FUNCTION fn_shift_get_open(p_driver_id INTEGER)
RETURNS SETOF driver_shifts
LANGUAGE sql
STABLE
AS $$
    SELECT * FROM driver_shifts s WHERE s.driver_id = p_driver_id AND s.ended_at IS NULL;
$$;

-- Último turno cerrado (0 filas si nunca cerró uno).
CREATE OR REPLACE FUNCTION fn_shift_get_last(p_driver_id INTEGER)
RETURNS SETOF driver_shifts
LANGUAGE sql
STABLE
AS $$
    SELECT * FROM driver_shifts s
    WHERE s.driver_id = p_driver_id AND s.ended_at IS NOT NULL
    ORDER BY s.ended_at DESC
    LIMIT 1;
$$;

-- Abre un turno. 0 filas si ya tenía uno abierto.
CREATE OR REPLACE FUNCTION fn_shift_start(p_driver_id INTEGER, p_vehicle_code VARCHAR, p_route_code VARCHAR)
RETURNS SETOF driver_shifts
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM driver_shifts s WHERE s.driver_id = p_driver_id AND s.ended_at IS NULL) THEN
        RETURN;
    END IF;
    RETURN QUERY
    INSERT INTO driver_shifts (driver_id, vehicle_code, route_code)
    VALUES (p_driver_id, p_vehicle_code, p_route_code)
    RETURNING *;
END;
$$;

-- Inicia (p_active) o termina una pausa del turno abierto. 0 filas si no hay turno.
CREATE OR REPLACE FUNCTION fn_shift_set_break(p_driver_id INTEGER, p_active BOOLEAN)
RETURNS SETOF driver_shifts
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_active THEN
        RETURN QUERY
        UPDATE driver_shifts s
        SET break_started_at = COALESCE(s.break_started_at, NOW())
        WHERE s.driver_id = p_driver_id AND s.ended_at IS NULL
        RETURNING *;
    ELSE
        RETURN QUERY
        UPDATE driver_shifts s
        SET break_seconds    = s.break_seconds + COALESCE(EXTRACT(EPOCH FROM NOW() - s.break_started_at)::INTEGER, 0),
            last_break_end   = CASE WHEN s.break_started_at IS NULL THEN s.last_break_end ELSE NOW() END,
            break_started_at = NULL
        WHERE s.driver_id = p_driver_id AND s.ended_at IS NULL
        RETURNING *;
    END IF;
END;
$$;

-- Cierra el turno abierto (termina la pausa si la había) y guarda el resumen.
CREATE OR REPLACE FUNCTION fn_shift_end(p_driver_id INTEGER, p_summary JSONB)
RETURNS SETOF driver_shifts
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE driver_shifts s
    SET break_seconds    = s.break_seconds + COALESCE(EXTRACT(EPOCH FROM NOW() - s.break_started_at)::INTEGER, 0),
        break_started_at = NULL,
        ended_at         = NOW(),
        summary          = p_summary
    WHERE s.driver_id = p_driver_id AND s.ended_at IS NULL
    RETURNING *;
END;
$$;

-- ---------------- reportes del operador
-- Crea un reporte. Un SOS abierto no se duplica: se devuelve el existente.
CREATE OR REPLACE FUNCTION fn_driver_report_create(
    p_driver_id    INTEGER,
    p_category     VARCHAR,
    p_description  VARCHAR,
    p_priority     VARCHAR,
    p_route_code   VARCHAR,
    p_vehicle_code VARCHAR,
    p_location     VARCHAR
)
RETURNS TABLE (id INTEGER, category VARCHAR, description VARCHAR, status VARCHAR, priority VARCHAR,
               location VARCHAR, resolution_note VARCHAR, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
               duplicate BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_priority = 'sos' THEN
        RETURN QUERY
        SELECT i.id, i.category, i.description, i.status, i.priority, i.location, i.resolution_note,
               i.created_at, i.updated_at, TRUE
        FROM incidents i
        WHERE i.user_id = p_driver_id AND i.priority = 'sos' AND i.status <> 'closed'
        ORDER BY i.id DESC
        LIMIT 1;
        IF FOUND THEN
            RETURN;
        END IF;
    END IF;

    RETURN QUERY
    INSERT INTO incidents (category, description, user_id, route_id, priority, vehicle_code, location)
    VALUES (p_category, NULLIF(trim(p_description), ''), p_driver_id,
            (SELECT r.id FROM routes r WHERE r.code = p_route_code), p_priority, p_vehicle_code, p_location)
    RETURNING incidents.id, incidents.category, incidents.description, incidents.status, incidents.priority,
              incidents.location, incidents.resolution_note, incidents.created_at, incidents.updated_at, FALSE;
END;
$$;

-- Reportes del operador: los abiertos y los de las últimas 24 h.
CREATE OR REPLACE FUNCTION fn_driver_report_list(p_driver_id INTEGER)
RETURNS TABLE (id INTEGER, category VARCHAR, description VARCHAR, status VARCHAR, priority VARCHAR,
               location VARCHAR, resolution_note VARCHAR, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT i.id, i.category, i.description, i.status, i.priority, i.location, i.resolution_note,
           i.created_at, i.updated_at
    FROM incidents i
    WHERE i.user_id = p_driver_id AND i.vehicle_code IS NOT NULL
      AND (i.status <> 'closed' OR i.updated_at > NOW() - INTERVAL '24 hours')
    ORDER BY (i.status <> 'closed') DESC, i.created_at DESC
    LIMIT 20;
$$;

-- ---------------- avisos para el operador
-- Avisos generales de los últimos 3 días (para todos o solo operadores) y si ya los confirmó.
CREATE OR REPLACE FUNCTION fn_driver_notice_list(p_user_id INTEGER)
RETURNS TABLE (id INTEGER, title VARCHAR, description VARCHAR, audience VARCHAR,
               created_at TIMESTAMPTZ, acked BOOLEAN)
LANGUAGE sql
STABLE
AS $$
    SELECT n.id, n.title, n.description, n.audience, n.created_at,
           EXISTS (SELECT 1 FROM notice_acks a WHERE a.notice_id = n.id AND a.user_id = p_user_id)
    FROM notifications n
    WHERE n.user_id IS NULL AND n.created_at > NOW() - INTERVAL '3 days'
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT 20;
$$;

-- Confirma la lectura de un aviso general. TRUE si el aviso existe.
CREATE OR REPLACE FUNCTION fn_notice_ack(p_notice_id INTEGER, p_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM notifications n WHERE n.id = p_notice_id AND n.user_id IS NULL) THEN
        RETURN FALSE;
    END IF;
    INSERT INTO notice_acks (notice_id, user_id) VALUES (p_notice_id, p_user_id)
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
END;
$$;
