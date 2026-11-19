import api from './api'

export const getProfile = () => api.get('/users/me')

export const updateProfile = (profileData) => api.put('/users/me', profileData)

export const changePassword = ({ currentPassword, newPassword }) =>
  api.put('/users/me/password', { currentPassword, newPassword })

export const getFavorites = () => api.get('/users/me/favorites')

export const addFavorite = (stationId) => api.put(`/users/me/favorites/${stationId}`)

export const removeFavorite = (stationId) => api.delete(`/users/me/favorites/${stationId}`)

export const getPreferences = () => api.get('/users/me/preferences')

/** patch: { theme?, notifyArrivals?, notifyNews? } */
export const updatePreferences = (patch) => api.put('/users/me/preferences', patch)

/** Derecho de supresión: borra la cuenta. Exige la contraseña actual. */
export const deleteAccount = (password) => api.delete('/users/me', { data: { password } })
