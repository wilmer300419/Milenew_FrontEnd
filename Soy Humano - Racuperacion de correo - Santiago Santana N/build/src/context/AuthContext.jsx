import { createContext, useContext, useState } from 'react'
import { logout as logoutRequest } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const logout = async () => {
    try {
      await logoutRequest()
    } finally {
      // Sin importar si la petición al BackEnd falla, limpiamos el estado
      // local para que la interfaz refleje que ya no hay sesión.
      setUser(null)
    }
  }

  const value = { user, setUser, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
