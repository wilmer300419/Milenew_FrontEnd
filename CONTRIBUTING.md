# Cómo trabajar en Milenew

Un solo repositorio para los tres equipos:

| Carpeta | Equipo |
| --- | --- |
| `src/`, `public/`, `e2e/` | FrontEnd (React) |
| `backend/` | BackEnd (Flask) |
| `database/` | Base de datos (PostgreSQL) |
| `docs/API.md` | Contrato entre FrontEnd y BackEnd (se acuerda entre ambos) |

**Regla de oro:** el FrontEnd solo llama a `/api`. El BackEnd solo ejecuta funciones `fn_*` de `database/functions/`.
Nadie accede a PostgreSQL desde el navegador.

## Ramas (GitFlow)

```text
main ──────────────●──────────────●────    versiones estables (solo por PR desde develop o hotfix/*)
                   ↑              ↑
develop ──●──●──●──┴──●──●──●──●──┴────    integración (solo por PR)
          ↑  ↑        ↑
   feature/frontend-login   feature/backend-wallet …
```

| Rama | Para qué | Sale de | Se fusiona en |
| --- | --- | --- | --- |
| `main` | Versión estable | — | — |
| `develop` | Integración del equipo | `main` | `main` (en cada versión) |
| `feature/<area>-<tarea>` | Una tarea de Jira | `develop` | `develop` |
| `fix/<area>-<error>` | Corregir algo en develop | `develop` | `develop` |
| `hotfix/<error>` | Error urgente en producción | `main` | `main` y `develop` |

`<area>` es `frontend`, `backend` o `database`. Ejemplos: `feature/frontend-mapa`,
`feature/backend-recargas`, `fix/database-indice-viajes`.

No se trabaja directo en `main` ni en `develop`: GitHub lo impide.
Las ramas de tarea se borran solas al fusionar el PR.

## Paso a paso de una tarea

```bash
git checkout develop
git pull
git checkout -b feature/frontend-mi-tarea

# … programar, probar …
git add -A
git commit -m "feat: descripción corta en presente"
git push -u origin feature/frontend-mi-tarea
```

Luego abre un **Pull Request hacia `develop`** y llena la plantilla. Se fusiona cuando:

1. Pasa la integración continua (lint, pruebas del FrontEnd, pytest y pruebas de punta a punta).
2. Lo aprueba al menos una persona de tu equipo (y del otro equipo si cambia `docs/API.md`).

Si `develop` avanzó mientras trabajabas: `git pull origin develop` en tu rama y resuelve conflictos.

## Mensajes de commit

[Conventional Commits](https://www.conventionalcommits.org/es/): `feat:`, `fix:`, `refactor:`, `docs:`,
`test:`, `chore:`. Un commit = un cambio con sentido.

## Antes de abrir el PR

```bash
npm run lint && npm test                         # FrontEnd
cd backend && pytest -v                          # BackEnd
psql -h localhost -U postgres -d milenew -f database/scripts/01_init.sql   # BD: debe correr dos veces sin error
```

Nunca subas `.env`, contraseñas ni claves (están en `.gitignore`).
