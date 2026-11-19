-- =============================================================
-- Funciones: products
-- =============================================================

-- Listar (búsqueda opcional por nombre + paginación).
CREATE OR REPLACE FUNCTION fn_product_list(
    p_search VARCHAR DEFAULT NULL,
    p_limit  INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (id INTEGER, name VARCHAR, description TEXT, price NUMERIC, quantity INTEGER,
               created_by INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
               total_count BIGINT)
LANGUAGE sql
STABLE
AS $$
    SELECT p.id, p.name, p.description, p.price, p.quantity,
           p.created_by, p.created_at, p.updated_at,
           COUNT(*) OVER () AS total_count
    FROM products p
    WHERE p_search IS NULL
       OR p_search = ''
       OR p.name ILIKE '%' || p_search || '%'
    ORDER BY p.id
    LIMIT  GREATEST(LEAST(COALESCE(p_limit, 50), 100), 1)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION fn_product_get_by_id(p_id INTEGER)
RETURNS TABLE (id INTEGER, name VARCHAR, description TEXT, price NUMERIC, quantity INTEGER,
               created_by INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
AS $$
    SELECT p.id, p.name, p.description, p.price, p.quantity,
           p.created_by, p.created_at, p.updated_at
    FROM products p
    WHERE p.id = p_id;
$$;

CREATE OR REPLACE FUNCTION fn_product_create(
    p_name        VARCHAR,
    p_description TEXT,
    p_price       NUMERIC,
    p_quantity    INTEGER,
    p_created_by  INTEGER
)
RETURNS TABLE (id INTEGER, name VARCHAR, description TEXT, price NUMERIC, quantity INTEGER,
               created_by INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO products (name, description, price, quantity, created_by)
    VALUES (trim(p_name), p_description, p_price, COALESCE(p_quantity, 0), p_created_by)
    RETURNING products.id, products.name, products.description, products.price,
              products.quantity, products.created_by, products.created_at, products.updated_at;
END;
$$;

-- Los parámetros NULL conservan el valor actual. 0 filas si no existe.
CREATE OR REPLACE FUNCTION fn_product_update(
    p_id          INTEGER,
    p_name        VARCHAR DEFAULT NULL,
    p_description TEXT    DEFAULT NULL,
    p_price       NUMERIC DEFAULT NULL,
    p_quantity    INTEGER DEFAULT NULL
)
RETURNS TABLE (id INTEGER, name VARCHAR, description TEXT, price NUMERIC, quantity INTEGER,
               created_by INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE products
    SET name        = COALESCE(trim(p_name), products.name),
        description = COALESCE(p_description, products.description),
        price       = COALESCE(p_price, products.price),
        quantity    = COALESCE(p_quantity, products.quantity)
    WHERE products.id = p_id
    RETURNING products.id, products.name, products.description, products.price,
              products.quantity, products.created_by, products.created_at, products.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION fn_product_delete(p_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM products WHERE products.id = p_id;
    RETURN FOUND;
END;
$$;
