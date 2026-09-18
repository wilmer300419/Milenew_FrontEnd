import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
