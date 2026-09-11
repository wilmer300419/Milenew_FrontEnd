import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // ASUNCIÓN: el BackEnd maneja la sesión con una cookie HTTP-only
  // (Flask-Login / Flask session) en vez de un token en localStorage.
  // Si tu BackEnd usa JWT por header en su lugar, avísame para ajustar
  // esto y en su lugar adjuntar el token vía interceptor de request.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de respuesta: normaliza errores del backend Flask
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || 'Ocurrió un error inesperado'
    return Promise.reject({ message, status: error.response?.status })
  },
)

export default api
