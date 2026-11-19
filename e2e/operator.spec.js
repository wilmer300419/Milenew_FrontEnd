import { expect, test } from '@playwright/test'
import { DEMO, login, logout } from './helpers.js'

async function endShift(page) {
  await page.getByRole('button', { name: 'Terminar turno' }).click()
  await page.getByRole('dialog', { name: 'Terminar turno' }).getByRole('button', { name: 'Terminar turno' }).click()
  await expect(page.getByRole('button', { name: 'Iniciar turno' })).toBeVisible()
}

test('turno del operador, SOS atendido por la central y aviso confirmado', async ({ page }) => {
  const note = `Patrulla en camino ${Date.now()}`
  const notice = `Desvío por obras ${Date.now()}`

  // ---- operador: checklist completo -> inicia turno -> SOS (mantener 2 s)
  await login(page, DEMO.driver)
  await expect(page).toHaveURL(/\/operador$/)
  // Si quedó un turno abierto de una corrida anterior, se cierra primero
  await expect(page.getByRole('button', { name: /^(Iniciar|Terminar) turno$/ })).toBeVisible()
  if (await page.getByRole('button', { name: 'Terminar turno' }).isVisible()) await endShift(page)
  const pending = page.locator('#checklist .chk:not(.on)')
  await expect(page.locator('#checklist .chk').first()).toBeVisible()
  while (await pending.count()) {
    await pending.first().click()
    await page.waitForTimeout(150)
  }
  await page.getByRole('button', { name: 'Iniciar turno' }).click()
  await expect(page.getByText('En turno', { exact: true })).toBeVisible()
  await expect(page.getByText('Tiempo conducido', { exact: true })).toBeVisible()

  const sos = page.getByRole('button', { name: /^SOS: mantén presionado/ })
  await expect(sos.or(page.getByText('SOS activo'))).toBeVisible()
  if (await sos.isVisible()) {
    // (si quedó un SOS abierto de una corrida anterior, la central lo cierra más abajo)
    await sos.hover()
    await page.mouse.down()
    await page.waitForTimeout(2400)
    await page.mouse.up()
  }
  await expect(page.getByText('SOS activo')).toBeVisible()
  await logout(page)

  // ---- central: ve la alerta, cierra el SOS y publica un aviso solo para operadores
  await login(page, DEMO.central)
  await expect(page.getByRole('alert').filter({ hasText: 'activó SOS' })).toBeVisible()
  const incident = page.getByRole('listitem').filter({ hasText: 'Emergencia (SOS)' }).first()
  await expect(incident).toContainText('B75 · 7042')
  await incident.getByRole('button', { name: 'Cerrar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cerrar incidencia' })
  await dialog.getByLabel(/Qué se hizo/).fill(note)
  await dialog.getByRole('button', { name: 'Cerrar incidencia' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'activó SOS' })).toBeHidden()

  await page.getByRole('link', { name: 'Flota' }).first().click()
  await page.getByRole('tab', { name: 'Solo operadores' }).click()
  await page.getByLabel('Título').fill(notice)
  await page.getByRole('button', { name: 'Enviar a operadores' }).click()
  await expect(page.getByText(notice)).toBeVisible()
  await logout(page)

  // ---- operador: ve la respuesta, confirma el aviso y termina el turno
  await login(page, DEMO.driver)
  await expect(page.getByText(note)).toBeVisible()
  await expect(page.getByRole('button', { name: /^SOS: mantén presionado/ })).toBeVisible()
  const card = page.locator('.notice').filter({ hasText: notice })
  await card.getByRole('button', { name: 'Enterado' }).click()
  await expect(card.getByLabel('Confirmado')).toBeVisible()

  await endShift(page)
  await expect(page.getByText('Fuera de turno', { exact: true })).toBeVisible()
  await expect(page.getByText(/Último turno/)).toBeVisible()
})
