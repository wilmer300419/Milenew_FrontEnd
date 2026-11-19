-- =============================================================
-- Datos iniciales (idempotente).
-- Los usuarios NO se crean aquí: el hash de la contraseña lo genera
-- el BackEnd. Para usuarios de prueba:  flask seed-demo-users
-- =============================================================

-- Ruta Troncal Caracas (servicio B75)
INSERT INTO routes (code, name, fare, minutes_per_stop)
VALUES ('caracas-b75', 'Troncal Caracas · Calle 76 ↔ Portal Tunal', 3200, 2.1)
ON CONFLICT (code) DO NOTHING;

-- Estaciones norte -> sur (datos de ejemplo; el equipo de BD puede ajustarlos)
INSERT INTO stations (route_id, code, name, sort_order, is_express_stop, accesses)
SELECT r.id, s.code, s.name, s.sort_order, s.express, s.accesses
FROM routes r
CROSS JOIN (VALUES
    ('calle-76',        'Calle 76',         0, TRUE,  ARRAY['Calle 76', 'Calle 75']),
    ('calle-72',        'Calle 72',         1, TRUE,  ARRAY['Norte', 'Sur']),
    ('flores',          'Flores',           2, FALSE, ARRAY['Norte', 'Sur']),
    ('calle-63',        'Calle 63',         3, FALSE, ARRAY['Norte', 'Sur']),
    ('calle-57',        'Calle 57',         4, TRUE,  ARRAY['Norte', 'Sur']),
    ('marly',           'Marly',            5, FALSE, ARRAY['Norte', 'Sur']),
    ('calle-45',        'Calle 45',         6, TRUE,  ARRAY['Norte', 'Sur']),
    ('avenida-39',      'Avenida 39',       7, FALSE, ARRAY['Norte', 'Sur']),
    ('calle-26',        'Calle 26',         8, TRUE,  ARRAY['Norte', 'Sur', 'Conexión Calle 26']),
    ('calle-19',        'Calle 19',         9, FALSE, ARRAY['Norte', 'Sur']),
    ('avenida-jimenez', 'Avenida Jiménez', 10, TRUE,  ARRAY['Norte', 'Sur', 'Conexión Eje Ambiental']),
    ('tercer-milenio',  'Tercer Milenio',  11, TRUE,  ARRAY['Norte', 'Sur']),
    ('hospital',        'Hospital',        12, FALSE, ARRAY['Norte', 'Sur']),
    ('restrepo',        'Restrepo',        13, TRUE,  ARRAY['Norte', 'Sur']),
    ('olaya',           'Olaya',           14, FALSE, ARRAY['Norte', 'Sur']),
    ('quiroga',         'Quiroga',         15, FALSE, ARRAY['Norte', 'Sur']),
    ('calle-40-sur',    'Calle 40 Sur',    16, TRUE,  ARRAY['Norte', 'Sur']),
    ('biblioteca',      'Biblioteca',      17, FALSE, ARRAY['Norte', 'Sur']),
    ('portal-tunal',    'Portal Tunal',    18, TRUE,  ARRAY['Acceso principal', 'Alimentadores'])
) AS s(code, name, sort_order, express, accesses)
WHERE r.code = 'caracas-b75'
ON CONFLICT (code) DO NOTHING;

-- Buses que operan la ruta (expresos paran solo en estaciones marcadas)
INSERT INTO vehicles (code, route_id, cars_count, label, service)
SELECT v.code, r.id, v.cars, v.label, v.service
FROM routes r
CROSS JOIN (VALUES
    ('vagon-01', 4, 'B75 · 7041', 'Expreso'),
    ('vagon-02', 4, 'B75 · 7042', 'Expreso'),
    ('vagon-03', 3, 'C15 · 5120', 'Corriente'),
    ('vagon-04', 3, 'C15 · 5121', 'Corriente')
) AS v(code, cars, label, service)
WHERE r.code = 'caracas-b75'
ON CONFLICT (code) DO NOTHING;

-- Completa etiqueta/servicio en BD creadas con la versión anterior
UPDATE vehicles SET label = 'B75 · 7042', service = 'Expreso' WHERE code = 'vagon-02' AND label IS NULL;

-- Categorías de incidencia y quién puede usarlas (all, passenger o driver)
INSERT INTO incident_categories (name, scope) VALUES
    ('Falla mecánica', 'all'), ('Seguridad', 'all'), ('Vía / tráfico', 'all'), ('Aglomeración', 'passenger'),
    ('Accidente de tránsito', 'driver'), ('Emergencia médica', 'driver'), ('Emergencia (SOS)', 'driver')
ON CONFLICT (name) DO UPDATE SET scope = EXCLUDED.scope;

-- Checklist pre-operacional
INSERT INTO checklist_items (label, sort_order)
SELECT v.label, v.sort_order
FROM (VALUES
    ('Frenos verificados', 1),
    ('Luces y direccionales', 2),
    ('Puertas y sensores', 3),
    ('Extintor y botiquín', 4),
    ('Nivel de batería / combustible', 5)
) AS v(label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM checklist_items);

-- Avisos generales
INSERT INTO notifications (user_id, title, description, created_at)
SELECT NULL, v.title, v.description, NOW() - v.ago
FROM (VALUES
    ('Servicio B75 operando con normalidad', 'Frecuencia estimada de 4 minutos en la Troncal Caracas.', INTERVAL '5 minutes'),
    ('Obras en Avenida Jiménez', 'El acceso norte de la estación permanecerá cerrado esta semana.', INTERVAL '3 hours'),
    ('Recarga tu tarjeta TuLlave', 'Ahora puedes recargar desde la app sin hacer fila.', INTERVAL '2 days')
) AS v(title, description, ago)
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id IS NULL);

