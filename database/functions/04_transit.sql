-- =============================================================
-- Funciones: rutas, estaciones, vehículos e incidencias
-- =============================================================

-- (v6 agregó columnas: se borran antes de recrearlas)
DROP FUNCTION IF EXISTS fn_route_get(VARCHAR);
DROP FUNCTION IF EXISTS fn_station_list(VARCHAR);

CREATE OR REPLACE FUNCTION fn_route_get(p_code VARCHAR)
RETURNS TABLE (id INTEGER, code VARCHAR, name VARCHAR, fare NUMERIC, minutes_per_stop NUMERIC,
               express_code VARCHAR, local_code VARCHAR, color VARCHAR, station_count BIGINT)
LANGUAGE sql
STABLE
AS $$
    SELECT r.id, r.code, r.name, r.fare, r.minutes_per_stop, r.express_code, r.local_code, r.color,
           (SELECT COUNT(*) FROM stations s WHERE s.route_id = r.id)
    FROM routes r
    WHERE r.code = p_code;
$$;

-- Todas las troncales.
CREATE OR REPLACE FUNCTION fn_route_list()
RETURNS TABLE (id INTEGER, code VARCHAR, name VARCHAR, fare NUMERIC, minutes_per_stop NUMERIC,
               express_code VARCHAR, local_code VARCHAR, color VARCHAR, station_count BIGINT)
LANGUAGE sql
STABLE
AS $$
    SELECT r.id, r.code, r.name, r.fare, r.minutes_per_stop, r.express_code, r.local_code, r.color,
           (SELECT COUNT(*) FROM stations s WHERE s.route_id = r.id)
    FROM routes r
    ORDER BY r.id;
$$;

-- Estaciones de una ruta en orden norte -> sur.
CREATE OR REPLACE FUNCTION fn_station_list(p_route_code VARCHAR)
RETURNS TABLE (id INTEGER, code VARCHAR, name VARCHAR, sort_order INTEGER,
               is_express_stop BOOLEAN, accesses TEXT[], lat NUMERIC, lng NUMERIC, route_code VARCHAR)
LANGUAGE sql
STABLE
AS $$
    SELECT s.id, s.code, s.name, s.sort_order, s.is_express_stop, s.accesses, s.lat, s.lng, r.code
    FROM stations s
    JOIN routes r ON r.id = s.route_id
    WHERE r.code = p_route_code
    ORDER BY s.sort_order;
$$;

-- Funciones retiradas (ya no las usa el BackEnd): se borran de bases existentes
DROP FUNCTION IF EXISTS fn_vehicle_get(VARCHAR);
DROP FUNCTION IF EXISTS fn_vehicle_get_by_route(VARCHAR);

-- Todos los buses de una ruta.
CREATE OR REPLACE FUNCTION fn_vehicle_list_by_route(p_route_code VARCHAR)
RETURNS TABLE (id INTEGER, code VARCHAR, label VARCHAR, service VARCHAR,
               route_code VARCHAR, cars_count INTEGER, driver_id INTEGER)
LANGUAGE sql
STABLE
AS $$
    SELECT v.id, v.code, COALESCE(v.label, v.code)::VARCHAR, v.service, r.code, v.cars_count, v.driver_id
    FROM vehicles v
    JOIN routes r ON r.id = v.route_id
    WHERE r.code = p_route_code
    ORDER BY v.id;
$$;

-- Bus asignado a un conductor (0 filas si no tiene).
CREATE OR REPLACE FUNCTION fn_vehicle_get_by_driver(p_driver_id INTEGER)
RETURNS TABLE (id INTEGER, code VARCHAR, label VARCHAR, service VARCHAR,
               route_code VARCHAR, cars_count INTEGER, driver_id INTEGER)
LANGUAGE sql
STABLE
AS $$
    SELECT v.id, v.code, COALESCE(v.label, v.code)::VARCHAR, v.service, r.code, v.cars_count, v.driver_id
    FROM vehicles v
    JOIN routes r ON r.id = v.route_id
    WHERE v.driver_id = p_driver_id;
$$;

-- Asigna un bus a un conductor (libera cualquier otro bus que tuviera).
CREATE OR REPLACE FUNCTION fn_vehicle_assign_driver(p_vehicle_code VARCHAR, p_driver_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE vehicles SET driver_id = NULL WHERE vehicles.driver_id = p_driver_id;
    UPDATE vehicles SET driver_id = p_driver_id WHERE vehicles.code = p_vehicle_code;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION fn_incident_category_list()
RETURNS TABLE (name VARCHAR)
LANGUAGE sql
STABLE
AS $$
    SELECT c.name FROM incident_categories c ORDER BY c.name;
$$;

-- Crear incidencia. Lanza foreign_key_violation (23503) si la categoría no existe.
CREATE OR REPLACE FUNCTION fn_incident_create(
    p_category    VARCHAR,
    p_description VARCHAR,
    p_user_id     INTEGER,
    p_route_code  VARCHAR
)
RETURNS TABLE (id INTEGER, category VARCHAR, description VARCHAR, status VARCHAR,
               created_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO incidents (category, description, user_id, route_id)
    VALUES (p_category, NULLIF(trim(p_description), ''), p_user_id,
            (SELECT r.id FROM routes r WHERE r.code = p_route_code))
    RETURNING incidents.id, incidents.category, incidents.description,
              incidents.status, incidents.created_at;
END;
$$;
