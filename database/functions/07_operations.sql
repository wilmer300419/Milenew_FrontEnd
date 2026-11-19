-- =============================================================
-- Funciones: checklist pre-operacional y chat con la central
-- =============================================================

-- Checklist del conductor para un día (ítems no marcados = done false).
CREATE OR REPLACE FUNCTION fn_checklist_list(p_driver_id INTEGER, p_work_date DATE)
RETURNS TABLE (id INTEGER, label VARCHAR, done BOOLEAN)
LANGUAGE sql
STABLE
AS $$
    SELECT i.id, i.label, COALESCE(e.done, FALSE)
    FROM checklist_items i
    LEFT JOIN checklist_entries e
           ON e.item_id = i.id AND e.driver_id = p_driver_id AND e.work_date = p_work_date
    WHERE i.is_active
    ORDER BY i.sort_order, i.id;
$$;

-- Marca/desmarca un ítem. 0 filas si el ítem no existe o está inactivo.
CREATE OR REPLACE FUNCTION fn_checklist_set(
    p_driver_id INTEGER,
    p_item_id   INTEGER,
    p_done      BOOLEAN,
    p_work_date DATE
)
RETURNS TABLE (id INTEGER, label VARCHAR, done BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM checklist_items i WHERE i.id = p_item_id AND i.is_active) THEN
        RETURN;
    END IF;

    INSERT INTO checklist_entries AS e (driver_id, item_id, work_date, done)
    VALUES (p_driver_id, p_item_id, p_work_date, p_done)
    ON CONFLICT (driver_id, item_id, work_date)
    DO UPDATE SET done = EXCLUDED.done, updated_at = NOW();

    RETURN QUERY
    SELECT i.id, i.label, p_done FROM checklist_items i WHERE i.id = p_item_id;
END;
$$;

-- Últimos mensajes del conductor con la central, en orden cronológico.
CREATE OR REPLACE FUNCTION fn_chat_list(p_driver_id INTEGER, p_limit INTEGER DEFAULT 30)
RETURNS TABLE (id INTEGER, sender VARCHAR, text VARCHAR, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT t.id, t.sender, t.text, t.created_at
    FROM (
        SELECT m.id, m.sender, m.text, m.created_at
        FROM chat_messages m
        WHERE m.driver_id = p_driver_id
        ORDER BY m.id DESC
        LIMIT GREATEST(LEAST(COALESCE(p_limit, 30), 100), 1)
    ) t
    ORDER BY t.id;
$$;

CREATE OR REPLACE FUNCTION fn_chat_create(p_driver_id INTEGER, p_sender VARCHAR, p_text VARCHAR)
RETURNS TABLE (id INTEGER, sender VARCHAR, text VARCHAR, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO chat_messages (driver_id, sender, text)
    VALUES (p_driver_id, p_sender, trim(p_text))
    RETURNING chat_messages.id, chat_messages.sender, chat_messages.text, chat_messages.created_at;
END;
$$;
