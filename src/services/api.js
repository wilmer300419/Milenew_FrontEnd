import axios from 'axios'
import { clearToken, getToken } from './tokenStorage'

// El FrontEnd SOLO habla con la API REST de Flask (nunca con PostgreSQL).
// En desarrollo, '/api' lo reenvía Vite al BackEnd (ver vite.config.js).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Adjunta el token JWT (si hay sesión) a cada petición
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor de respuesta: devuelve el cuerpo { success, message, data, meta? }
// y normaliza errores del backend Flask a { message, status, errors }.
// Sin respuesta del servidor (caído / sin red) status queda undefined.
// Estado de conexión con el BackEnd: avisa a ConnectionBanner solo cuando cambia
let reachable = true
function setReachable(value) {
  if (value === reachable) return
  reachable = value
  window.dispatchEvent(new CustomEvent('api:connection', { detail: value }))
}

api.interceptors.response.use(
  (response) => {
    setReachable(true)
    return response.data
  },
  (error) => {
    setReachable(Boolean(error.response))
    const status = error.response?.status
    const message = error.response?.data?.message || 'Ocurrió un error inesperado'

    // Token vencido o inválido: se borra y se avisa a AuthContext para cerrar sesión
    if (status === 401 && getToken()) {
      clearToken()
      window.dispatchEvent(new Event('auth:logout'))
    }

    return Promise.reject({ message, status, errors: error.response?.data?.errors ?? null })
  },
)

export default api
