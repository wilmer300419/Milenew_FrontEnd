import { createContext, useCallback, useContext, useMemo } from 'react'
import { usePolling } from '../hooks/usePolling.js'
import { usePreferences } from './PreferencesContext.jsx'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/transitService.js'

const NotificationsContext = createContext(null)

/** Avisos compartidos por el menú de la barra e Inicio (una sola consulta). */
export function NotificationsProvider({ children }) {
  const { prefs } = usePreferences()
  const q = usePolling(getNotifications, 30000)
  const { refresh } = q
  const all = q.data ?? []
  // "Novedades del servicio" desactivadas: solo avisos personales
  const items = prefs.notifyNews ? all : all.filter((n) => n.personal)
  const unread = all.filter((n) => n.unread).length

  const markRead = useCallback(
    async (id) => {
      await markNotificationRead(id)
      refresh()
    },
    [refresh],
  )

  const markAll = useCallback(async () => {
    await markAllNotificationsRead()
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ items, unread, loading: q.loading, markRead, markAll }),
    [items, unread, q.loading, markRead, markAll],
  )
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationsProvider')
  return ctx
}
