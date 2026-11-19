-- =============================================================
-- Panel del operador: turnos, reportes con prioridad (SOS) y avisos
-- dirigidos a operadores con confirmación de lectura. Idempotente.
-- =============================================================

-- Turnos: como mucho uno abierto por operador
CREATE TABLE IF NOT EXISTS driver_shifts (
    id                SERIAL PRIMARY KEY,
    driver_id         INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vehicle_code      VARCHAR(40) NOT NULL,
    route_code        VARCHAR(40) NOT NULL,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at          TIMESTAMPTZ,
    break_started_at  TIMESTAMPTZ,                       -- no NULL = en pausa
    break_seconds     INTEGER     NOT NULL DEFAULT 0,    -- pausas ya terminadas
    last_break_end    TIMESTAMPTZ,                       -- para la conducción continua
    summary           JSONB,                             -- resumen congelado al cerrar
    CONSTRAINT chk_shift_end CHECK (ended_at IS NULL OR ended_at >= started_at),
    CONSTRAINT chk_shift_break CHECK (break_seconds >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shift_open ON driver_shifts (driver_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shifts_driver ON driver_shifts (driver_id, started_at DESC);

-- Categorías por público: all = todos, passenger = solo pasajeros, driver = solo operadores
ALTER TABLE incident_categories ADD COLUMN IF NOT EXISTS scope VARCHAR(10) NOT NULL DEFAULT 'all';
ALTER TABLE incident_categories DROP CONSTRAINT IF EXISTS chk_incident_categories_scope;
ALTER TABLE incident_categories ADD CONSTRAINT chk_incident_categories_scope
    CHECK (scope IN ('all', 'passenger', 'driver'));

-- Reportes de operadores: prioridad, bus y ubicación al momento del reporte
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority     VARCHAR(10) NOT NULL DEFAULT 'normal';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS vehicle_code VARCHAR(40);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS location     VARCHAR(150);
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS chk_incidents_priority;
ALTER TABLE incidents ADD CONSTRAINT chk_incidents_priority CHECK (priority IN ('normal', 'sos'));
CREATE INDEX IF NOT EXISTS idx_incidents_user ON incidents (user_id, created_at DESC);

-- Avisos generales: para todos o solo para operadores
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS audience VARCHAR(10) NOT NULL DEFAULT 'all';
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notifications_audience;
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_audience CHECK (audience IN ('all', 'drivers'));

-- Confirmaciones de lectura de avisos por parte de los operadores
CREATE TABLE IF NOT EXISTS notice_acks (
    notice_id  INTEGER     NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
    user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    acked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (notice_id, user_id)
);
