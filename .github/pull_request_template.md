## ¿Qué cambia?

<!-- Resume en 1–3 líneas qué hace este PR y por qué. -->

**Tarea de Jira:** <!-- MIL-123 -->

## Tipo de cambio

- [ ] Nueva funcionalidad (`feat`)
- [ ] Corrección de error (`fix`)
- [ ] Refactor / limpieza (`refactor`)
- [ ] Documentación (`docs`)
- [ ] Base de datos (tablas o funciones `fn_*`)

## Área

- [ ] FrontEnd (`src/`)
- [ ] BackEnd (`backend/`)
- [ ] Base de datos (`database/`)

## ¿Cómo se probó?

<!-- Pasos para que quien revisa lo compruebe (usuario de prueba, pantalla, endpoint…). -->

## Lista de verificación

- [ ] La rama sale de `develop` y el PR apunta a `develop`
- [ ] El FrontEnd solo llama a `/api`; nada accede a PostgreSQL desde el navegador
- [ ] El BackEnd solo usa funciones `fn_*` (sin SQL suelto)
- [ ] Si cambió la API, actualicé `docs/API.md`
- [ ] Si cambió la base, el script sigue siendo idempotente (`01_init.sql` se puede correr dos veces)
- [ ] `npm run lint` y `npm test` pasan · `pytest` pasa
- [ ] No subí claves, contraseñas ni archivos `.env`
