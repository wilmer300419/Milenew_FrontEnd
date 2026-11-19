import { expect, test } from '@playwright/test'
import { DEMO, login, logout } from './helpers.js'

test('la central atiende una incidencia y el pasajero recibe el aviso', async ({ page }) => {
  const detail = `Puerta trabada ${Date.now()}`

  await login(page, DEMO.passenger)
  await page.getByRole('link', { name: 'En vivo' }).first().click()
  await page.getByRole('button', { name: 'Reportar incidencia' }).click()
  const modal = page.getByRole('dialog', { name: 'Reportar incidencia' })
  await modal.getByRole('button', { name: 'Falla mecánica' }).click()
  await modal.getByLabel('Detalle (opcional)').fill(detail)
  await modal.getByRole('button', { name: 'Enviar reporte' }).click()
  await expect(modal).toBeHidden()
  await logout(page)

  await login(page, DEMO.central)
  await expect(page).toHaveURL(/\/central$/)
  const incident = page.getByRole('listitem').filter({ hasText: detail })
  await incident.getByRole('button', { name: 'Cerrar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cerrar incidencia' })
  await dialog.getByLabel(/Qué se hizo/).fill('Técnico enviado a la estación')
  await dialog.getByRole('button', { name: 'Cerrar incidencia' }).click()
  await expect(page.getByText(/Avisamos a Pasajero/)).toBeVisible()
  await logout(page)

  await login(page, DEMO.passenger)
  await page.getByRole('button', { name: /^Avisos/ }).click()
  await expect(page.getByText('Técnico enviado a la estación', { exact: false }).first()).toBeVisible()
  await logout(page)
})

test('el operador y la central conversan en tiempo real', async ({ page }) => {
  const message = `Retraso en Calle 57 ${Date.now()}`

  await login(page, DEMO.driver)
  await expect(page).toHaveURL(/\/operador$/)
  await page.getByPlaceholder('Escribe a la central…').fill(message)
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText(message)).toBeVisible()
  await logout(page)

  await login(page, DEMO.central)
  await page.getByRole('link', { name: 'Mensajes' }).first().click()
  await page.getByRole('button', { name: /Conductor Demo/ }).click()
  await expect(page.getByText(message)).toBeVisible()
  await page.getByRole('button', { name: 'Apoyo en camino' }).click()
  await logout(page)

  await login(page, DEMO.driver)
  await expect(page.getByText('Apoyo en camino').last()).toBeVisible({ timeout: 15_000 })
})
