import axios from 'axios'

// El FrontEnd SOLO habla con la API REST de Flask (nunca con PostgreSQL).
// En desarrollo, '/api' lo reenvía Vite al BackEnd (ver vite.config.js).
//
// Sesión: el BackEnd la guarda en una cookie httpOnly que JavaScript no puede leer.
// `withCredentials` la envía también si la API está en otro dominio, y
// `X-Requested-With` es la cabecera que el BackEnd exige contra CSRF.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000,
})

// Estado de conexión con el BackEnd: avisa a ConnectionBanner solo cuando cambia
let reachable = true
function setReachable(value) {
  if (value === reachable) return
  reachable = value
  window.dispatchEvent(new CustomEvent('api:connection', { detail: value }))
}

// Devuelve el cuerpo { success, message, data, meta? } y normaliza errores a { message, status, errors }.
// Sin respuesta del servidor (caído / sin red) status queda undefined.
api.interceptors.response.use(
  (response) => {
    setReachable(true)
    return response.data
  },
  (error) => {
    setReachable(Boolean(error.response))
    const status = error.response?.status
    const message = error.response?.data?.message || 'Ocurrió un error inesperado'

    // Sesión vencida o cerrada en otro dispositivo: AuthContext limpia el usuario
    if (status === 401) window.dispatchEvent(new Event('auth:logout'))

    return Promise.reject({ message, status, errors: error.response?.data?.errors ?? null })
  },
)

export default api
