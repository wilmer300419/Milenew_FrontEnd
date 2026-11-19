import { defineConfig, devices } from '@playwright/test'

// Pruebas de punta a punta (navegador real → FrontEnd → API → PostgreSQL).
// Requisitos: base de datos inicializada y usuarios demo (`flask seed-demo-users`).
// Por defecto levanta el BackEnd y Vite; con E2E_BASE_URL usa una app ya corriendo.
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Opcional: usar un Chromium ya instalado en el equipo
        launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'flask --app run.py run --port 5000',
          cwd: 'backend',
          url: 'http://localhost:5000/api/health',
          reuseExistingServer: true,
          timeout: 60_000,
        },
        { command: 'npm run dev', url: BASE_URL, reuseExistingServer: true, timeout: 60_000 },
      ],
})
