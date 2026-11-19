#!/bin/bash
# Se ejecuta UNA vez, cuando el volumen de PostgreSQL está vacío (docker-entrypoint-initdb.d).
set -euo pipefail

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /milenew/database/scripts/01_init.sql
# Usuario de mínimos privilegios para la API: solo puede ejecutar funciones fn_*
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     -v app_password="'${APP_DB_PASSWORD}'" -f /milenew/database/scripts/02_app_role.sql
