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

-- Categorías de incidencia (deben coincidir con las del FrontEnd)
INSERT INTO incident_categories (name) VALUES
    ('Falla mecánica'), ('Seguridad'), ('Vía / tráfico'), ('Aglomeración')
ON CONFLICT (name) DO NOTHING;

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
