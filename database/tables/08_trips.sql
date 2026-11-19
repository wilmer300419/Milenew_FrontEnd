-- =============================================================
-- Estaciones favoritas y viajes pagados con la tarjeta TuLlave
-- =============================================================
CREATE TABLE IF NOT EXISTS user_favorite_stations (
    user_id     INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    station_id  INTEGER     NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, station_id)
);

CREATE TABLE IF NOT EXISTS trips (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    route_id         INTEGER        NOT NULL REFERENCES routes (id),
    from_station_id  INTEGER        NOT NULL REFERENCES stations (id),
    to_station_id    INTEGER        NOT NULL REFERENCES stations (id),
    service          VARCHAR(20)    NOT NULL,
    fare             NUMERIC(10, 2) NOT NULL,
    started_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trips_service CHECK (service IN ('Corriente', 'Expreso')),
    CONSTRAINT chk_trips_distinct CHECK (from_station_id <> to_station_id),
    CONSTRAINT chk_trips_fare CHECK (fare >= 0)
);

CREATE INDEX IF NOT EXISTS idx_trips_user ON trips (user_id, started_at DESC);

-- ---- v3: viaje en curso (duración estimada y fin del viaje). Idempotente.
ALTER TABLE trips ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER NOT NULL DEFAULT 10;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_trips_user_open ON trips (user_id) WHERE ended_at IS NULL;
