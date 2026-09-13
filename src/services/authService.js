import api from './api'

// Paso 1 del login: valida credenciales + captcha. Si el BackEnd tiene 2FA
// habilitado, NO inicia sesión todavía: responde algo como
// { success: true, requiresTwoFactor: true, message: '...' } y envía el
// código por correo. Si requiresTwoFactor es false/ausente, ya viene la
// sesión iniciada (data.user + data.token).
export const login = (credentials) => api.post('/auth/login', credentials)

// Paso 2 del login (solo si el paso 1 devolvió requiresTwoFactor: true).
export const verifyLoginCode = ({ email, code }) =>
  api.post('/auth/login/verify-2fa', { email, code })

export const register = (userData) => api.post('/auth/register', userData)

export const logout = () => api.post('/auth/logout')

// Recuperación de cuenta — paso 1: solicitar código de un solo uso.
// El BackEnd debe responder éxito genérico exista o no el correo, para no
// revelar qué correos están registrados.
export const requestPasswordReset = ({ email }) => api.post('/auth/recovery/request', { email })

// Recuperación de cuenta — paso 2: canjear el código por una contraseña nueva.
export const resetPassword = ({ email, code, newPassword }) =>
  api.post('/auth/recovery/reset', { email, code, newPassword })