-- =============================================================
-- v6 · Red de troncales con coordenadas (aproximadas) para el mapa
-- =============================================================
UPDATE routes SET express_code = 'B75', local_code = 'C15', color = '#b43c3a' WHERE code = 'caracas-b75';

INSERT INTO routes (code, name, fare, minutes_per_stop, express_code, local_code, color)
VALUES ('autonorte-b13', 'Troncal Autonorte · Portal del Norte ↔ Héroes', 3200, 2.0, 'B13', 'C19', '#c6a346')
ON CONFLICT (code) DO NOTHING;

INSERT INTO stations (route_id, code, name, sort_order, is_express_stop, accesses)
SELECT r.id, s.code, s.name, s.sort_order, s.express, s.accesses
FROM routes r
CROSS JOIN (VALUES
    ('portal-norte', 'Portal del Norte',  0, TRUE,  ARRAY['Acceso principal', 'Alimentadores']),
    ('toberin',      'Toberín',           1, FALSE, ARRAY['Oriente', 'Occidente']),
    ('calle-161',    'Calle 161',         2, FALSE, ARRAY['Oriente', 'Occidente']),
    ('mazuren',      'Mazurén',           3, TRUE,  ARRAY['Oriente', 'Occidente']),
    ('calle-146',    'Calle 146',         4, FALSE, ARRAY['Oriente', 'Occidente']),
    ('calle-142',    'Calle 142',         5, FALSE, ARRAY['Oriente', 'Occidente']),
    ('alcala',       'Alcalá',            6, TRUE,  ARRAY['Oriente', 'Occidente']),
    ('prado',        'Prado',             7, FALSE, ARRAY['Oriente', 'Occidente']),
    ('calle-127',    'Calle 127',         8, TRUE,  ARRAY['Oriente', 'Occidente']),
    ('pepe-sierra',  'Pepe Sierra',       9, FALSE, ARRAY['Oriente', 'Occidente']),
    ('calle-106',    'Calle 106',        10, FALSE, ARRAY['Oriente', 'Occidente']),
    ('calle-100',    'Calle 100',        11, TRUE,  ARRAY['Oriente', 'Occidente']),
    ('virrey',       'Virrey',           12, FALSE, ARRAY['Oriente', 'Occidente']),
    ('calle-85',     'Calle 85',         13, FALSE, ARRAY['Oriente', 'Occidente']),
    ('heroes',       'Héroes',           14, TRUE,  ARRAY['Norte', 'Sur', 'Conexión Calle 80'])
) AS s(code, name, sort_order, express, accesses)
WHERE r.code = 'autonorte-b13'
ON CONFLICT (code) DO NOTHING;

INSERT INTO vehicles (code, route_id, cars_count, label, service)
SELECT v.code, r.id, v.cars, v.label, v.service
FROM routes r
CROSS JOIN (VALUES
    ('vagon-11', 4, 'B13 · 9011', 'Expreso'),
    ('vagon-12', 4, 'B13 · 9012', 'Expreso'),
    ('vagon-13', 3, 'C19 · 9020', 'Corriente')
) AS v(code, cars, label, service)
WHERE r.code = 'autonorte-b13'
ON CONFLICT (code) DO NOTHING;

-- Coordenadas aproximadas (para un mapa ilustrativo, no para navegación)
UPDATE stations s SET lat = c.lat, lng = c.lng
FROM (VALUES
    ('calle-76', 4.663600, -74.062600), ('calle-72', 4.657700, -74.063800), ('flores', 4.653200, -74.064700),
    ('calle-63', 4.647800, -74.065800), ('calle-57', 4.641700, -74.067000), ('marly', 4.636600, -74.067900),
    ('calle-45', 4.631400, -74.069000), ('avenida-39', 4.626200, -74.069900), ('calle-26', 4.616400, -74.072400),
    ('calle-19', 4.608800, -74.074800), ('avenida-jimenez', 4.603300, -74.078800), ('tercer-milenio', 4.598000, -74.083200),
    ('hospital', 4.592300, -74.088600), ('restrepo', 4.587800, -74.099000), ('olaya', 4.582200, -74.104700),
    ('quiroga', 4.576400, -74.109500), ('calle-40-sur', 4.571600, -74.114100), ('biblioteca', 4.568500, -74.125000),
    ('portal-tunal', 4.574500, -74.131600),
    ('portal-norte', 4.754600, -74.046100), ('toberin', 4.746600, -74.048500), ('calle-161', 4.739800, -74.049900),
    ('mazuren', 4.732600, -74.051200), ('calle-146', 4.727800, -74.052000), ('calle-142', 4.723200, -74.052800),
    ('alcala', 4.717600, -74.054000), ('prado', 4.711000, -74.055300), ('calle-127', 4.704600, -74.056500),
    ('pepe-sierra', 4.698000, -74.057700), ('calle-106', 4.691200, -74.059000), ('calle-100', 4.685300, -74.059900),
    ('virrey', 4.677200, -74.059500), ('calle-85', 4.671200, -74.060100), ('heroes', 4.666000, -74.061000)
) AS c(code, lat, lng)
WHERE s.code = c.code AND (s.lat IS DISTINCT FROM c.lat OR s.lng IS DISTINCT FROM c.lng);
