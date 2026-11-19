import { expect } from '@playwright/test'

export const DEMO = {
  passenger: { email: 'pasajero@milenew.co', password: 'Pasajero123' },
  driver: { email: 'conductor@milenew.co', password: 'Conductor123' },
  central: { email: 'central@milenew.co', password: 'Central123' },
}

/** Toca el "No soy un robot" y espera a que quede verificado. */
export async function passCaptcha(page) {
  const check = page.getByRole('checkbox', { name: 'No soy un robot' })
  await expect(check).toBeEnabled({ timeout: 20_000 })
  await check.click()
  await expect(page.getByRole('checkbox', { name: 'Verificado' })).toBeVisible({ timeout: 20_000 })
}

/** Inicia sesión por la interfaz, como lo haría una persona. */
export async function login(page, { email, password }) {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await passCaptcha(page)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

export async function logout(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).first().click()
  await expect(page).toHaveURL(/\/login/)
}

export const uniqueEmail = (prefix) => `${prefix}.${Date.now()}@e2e.milenew.co`
