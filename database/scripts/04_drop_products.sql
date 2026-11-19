-- =============================================================
-- (Opcional) Limpieza: la tabla "products" venía de la plantilla
-- inicial y la app de TransMilenio ya no la usa.
--   psql -h localhost -U postgres -d milenew -f database/scripts/04_drop_products.sql
-- =============================================================
DROP FUNCTION IF EXISTS fn_product_list(VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_product_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_product_create(VARCHAR, TEXT, NUMERIC, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_product_update(INTEGER, VARCHAR, TEXT, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS fn_product_delete(INTEGER);
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
DROP TABLE IF EXISTS products;
