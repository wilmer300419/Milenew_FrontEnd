import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'
import { PreferencesProvider } from '../context/PreferencesContext.jsx'
import { ToastProvider } from '../context/ToastContext.jsx'
import { TripProvider } from '../context/TripContext.jsx'

/** Renderiza con todos los proveedores de la app. `routes` agrega rutas extra para probar navegación. */
export function renderApp(ui, { path = '/', routes = {} } = {}) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <ToastProvider>
            <TripProvider>
              <MemoryRouter initialEntries={[path]}>
                <Routes>
                  <Route path={path} element={ui} />
                  {Object.entries(routes).map(([p, el]) => (
                    <Route key={p} path={p} element={el} />
                  ))}
                </Routes>
              </MemoryRouter>
            </TripProvider>
          </ToastProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>,
  )
}

export const STATIONS = [
  { id: 1, code: 'calle-76', name: 'Calle 76', sortOrder: 0, isExpressStop: true, accesses: [] },
  { id: 2, code: 'flores', name: 'Flores', sortOrder: 1, isExpressStop: false, accesses: [] },
  { id: 3, code: 'calle-26', name: 'Calle 26', sortOrder: 2, isExpressStop: true, accesses: [] },
  { id: 4, code: 'avenida-jimenez', name: 'Avenida Jiménez', sortOrder: 3, isExpressStop: true, accesses: [] },
]
