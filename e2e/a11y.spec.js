import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { DEMO, login } from './helpers.js'

// Auditoría automática WCAG 2.1 A/AA: falla si hay problemas graves o críticos.
async function audit(page, path) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(600) // deja terminar las animaciones de entrada
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('iframe') // widgets de terceros (reCAPTCHA)
    .exclude('.leaflet-container') // teselas del mapa de OpenStreetMap
    .analyze()
  const serious = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
  expect(serious, `${path}\n${serious.join('\n')}`).toEqual([])
}

test('páginas públicas sin problemas graves de accesibilidad', async ({ page }) => {
  for (const path of ['/', '/login', '/registro', '/recuperar-cuenta', '/privacidad']) await audit(page, path)
})

test('panel del pasajero sin problemas graves de accesibilidad', async ({ page }) => {
  await login(page, DEMO.passenger)
  for (const path of ['/app', '/app/en-vivo', '/app/viajes', '/app/tullave', '/app/perfil']) await audit(page, path)
})

test('central sin problemas graves de accesibilidad', async ({ page }) => {
  await login(page, DEMO.central)
  for (const path of ['/central', '/central/mensajes', '/central/flota']) await audit(page, path)
})

test('panel del operador sin problemas graves de accesibilidad', async ({ page }) => {
  await login(page, DEMO.driver)
  await audit(page, '/operador')
})
