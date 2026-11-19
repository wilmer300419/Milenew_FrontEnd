# Contrato de API — Milenew (TransMilenio · Troncal Caracas)

Base URL: `/api` (en desarrollo Vite reenvía `/api` → `http://localhost:5000`).

```
React ──HTTP/JSON──▶ Flask (/api) ──SELECT * FROM fn_*(...)──▶ PostgreSQL
```

- El FrontEnd **solo** consume estos endpoints; nunca se conecta a PostgreSQL.
- Las credenciales de la BD viven únicamente en `backend/.env`.
- El BackEnd solo ejecuta funciones almacenadas `fn_*` (`database/functions/`). Con
  `database/scripts/02_app_role.sql` el usuario del BackEnd ni siquiera puede leer las tablas.

## Formato

Éxito: `{ "success": true, "message": "…", "data": …, "meta"?: {…} }`
Error: `{ "success": false, "message": "…", "errors"?: { "campo": "detalle" } }`

Claves en **camelCase**. `src/services/api.js` devuelve el cuerpo y convierte errores en
`{ message, status, errors }` (`status` es `undefined` si el servidor no responde).

| Código | Significado |
| --- | --- |
| 200 / 201 | OK / creado |
| 400 | Datos inválidos (ver `errors`), código 2FA/recuperación inválido, contraseña actual incorrecta |
| 401 | Sin token, token vencido o credenciales incorrectas → el FrontEnd cierra la sesión |
| 403 | Rol sin permiso (p. ej. pasajero en el panel de conductor) |
| 404 / 405 | No existe / método no permitido |
| 409 | Correo ya registrado |
| 500 / 503 | Error interno (sin detalles) / sin conexión a la base de datos o a reCAPTCHA |

**Autenticación (navegador):** cookie `milenew_session` **httpOnly** (JavaScript no puede leerla), `Path=/api`,
`SameSite=Lax`. La pone el BackEnd al registrarse o iniciar sesión; dura `JWT_EXPIRES_MINUTES` (60) o
`REMEMBER_DAYS` (30) con `rememberMe: true`. Las peticiones que modifican datos con cookie deben enviar
`X-Requested-With: XMLHttpRequest` (protección CSRF; sin ella → 403).
Clientes que no son navegador pueden usar `Authorization: Bearer <token>`.

Cada sesión es **revocable**: cerrar sesión la invalida en el servidor; cambiar o recuperar la contraseña y
`/auth/logout-all` cierran todas. Límite de intentos: login 10/min, registro 5/min, recuperación 5/15 min → 429.

🔒 = requiere sesión · 🚍 = rol `driver` · 🛡 = rol `admin` (central) · 👤? = sesión opcional.

Objeto `User`: `{ id, name, email, role }` con `role` ∈ `user` | `driver` | `admin`.

---

## Auth — `src/services/authService.js`

