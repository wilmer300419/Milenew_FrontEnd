import api from './api'

// Paso 1 del login: credenciales + captcha. Si el BackEnd tiene 2FA activo
// responde data.requiresTwoFactor = true y envía un código por correo.
export const login = (credentials) => api.post('/auth/login', credentials)

// Paso 2 del login (solo si el paso 1 pidió 2FA).
export const verifyLoginCode = ({ email, code, rememberMe }) => api.post('/auth/login/verify-2fa', { email, code, rememberMe })

export const register = (userData) => api.post('/auth/register', userData)

export const logout = () => api.post('/auth/logout')

// Recuperación: el BackEnd responde igual exista o no el correo.
export const requestPasswordReset = ({ email }) => api.post('/auth/recovery/request', { email })

export const resetPassword = ({ email, code, newPassword }) =>
  api.post('/auth/recovery/reset', { email, code, newPassword })

/** Cierra la sesión en todos los dispositivos (incluido este). */
export const logoutEverywhere = () => api.post('/auth/logout-all')
