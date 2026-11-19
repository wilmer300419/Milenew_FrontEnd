-- =============================================================
-- Funciones: favoritas y viajes
-- =============================================================

CREATE OR REPLACE FUNCTION fn_favorite_list(p_user_id INTEGER)
RETURNS TABLE (station_id INTEGER)
LANGUAGE sql
STABLE
AS $$
    SELECT f.station_id FROM user_favorite_stations f
    WHERE f.user_id = p_user_id
    ORDER BY f.created_at;
$$;

-- Lanza foreign_key_violation (23503) si la estación no existe.
CREATE OR REPLACE FUNCTION fn_favorite_add(p_user_id INTEGER, p_station_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_favorite_stations (user_id, station_id)
    VALUES (p_user_id, p_station_id)
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION fn_favorite_remove(p_user_id INTEGER, p_station_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM user_favorite_stations f WHERE f.user_id = p_user_id AND f.station_id = p_station_id;
    RETURN FOUND;
END;
$$;

-- (v3/v6 cambiaron parámetros y columnas: se borran antes de recrearlas)
DROP FUNCTION IF EXISTS fn_trip_create(INTEGER, VARCHAR, INTEGER, INTEGER, VARCHAR, NUMERIC);
DROP FUNCTION IF EXISTS fn_trip_create(INTEGER, VARCHAR, INTEGER, INTEGER, VARCHAR, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS fn_trip_list(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_trip_get_active(INTEGER);

-- Pagar y registrar un viaje en UNA transacción: cierra el viaje anterior que
-- siguiera abierto, descuenta el pasaje (check_violation 23514 si el saldo no
-- alcanza), guarda el movimiento y el viaje.
CREATE OR REPLACE FUNCTION fn_trip_create(
    p_user_id     INTEGER,
    p_route_code  VARCHAR,
    p_from_id     INTEGER,
    p_to_id       INTEGER,
    p_service     VARCHAR,
    p_fare        NUMERIC,
    p_minutes     INTEGER
)
RETURNS TABLE (id INTEGER, from_station_id INTEGER, from_name VARCHAR, to_station_id INTEGER,
               to_name VARCHAR, service VARCHAR, service_code VARCHAR, route_code VARCHAR, fare NUMERIC,
               estimated_minutes INTEGER, started_at TIMESTAMPTZ, balance NUMERIC)
LANGUAGE plpgsql
AS $$
DECLARE
    v_route_id  INTEGER;
    v_from_name VARCHAR;
    v_to_name   VARCHAR;
    v_balance   NUMERIC;
    v_trip_id   INTEGER;
BEGIN
    SELECT r.id INTO v_route_id FROM routes r WHERE r.code = p_route_code;
    SELECT s.name INTO v_from_name FROM stations s WHERE s.id = p_from_id AND s.route_id = v_route_id;
    SELECT s.name INTO v_to_name   FROM stations s WHERE s.id = p_to_id   AND s.route_id = v_route_id;
    IF v_route_id IS NULL OR v_from_name IS NULL OR v_to_name IS NULL THEN
        RAISE EXCEPTION 'Ruta o estación inexistente' USING ERRCODE = 'foreign_key_violation';
    END IF;

    INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;

    -- El CHECK (balance >= 0) de wallets rechaza el pago si no hay saldo.
    UPDATE wallets SET balance = wallets.balance - p_fare
    WHERE wallets.user_id = p_user_id
    RETURNING wallets.balance INTO v_balance;

    UPDATE trips SET ended_at = NOW()
    WHERE trips.user_id = p_user_id AND trips.ended_at IS NULL;

    INSERT INTO trips (user_id, route_id, from_station_id, to_station_id, service, fare, estimated_minutes)
    VALUES (p_user_id, v_route_id, p_from_id, p_to_id, p_service, p_fare, GREATEST(COALESCE(p_minutes, 10), 1))
    RETURNING trips.id INTO v_trip_id;

    INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'fare', p_fare, v_balance,
            'Pasaje ' || v_from_name || ' → ' || v_to_name);

    RETURN QUERY
    SELECT t.id, t.from_station_id, v_from_name, t.to_station_id, v_to_name, t.service,
           (CASE WHEN t.service = 'Expreso' THEN r.express_code ELSE r.local_code END)::VARCHAR, r.code,
           t.fare, t.estimated_minutes, t.started_at, v_balance
    FROM trips t JOIN routes r ON r.id = t.route_id WHERE t.id = v_trip_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_trip_list(p_user_id INTEGER, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (id INTEGER, from_station_id INTEGER, from_name VARCHAR, to_station_id INTEGER,
               to_name VARCHAR, service VARCHAR, service_code VARCHAR, route_code VARCHAR, fare NUMERIC,
               estimated_minutes INTEGER, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT t.id, t.from_station_id, sf.name, t.to_station_id, st.name, t.service,
           (CASE WHEN t.service = 'Expreso' THEN r.express_code ELSE r.local_code END)::VARCHAR, r.code,
           t.fare, t.estimated_minutes, t.started_at, t.ended_at
    FROM trips t
    JOIN routes r ON r.id = t.route_id
    JOIN stations sf ON sf.id = t.from_station_id
    JOIN stations st ON st.id = t.to_station_id
    WHERE t.user_id = p_user_id
    ORDER BY t.started_at DESC, t.id DESC
    LIMIT GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
$$;

-- Viaje en curso: el último sin terminar y que no haya vencido
-- (duración estimada + 30 min de margen). 0 filas si no hay.
CREATE OR REPLACE FUNCTION fn_trip_get_active(p_user_id INTEGER)
RETURNS TABLE (id INTEGER, from_station_id INTEGER, from_name VARCHAR, to_station_id INTEGER,
               to_name VARCHAR, service VARCHAR, service_code VARCHAR, route_code VARCHAR, fare NUMERIC,
               estimated_minutes INTEGER, started_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT t.id, t.from_station_id, sf.name, t.to_station_id, st.name, t.service,
           (CASE WHEN t.service = 'Expreso' THEN r.express_code ELSE r.local_code END)::VARCHAR, r.code,
           t.fare, t.estimated_minutes, t.started_at
    FROM trips t
    JOIN routes r ON r.id = t.route_id
    JOIN stations sf ON sf.id = t.from_station_id
    JOIN stations st ON st.id = t.to_station_id
    WHERE t.user_id = p_user_id
      AND t.ended_at IS NULL
      AND t.started_at + make_interval(mins => t.estimated_minutes + 30) > NOW()
    ORDER BY t.started_at DESC
    LIMIT 1;
$$;

-- Terminar un viaje propio. TRUE si estaba abierto.
CREATE OR REPLACE FUNCTION fn_trip_finish(p_user_id INTEGER, p_trip_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE trips SET ended_at = NOW()
    WHERE trips.id = p_trip_id AND trips.user_id = p_user_id AND trips.ended_at IS NULL;
    RETURN FOUND;
END;
$$;
