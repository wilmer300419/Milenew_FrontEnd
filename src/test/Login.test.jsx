import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../pages/auth/Login.jsx'
import { login } from '../services/authService'
import { renderApp } from './render.jsx'

vi.mock('../services/authService', () => ({ login: vi.fn(), verifyLoginCode: vi.fn(), logout: vi.fn() }))
// El widget real de Google no corre en pruebas: lo reemplaza un botón que "resuelve" el captcha
vi.mock('../components/auth/Recaptcha.jsx', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return {
    default: forwardRef(function FakeCaptcha({ onVerify }, ref) {
      useImperativeHandle(ref, () => ({ reset() {} }))
      return (
        <button type="button" onClick={() => onVerify('captcha-ok')}>
          No soy un robot
        </button>
      )
    }),
  }
})

const user = { id: 1, name: 'Ana Pérez', email: 'ana@milenew.co', role: 'user' }

describe('Login', () => {
  it('exige el captcha y entra con las credenciales', async () => {
    login.mockResolvedValue({ data: { user, token: 'jwt' } })
    renderApp(<Login />, { path: '/login', routes: { '/app': <p>Panel del pasajero</p> } })

    await userEvent.type(screen.getByLabelText('Correo'), 'ana@milenew.co')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta123')
    const submit = screen.getByRole('button', { name: 'Entrar' })
    expect(submit).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'No soy un robot' }))
    await userEvent.click(submit)

    expect(login).toHaveBeenCalledWith({ email: 'ana@milenew.co', password: 'secreta123', captchaToken: 'captcha-ok', rememberMe: false })
    expect(await screen.findByText('Panel del pasajero')).toBeInTheDocument()
    // el token nunca queda en el navegador: lo maneja la cookie httpOnly del servidor
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain('jwt')
  })

  it('muestra el error del servidor', async () => {
    login.mockRejectedValue({ message: 'Correo o contraseña incorrectos', status: 401 })
    renderApp(<Login />, { path: '/login' })
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@milenew.co')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
    await userEvent.click(screen.getByRole('button', { name: 'No soy un robot' }))
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeInTheDocument()
  })
})
