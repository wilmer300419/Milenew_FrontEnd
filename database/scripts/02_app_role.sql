-- =============================================================
-- (Recomendado) Rol de aplicación con permisos mínimos.
-- El BackEnd se conecta con este usuario y SOLO puede ejecutar
-- las funciones fn_*: no tiene SELECT/INSERT/UPDATE/DELETE
-- directo sobre ninguna tabla.
--
-- Uso (como superusuario, después de 01_init.sql):
--   psql -h localhost -U postgres -d milenew -v app_password="'cambia_esto'" -f scripts/02_app_role.sql
-- Luego en backend/.env:  DATABASE_USER=milenew_app  DATABASE_PASSWORD=cambia_esto
-- =============================================================
\set ON_ERROR_STOP on

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'milenew_app') THEN
        CREATE ROLE milenew_app LOGIN;
    END IF;
END
$$;

ALTER ROLE milenew_app WITH PASSWORD :app_password;

DO $$
DECLARE
    r RECORD;
BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO milenew_app', current_database());
    GRANT USAGE ON SCHEMA public TO milenew_app;
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM milenew_app;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM milenew_app;

    -- Todas las funciones fn_* (menos la del trigger): se ejecutan con los
    -- permisos del dueño y con search_path fijo.
    FOR r IN
        SELECT p.oid::regprocedure AS signature
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname LIKE 'fn\_%'
          AND p.proname <> 'fn_set_updated_at'
    LOOP
        EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', r.signature);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.signature);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO milenew_app', r.signature);
    END LOOP;
END
$$;
