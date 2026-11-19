#!/bin/sh
set -e
# Usuarios de prueba (pasajero, operador y central) solo si se pide explícitamente
if [ "${SEED_DEMO_USERS:-false}" = "true" ]; then
  flask --app run.py seed-demo-users
fi
exec gunicorn -c gunicorn.conf.py run:app
