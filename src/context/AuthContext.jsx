import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'
import { getProfile } from '../services/userService'

const AuthContext = createContext(null)

const ROLE_LABELS = { user: 'Pasajero', driver: 'Operador', admin: 'Central' }
const HOMES = { user: '/app', driver: '/operador', admin: '/central' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Al abrir la app preguntamos al BackEnd si la cookie de sesión sigue vigente
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getProfile()
      .then((res) => active && setUser(res?.data ?? null))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // api.js emite este evento cuando el BackEnd responde 401 (sesión vencida o cerrada)
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:logout', onExpired)
    return () => window.removeEventListener('auth:logout', onExpired)
  }, [])

  // La cookie ya la puso el BackEnd; aquí solo guardamos quién es
  const loginUser = useCallback((userData) => setUser(userData ?? null), [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // aunque falle, la interfaz queda sin sesión
    } finally {
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
      isPassenger: user?.role === 'user',
      isOperator: user?.role === 'driver',
      isAdmin: user?.role === 'admin',
      roleLabel: ROLE_LABELS[user?.role] ?? '',
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
export const homeFor = (user) => HOMES[user?.role] ?? '/app'
