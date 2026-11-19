import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'
import { getProfile } from '../services/userService'
import { clearToken, getToken, saveToken } from '../services/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true mientras se valida un token guardado (p. ej. al recargar la página)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    getProfile()
      .then((res) => setUser(res?.data ?? null))
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // api.js emite este evento cuando el BackEnd responde 401 (token vencido)
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:logout', onExpired)
    return () => window.removeEventListener('auth:logout', onExpired)
  }, [])

  // rememberMe: localStorage (persiste) o sessionStorage (se borra al cerrar)
  const loginUser = useCallback((userData, token, rememberMe) => {
    if (token) saveToken(token, rememberMe)
    setUser(userData ?? null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // si el token ya no servía da igual: cerramos la sesión local
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      loginUser,
      logout,
      isOperator: user?.role === 'driver' || user?.role === 'admin',
    }),
    [user, loading, loginUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return context
}

/** Ruta de inicio según el rol. */
export const homeFor = (user) => (user?.role === 'driver' || user?.role === 'admin' ? '/operador' : '/app')
