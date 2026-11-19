import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { useTheme } from './ThemeContext.jsx'
import { getPreferences, updatePreferences } from '../services/userService.js'

const PreferencesContext = createContext(null)
const DEFAULTS = { theme: 'dark', notifyArrivals: true, notifyNews: true }

/**
 * Preferencias del usuario guardadas en el BackEnd (tema y avisos).
 * Sin sesión, el tema solo se guarda en este navegador.
 */
export function PreferencesProvider({ children }) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = useState(DEFAULTS)
  const userId = user?.id

  useEffect(() => {
    if (!userId) {
      setPrefs((p) => ({ ...DEFAULTS, theme: p.theme }))
      return
    }
    let active = true
    getPreferences()
      .then((res) => {
        if (!active || !res.data) return
        setPrefs(res.data)
        setTheme(res.data.theme)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [userId, setTheme])

  const update = useCallback(
    async (patch) => {
      const previous = prefs
      const next = { ...prefs, ...patch }
      setPrefs(next)
      if (patch.theme) setTheme(patch.theme)
      if (!userId) return next
      try {
        const res = await updatePreferences(patch)
        setPrefs(res.data)
        return res.data
      } catch (err) {
        setPrefs(previous)
        if (patch.theme) setTheme(previous.theme)
        throw err
      }
    },
    [prefs, userId, setTheme],
  )

  const value = useMemo(() => ({ prefs: { ...prefs, theme }, update }), [prefs, theme, update])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences debe usarse dentro de PreferencesProvider')
  return ctx
}
