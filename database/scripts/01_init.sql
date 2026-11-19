-- =============================================================
-- Script maestro: tablas, funciones y datos iniciales.
-- Se puede ejecutar desde cualquier carpeta (\ir resuelve rutas relativas a este archivo):
--   psql -h localhost -U postgres -d milenew -f database/scripts/01_init.sql
-- Es idempotente: se puede ejecutar varias veces.
-- (Los tests de integración del BackEnd leen este archivo para saber el orden.)
-- =============================================================
\set ON_ERROR_STOP on

BEGIN;
\ir ../tables/01_users.sql
\ir ../tables/02_auth_codes.sql
\ir ../tables/04_transit.sql
\ir ../tables/05_wallet.sql
\ir ../tables/06_notifications.sql
\ir ../tables/07_operations.sql
\ir ../tables/08_trips.sql
\ir ../tables/09_preferences.sql
\ir ../functions/00_triggers.sql
\ir ../functions/01_users.sql
\ir ../functions/02_auth_codes.sql
\ir ../functions/04_transit.sql
\ir ../functions/05_wallet.sql
\ir ../functions/06_notifications.sql
\ir ../functions/07_operations.sql
\ir ../functions/08_trips.sql
\ir ../functions/09_preferences.sql
\ir ../functions/10_central.sql
\ir 03_seed.sql
COMMIT;
