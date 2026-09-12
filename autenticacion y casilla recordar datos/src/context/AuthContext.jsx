import { createContext, useContext, useState } from 'react'
import { login as loginService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const loginUser = async (credentials, rememberMe) => {
    try {
      const response = await loginService(credentials)
      const data = response.data 

      
      if (rememberMe) {
        localStorage.setItem('token', data.token)
      } else {
        sessionStorage.setItem('token', data.token)
      }

      setUser(data.user)
      return data
    } catch (error) {
      throw error
    }
  }

  const value = { user, setUser, loginUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}