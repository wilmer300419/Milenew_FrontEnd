-- =============================================================
-- Script maestro: tablas, funciones y datos iniciales.
-- Ejecutar DESDE la carpeta database/ (las rutas \i son relativas):
--   cd database
--   psql -h localhost -U postgres -d milenew -f scripts/01_init.sql
-- Es idempotente: se puede ejecutar varias veces.
-- (Los tests de integración del BackEnd leen este archivo para saber el orden.)
-- =============================================================
\set ON_ERROR_STOP on

BEGIN;
\i tables/01_users.sql
\i tables/02_auth_codes.sql
\i tables/03_products.sql
\i tables/04_transit.sql
\i tables/05_wallet.sql
\i tables/06_notifications.sql
\i tables/07_operations.sql
\i tables/08_trips.sql
\i tables/09_preferences.sql
\i functions/00_triggers.sql
\i functions/01_users.sql
\i functions/02_auth_codes.sql
\i functions/03_products.sql
\i functions/04_transit.sql
\i functions/05_wallet.sql
\i functions/06_notifications.sql
\i functions/07_operations.sql
\i functions/08_trips.sql
\i functions/09_preferences.sql
\i scripts/03_seed.sql
COMMIT;
