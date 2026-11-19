# Configuración del repositorio en GitHub (una sola vez)

La hace una persona con rol **Admin** del repositorio (hoy: el dueño, `wilmer300419`).
Todo es desde la web: **github.com/wilmer300419/Milenew_FrontEnd → Settings**.

## 1. Renombrar `Develop` → `develop`

**Code → Branches** → en `Develop`, el lápiz ✏️ → escribir `develop` → *Rename branch*.
GitHub redirige el nombre viejo y actualiza los PR abiertos.

Luego, cada integrante en su equipo:

```bash
git fetch origin --prune
git branch -m Develop develop 2>/dev/null; git branch -u origin/develop develop
git remote set-head origin -a
```

## 2. Rama por defecto: `develop`

**Settings → General → Default branch** → `develop`. Así los PR apuntan a `develop` por defecto.

## 3. Proteger `main` y `develop`

**Settings → Rules → Rulesets → New branch ruleset** (o *Branches → Add rule*), una regla con
*Target branches* = `main` y `develop`:

- ✅ Restrict deletions
- ✅ Block force pushes
- ✅ Require a pull request before merging → 1 aprobación · *Dismiss stale approvals*
  · *Require review from Code Owners* (cuando se llene `.github/CODEOWNERS`)
- ✅ Require status checks to pass → `Frontend · lint, pruebas y build`,
  `Backend · pytest contra PostgreSQL`, `E2E · recorridos completos en el navegador`
  (aparecen después de la primera ejecución de la CI)
- ✅ Require conversation resolution before merging

## 4. Borrar las ramas al fusionar

**Settings → General → Pull Requests** → ✅ *Automatically delete head branches*.
Recomendado también: dejar solo *Allow squash merging* (historial limpio en `develop`).

## 5. Limpiar ramas viejas

Están vacías (solo el README inicial) o su trabajo ya está en `develop`. Antes de borrarlas se guarda
una etiqueta `archive/…` por si alguien necesita recuperar algo:

```bash
git fetch origin --prune
for b in DanielDev DueñasDev SebastianDev Feature HotFix JuanDev MclovinDev feature/frontend-setup; do
  git tag "archive/$b" "origin/$b"
done
git push origin --tags
git push origin --delete DanielDev DueñasDev SebastianDev Feature HotFix JuanDev MclovinDev feature/frontend-setup
```

Para recuperar una: `git checkout -b JuanDev archive/JuanDev`.

## 6. (Opcional) Renombrar el repositorio a `Milenew`

Ahora contiene FrontEnd, BackEnd y base de datos. **Settings → General → Repository name** → `Milenew`.
GitHub redirige la URL vieja; cada integrante puede actualizar con
`git remote set-url origin https://github.com/wilmer300419/Milenew.git`.

## 7. Equipos y revisores

Dar acceso a los 13 integrantes (**Settings → Collaborators**) y completar `.github/CODEOWNERS` con sus
usuarios de GitHub para que cada equipo revise su carpeta.

## 8. Versiones estables

Cuando `develop` esté probado: PR de `develop` → `main`, y al fusionar crear una versión en
**Releases → Draft a new release** con etiqueta `v1.0.0`, `v1.1.0`…
