import { createContext, useContext, useState } from 'react'
import { logout as logoutRequest } from '../services/authService'

const AuthContext = createContext(null)
const TOKEN_KEY = 'milenew_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // El caller decide dónde guardar el token: localStorage si marcó
  // "recordar datos", sessionStorage si no (se pierde al cerrar el navegador).
  const loginUser = (userData, token, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage
    if (token) storage.setItem(TOKEN_KEY, token)
    setUser(userData ?? null)
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } finally {
      // Pase lo que pase con la petición al BackEnd, limpiamos el estado
      // local para que la interfaz refleje que ya no hay sesión.
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }

  const value = { user, setUser, loginUser, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