| Método | Ruta | Body | `data` |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ email, password, captchaToken, rememberMe? }` | `{ user }` + cookie, o `{ requiresTwoFactor: true }` |
| POST | `/auth/login/verify-2fa` | `{ email, code, rememberMe? }` | `{ user }` + cookie |
| POST | `/auth/register` | `{ name, email, password, acceptTerms: true, captchaToken }` | `{ user }` + cookie |
| POST | `/auth/logout` | — | `null` (revoca la sesión y borra la cookie) |
| POST | `/auth/logout-all` 🔒 | — | `null` (cierra todas las sesiones del usuario) |
| POST | `/auth/recovery/request` | `{ email }` | `null` (mismo mensaje exista o no el correo) |
| POST | `/auth/recovery/reset` | `{ email, code, newPassword }` | `null` |

- **reCAPTCHA:** v2 invisible; el FrontEnd dibuja su propio control "No soy un robot" y Google solo muestra un reto si sospecha.
  El BackEnd valida `captchaToken` con Google **antes** de mirar las credenciales.
  Si `RECAPTCHA_SECRET_KEY` está vacío no se valida (solo desarrollo).
- **2FA:** con `TWO_FACTOR_ENABLED=true` el login envía un código de 6 dígitos por correo.
  Vence en `AUTH_CODE_TTL_MINUTES` minutos y se invalida tras `AUTH_CODE_MAX_ATTEMPTS` intentos fallidos.
- **Correo:** sin `MAIL_SERVER` los códigos se imprimen en la consola de `flask run`.
- Login fallido → 401 `"Correo o contraseña incorrectos"` (mismo mensaje si el correo no existe).

## Perfil — `src/services/userService.js`

| Método | Ruta | Body | `data` |
| --- | --- | --- | --- |
| GET | `/users/me` 🔒 | — | `User` |
| PUT | `/users/me` 🔒 | `{ name, email }` | `User` (409 si el correo es de otra cuenta) |
| PUT | `/users/me/password` 🔒 | `{ currentPassword, newPassword }` | `null` + cookie nueva (cierra las otras sesiones) |
| DELETE | `/users/me` 🔒 | `{ password }` | `null` — borra la cuenta y sus datos (Ley 1581) |

## Troncal — `src/services/transitService.js`

| Método | Ruta | `data` |
| --- | --- | --- |
| GET | `/transit/routes` | `[{ code, name, fare, expressCode, localCode, color, stationCount }]` |
| GET | `/transit/stations?route=` | `Station[]` en orden norte → sur (por defecto `caracas-b75`) |
| GET | `/transit/routes/:routeId/vehicles` | `{ routeId, routeName, secondsPerStop, serverTime, vehicles: Vehicle[] }` (todos los buses en vivo) |
| GET | `/transit/stations/:stationId/arrivals` | `{ station, arrivals: [{ vehicleId, label, service, direction, etaSeconds, currentStation }], serverTime }` |
| GET | `/transit/incident-categories` | `string[]` |
| GET | `/transit/my-vehicle` 🚍 | `Vehicle` del bus asignado + `headway` (404 si no tiene bus) |
| GET | `/transit/trip-plan?from=<stationId>&to=<stationId>` | igual a `computeTripPlan` (`sameStation, stops, direction, fare, bestService, bestMinutes, savedMinutes, expressAvailable, legs`) |
| POST | `/transit/incidents` 👤? | body `{ category, description? }` → `{ id, category, description, status, createdAt }` |
| GET | `/transit/checklist` 🚍 | `[{ id, label, done }]` del día |
| POST | `/transit/checklist` 🚍 | body `{ itemId, done }` → `{ id, label, done }` |
| GET | `/transit/operations-chat` 🚍 | `[{ id, from: "driver" \| "central", text, createdAt }]` |
| POST | `/transit/operations-chat` 🚍 | body `{ message }` → mensaje creado |
| GET | `/transit/shift` 🚍 | `{ active: Shift \| null, last: Shift \| null, requirements: { hasVehicle, checklistDone, checklistTotal } }` |
| POST | `/transit/shift/start` 🚍 | `Shift` (201). 400 si el checklist del día no está completo, 409 si ya hay turno |
| POST | `/transit/shift/break` 🚍 | body `{ active }` → `Shift` (inicia o termina la pausa) |
| POST | `/transit/shift/end` 🚍 | `Shift` cerrado con el resumen guardado en `stats` |
| GET | `/transit/driver-reports` 🚍 | `{ reports: [{ id, category, description, status, priority, location, resolutionNote, createdAt }], categories: string[] }` |
| POST | `/transit/driver-reports` 🚍 | body `{ sos: true }` o `{ category, description? }` → reporte (201). Un SOS abierto no se duplica (200) |
| GET | `/transit/driver-notices` 🚍 | avisos generales de los últimos 3 días: `[{ id, title, description, audience, createdAt, relativeTime, acked }]` |
| POST | `/transit/driver-notices/:id/ack` 🚍 | `null` (confirma que el operador leyó el aviso) |

- `Station`: `{ id, code, name, sortOrder, isExpressStop, accesses: string[], lat, lng, routeCode }`
  (coordenadas aproximadas, para el mapa).
- Troncales: `caracas-b75` (B75/C15) y `autonorte-b13` (B13/C19). `trip-plan`, `arrivals` y `POST /trips`
  aceptan la troncal (`?route=` o `routeId`).
- `cars`: `[{ n, pct }]`
- `Vehicle`: `{ vehicleId, label, service, currentIndex, nextIndex, position, direction, atStation, speed, occupancyPct, cars, currentStation, nextStation, upcomingStops: [{ stationId, index, name, etaSeconds }] }`.
  `service` es `"Expreso"` o `"Corriente"`. `position` es continuo (índice de estación con decimales) para animar el bus entre estaciones.
  Los **expresos** solo paran en estaciones con `isExpressStop`.
- `direction`: `"sur"` o `"norte"`
- `headway`: `{ ahead: { label, service, seconds }, behind: {...}, status: "early" | "on_time" | "late", deviationSeconds, targetSeconds }`
  — intervalo con el bus de adelante y el de atrás del mismo servicio (`null` si no hay otros buses).
- `Shift`: `{ id, vehicleCode, routeCode, startedAt, endedAt, onBreak, breakStartedAt, breakSeconds, drivingSeconds, continuousSeconds, breakRecommended, stats }`
  con `stats: { stops, km, laps, passengers, punctualityPct }` — **estimaciones** a escala real a partir del
  tiempo conducido (la simulación del mapa va acelerada). `breakRecommended` tras 4 h de conducción continua.
- Rutas y vehículos de la semilla: `caracas-b75` y `vagon-02`.
- Categorías de incidencia (tabla `incident_categories`, columna `scope`): pasajeros → `Falla mecánica`,
  `Seguridad`, `Vía / tráfico`, `Aglomeración`; operadores → `Falla mecánica`, `Seguridad`, `Vía / tráfico`,
  `Accidente de tránsito`, `Emergencia médica` (+ `Emergencia (SOS)` solo con `{ sos: true }`).
- ⚠️ **Posición y telemetría son simuladas** (no hay GPS real): el bus recorre la troncal ida y
  vuelta y tarda `SIMULATION_SECONDS_PER_STOP` segundos por tramo. Al inicio de cada tramo está
  detenido (`speed: 0`), así que en ese momento sí se pueden abrir las puertas.

## Tarjeta TuLlave y notificaciones

| Método | Ruta | Body | `data` |
| --- | --- | --- | --- |
| GET | `/wallet` 🔒 | — | `{ balance, currency: "COP", updatedAt }` |
| POST | `/wallet/recharge` 🔒 | `{ amount }` entero entre 1.000 y 500.000 | `{ balance, currency, updatedAt }` |
| GET | `/wallet/transactions` 🔒 | — | `[{ id, type, amount, balanceAfter, description, createdAt }]` (`type`: `recharge` o `fare`) |
| GET | `/notifications` 👤? | — | `[{ id, title, description, createdAt, personal, unread, relativeTime }]` + `meta.unreadCount` |
| POST | `/notifications/:id/read` 🔒 | — | `{ unreadCount }` |
| POST | `/notifications/read-all` 🔒 | — | `{ updated, unreadCount }` |

## Viajes y favoritas

| Método | Ruta | Body | `data` |
| --- | --- | --- | --- |
| GET | `/trips` 🔒 | — | `[{ id, fromStationId, fromName, toStationId, toName, service, fare, estimatedMinutes, startedAt, endedAt }]` |
| POST | `/trips` 🔒 | `{ fromStationId, toStationId }` | viaje + `balance`, `minutes`, `arrivesAt` |
| GET | `/trips/active` 🔒 | — | viaje en curso con `arrivesAt`, o `null` |
| POST | `/trips/:id/finish` 🔒 | — | `null` (404 si no es tuyo o ya terminó) |
| GET | `/users/me/preferences` 🔒 | — | `{ theme: "dark" \| "light", notifyArrivals, notifyNews }` |
| PUT | `/users/me/preferences` 🔒 | cualquiera de esos campos | preferencias actualizadas |
| GET | `/users/me/favorites` 🔒 | — | `number[]` (ids de estación) |
| PUT | `/users/me/favorites/:stationId` 🔒 | — | `number[]` actualizado |
| DELETE | `/users/me/favorites/:stationId` 🔒 | — | `number[]` actualizado |

`POST /trips` calcula el mejor servicio y descuenta el pasaje de la TuLlave en una sola
transacción y cierra el viaje anterior si seguía abierto. Si no alcanza el saldo responde 400
"Saldo insuficiente". Un viaje deja de estar "en curso" al terminarlo o 30 min después de su llegada estimada.

- Sin sesión, `/notifications` devuelve solo los avisos generales; con sesión, también los personales.
- Cada recarga crea una notificación personal **"Recarga exitosa"**.

## Central de operaciones 🛡 (rol admin)

| Método | Ruta | Body | `data` |
| --- | --- | --- | --- |
| GET | `/admin/summary` | — | `{ openIncidents, inProgressIncidents, drivers, assignedVehicles, vehicles, unreadMessages, passengers, sosOpen, activeShifts }` |
| GET | `/admin/incidents?status=` | — | incidencias (`open`, `in_progress`, `closed` o todas) con `reporterName`, `routeName`, `resolutionNote`, `priority`, `vehicleLabel`, `location`, `fromDriver`. Los SOS sin cerrar van primero |
| PATCH | `/admin/incidents/:id` | `{ status, note? }` | al cerrar, quien la reportó recibe un aviso personal |
| GET | `/admin/conversations` | — | una por operador: `{ driverId, driverName, vehicleLabel, lastText, lastSender, lastAt, unread }` |
| GET | `/admin/conversations/:driverId` | — | mensajes (los marca como leídos) |
| POST | `/admin/conversations/:driverId` | `{ message }` | mensaje enviado por la central |
| GET | `/admin/fleet` | — | `{ vehicles: [... shiftStatus: "on" \| "break" \| "off"], drivers: [...] }` |
| PUT | `/admin/fleet/:vehicleCode/driver` | `{ driverId \| null }` | flota actualizada (un operador = un bus) |
| GET / POST | `/admin/notices` | `{ title, description, audience? }` | avisos generales; `audience`: `all` (todos) o `drivers` (solo operadores). El GET incluye `acks` (operadores que confirmaron) |
| DELETE | `/admin/notices/:id` | — | `null` |

## Salud

`GET /health` → `{ api: "ok", database: "ok" }`, o 503 si no hay base de datos.

---

## Endpoint → función almacenada

| Endpoint | Función(es) |
| --- | --- |
| login / register / me / perfil | `fn_user_get_auth_by_email`, `fn_user_get_auth_by_id`, `fn_user_create`, `fn_user_get_by_id`, `fn_user_update_profile`, `fn_user_update_password` |
| 2FA / recuperación | `fn_auth_code_create`, `fn_auth_code_get_active`, `fn_auth_code_register_failure`, `fn_auth_code_consume`, `fn_user_reset_password_with_code` |
| estaciones / buses / viaje | `fn_route_get`, `fn_station_list`, `fn_vehicle_list_by_route`, `fn_vehicle_get_by_driver` |
| incidencias | `fn_incident_category_list`, `fn_incident_create` |
| tarjeta | `fn_wallet_get`, `fn_wallet_recharge` |
| notificaciones | `fn_notification_list` |
| checklist / chat | `fn_checklist_list`, `fn_checklist_set`, `fn_chat_list`, `fn_chat_create` |
| buses / operador | `fn_vehicle_list_by_route`, `fn_vehicle_get_by_driver`, `fn_vehicle_assign_driver` |
| central | `fn_central_summary`, `fn_incident_list`, `fn_incident_update`, `fn_chat_conversations`, `fn_chat_mark_read`, `fn_fleet_list`, `fn_driver_list`, `fn_vehicle_unassign`, `fn_notice_create`, `fn_notice_list`, `fn_notice_delete` |
| turno / novedades / avisos del operador | `fn_shift_get_open`, `fn_shift_get_last`, `fn_shift_start`, `fn_shift_set_break`, `fn_shift_end`, `fn_driver_report_create`, `fn_driver_report_list`, `fn_driver_notice_list`, `fn_notice_ack` |
| sesiones / cuenta | `fn_session_check`, `fn_session_revoke`, `fn_user_bump_token_version`, `fn_user_delete` |
| troncales | `fn_route_list`, `fn_route_get`, `fn_station_list` |
| preferencias / avisos leídos | `fn_preferences_get`, `fn_preferences_update`, `fn_notification_mark_read`, `fn_notification_mark_all_read`, `fn_notification_unread_count` |
| viajes / favoritas / movimientos | `fn_trip_create`, `fn_trip_list`, `fn_trip_get_active`, `fn_trip_finish`, `fn_favorite_list`, `fn_favorite_add`, `fn_favorite_remove`, `fn_wallet_transaction_list` |
