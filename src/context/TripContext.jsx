import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'
import { usePreferences } from './PreferencesContext.jsx'
import { finishTrip, getActiveTrip } from '../services/tripService.js'

const TripContext = createContext(null)
const POLL_MS = 20000

/** Viaje en curso del pasajero, compartido por la barra, Inicio y Viajes. */
export function TripProvider({ children }) {
  const { isPassenger } = useAuth()
  const { prefs } = usePreferences()
  const toast = useToast()
  const [trip, setTrip] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const notified = useRef(null)
  const enabled = isPassenger

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await getActiveTrip()
      setTrip(res.data ?? null)
    } catch {
      // conservamos el último estado conocido
    } finally {
      setLoaded(true)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setTrip(null)
      return undefined
    }
    refresh()
    const id = setInterval(() => !document.hidden && refresh(), POLL_MS)
    return () => clearInterval(id)
  }, [enabled, refresh])

  // Aviso de llegada (si el usuario lo tiene activado en sus preferencias)
  useEffect(() => {
    if (!trip || !prefs.notifyArrivals) return undefined
    const ms = new Date(trip.arrivesAt).getTime() - Date.now() - 60000
    if (ms < 0 || notified.current === trip.id) return undefined
    const id = setTimeout(() => {
      notified.current = trip.id
      toast.info(`Estás por llegar a ${trip.toName}. Alístate para bajar.`)
    }, ms)
    return () => clearTimeout(id)
  }, [trip, prefs.notifyArrivals, toast])

  const finish = useCallback(async () => {
    if (!trip) return
    await finishTrip(trip.id)
    setTrip(null)
  }, [trip])

  const value = useMemo(() => ({ trip, loaded, setTrip, refresh, finish }), [trip, loaded, refresh, finish])
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useActiveTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useActiveTrip debe usarse dentro de TripProvider')
  return ctx
}
