-- =============================================================
-- Red de transporte: rutas, estaciones, vehículos e incidencias
-- =============================================================

-- Ruta / servicio (p. ej. caracas-b75 = Troncal Caracas, Calle 76 <-> Portal Tunal)
CREATE TABLE IF NOT EXISTS routes (
    id                SERIAL PRIMARY KEY,
    code              VARCHAR(40)   NOT NULL UNIQUE,
    name              VARCHAR(120)  NOT NULL,
    fare              NUMERIC(10, 2) NOT NULL,
    minutes_per_stop  NUMERIC(5, 2) NOT NULL DEFAULT 2.1,
    CONSTRAINT chk_routes_fare CHECK (fare >= 0),
    CONSTRAINT chk_routes_minutes CHECK (minutes_per_stop > 0)
);

-- Estaciones en orden norte -> sur (sort_order 0 = terminal norte)
CREATE TABLE IF NOT EXISTS stations (
    id               SERIAL PRIMARY KEY,
    route_id         INTEGER      NOT NULL REFERENCES routes (id) ON DELETE CASCADE,
    code             VARCHAR(40)  NOT NULL UNIQUE,
    name             VARCHAR(120) NOT NULL,
    sort_order         INTEGER      NOT NULL,
    is_express_stop  BOOLEAN      NOT NULL DEFAULT FALSE,
    accesses         TEXT[]       NOT NULL DEFAULT ARRAY['Norte', 'Sur'],
    CONSTRAINT uq_stations_route_sort_order UNIQUE (route_id, sort_order),
    CONSTRAINT chk_stations_sort_order CHECK (sort_order >= 0)
);

-- Vehículos (buses articulados) asignados a una ruta
CREATE TABLE IF NOT EXISTS vehicles (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(40) NOT NULL UNIQUE,
    route_id    INTEGER     NOT NULL REFERENCES routes (id) ON DELETE CASCADE,
    cars_count  INTEGER     NOT NULL DEFAULT 4,
    CONSTRAINT chk_vehicles_cars CHECK (cars_count BETWEEN 1 AND 8)
);

-- Catálogo de categorías de incidencia
CREATE TABLE IF NOT EXISTS incident_categories (
    name VARCHAR(60) PRIMARY KEY
);

-- Incidencias reportadas por pasajeros (user_id NULL = anónimo)
CREATE TABLE IF NOT EXISTS incidents (
    id           SERIAL PRIMARY KEY,
    category     VARCHAR(60)  NOT NULL REFERENCES incident_categories (name),
    description  VARCHAR(500),
    user_id      INTEGER      REFERENCES users (id) ON DELETE SET NULL,
    route_id     INTEGER      REFERENCES routes (id) ON DELETE SET NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'open',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_incidents_status CHECK (status IN ('open', 'in_progress', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents (created_at DESC);

-- ---- v2: servicio, etiqueta y conductor asignado (idempotente, actualiza BD existentes)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS label     VARCHAR(60);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS service   VARCHAR(20) NOT NULL DEFAULT 'Corriente';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS chk_vehicles_service;
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_service CHECK (service IN ('Corriente', 'Expreso'));
CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicles_driver ON vehicles (driver_id) WHERE driver_id IS NOT NULL;

-- ---- v4: seguimiento de incidencias desde la central (idempotente)
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolution_note VARCHAR(500);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS handled_by INTEGER REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ---- v6: varias troncales en un mapa real (idempotente)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS express_code VARCHAR(10) NOT NULL DEFAULT 'EXP';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS local_code   VARCHAR(10) NOT NULL DEFAULT 'COR';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS color        VARCHAR(9)  NOT NULL DEFAULT '#b43c3a';
-- Coordenadas aproximadas (WGS84) para el mapa geográfico
ALTER TABLE stations ADD COLUMN IF NOT EXISTS lat NUMERIC(9, 6);
ALTER TABLE stations ADD COLUMN IF NOT EXISTS lng NUMERIC(9, 6);
