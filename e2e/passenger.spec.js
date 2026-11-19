import { expect, test } from '@playwright/test'
import { logout, passCaptcha, uniqueEmail } from './helpers.js'

test('un pasajero nuevo se registra, recarga, paga un viaje y lo ve en curso', async ({ page }) => {
  const email = uniqueEmail('pasajero')

  // Registro con aceptación de la política de datos y captcha
  await page.goto('/registro')
  await page.getByLabel('Nombre completo').fill('Laura E2E')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill('Prueba1234!')
  await page.getByLabel('Confirmar contraseña').fill('Prueba1234!')
  await page.getByRole('checkbox', { name: /Acepto la política/ }).check()
  await passCaptcha(page)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByRole('heading', { name: /Laura/ })).toBeVisible()

  // Recarga con confirmación (no cobra antes de confirmar)
  await page.getByRole('link', { name: 'TuLlave' }).first().click()
  await page.getByRole('button', { name: '$ 20.000', exact: true }).click()
  await page.getByRole('button', { name: 'Recargar $ 20.000' }).click()
  const recharge = page.getByRole('dialog', { name: 'Confirmar recarga' })
  await expect(recharge.getByText('Saldo después')).toBeVisible()
  await recharge.getByRole('button', { name: 'Recargar $ 20.000' }).click()
  await expect(page.getByText(/Nuevo saldo \$\s?20\.000/)).toBeVisible()

  // Planear con el buscador y pagar con confirmación
  await page.getByRole('link', { name: 'Viajes' }).first().click()
  await page.getByRole('combobox', { name: 'Origen' }).fill('calle 76')
  await page.keyboard.press('Enter')
  await page.getByRole('combobox', { name: 'Destino' }).fill('jimenez')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: /^Pagar/ }).click()
  const pay = page.getByRole('dialog', { name: 'Confirmar pago' })
  await expect(pay.getByText('Calle 76 → Avenida Jiménez')).toBeVisible()
  await pay.getByRole('button', { name: /^Pagar/ }).click()

  // Viaje en curso visible y persistente al cambiar de página
  await expect(page.getByText('Viaje en curso')).toBeVisible()
  await page.getByRole('link', { name: 'En vivo' }).first().click()
  await expect(page.getByRole('link', { name: /Vas a Avenida Jiménez/ })).toBeVisible()

  // La sesión vive en una cookie httpOnly: el token no aparece en el almacenamiento del navegador
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(stored).not.toMatch(/eyJ/)
  const cookies = await page.context().cookies()
  expect(cookies.find((c) => c.name === 'milenew_session')?.httpOnly).toBe(true)

  await logout(page)
})
