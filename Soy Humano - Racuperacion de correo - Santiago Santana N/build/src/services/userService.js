import api from './api'

// Obtiene los datos del usuario autenticado (requiere sesión iniciada).
export const getProfile = () => api.get('/users/me')

// Actualiza datos básicos del perfil (nombre, correo, etc.).
export const updateProfile = (profileData) => api.put('/users/me', profileData)

// Cambia la contraseña estando autenticado (distinto del flujo de
// recuperación: aquí el usuario ya tiene sesión y confirma su contraseña
// actual).
export const changePassword = ({ currentPassword, newPassword }) =>
  api.put('/users/me/password', { currentPassword, newPassword })
