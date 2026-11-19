import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRouteVehicles, getStations } from '../services/transitService.js'
import { addFavorite, getFavorites, removeFavorite } from '../services/userService.js'
import { usePolling } from './usePolling.js'

export const LIVE_INTERVAL = 2000

let stationsCache = null
let stationsPromise = null

/** Una sola petición compartida por todos los componentes que piden estaciones. */
function loadStations() {
  if (!stationsPromise) {
    stationsPromise = getStations()
      .then((res) => {
        stationsCache = res.data ?? []
        return stationsCache
      })
      .catch((err) => {
        stationsPromise = null // se puede reintentar
        throw err
      })
  }
  return stationsPromise
}

/** Estaciones de la troncal (se piden una sola vez por sesión del navegador). */
export function useStations() {
  const [stations, setStations] = useState(stationsCache ?? [])
  const [loading, setLoading] = useState(!stationsCache)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    loadStations()
      .then((list) => active && setStations(list))
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return { stations, loading, error }
}

/** Buses de la ruta en vivo (consulta cada 2 s). */
export function useVehicles(interval = LIVE_INTERVAL) {
  const q = usePolling(getRouteVehicles, interval)
  return { ...q, vehicles: q.data?.vehicles ?? [], secondsPerStop: q.data?.secondsPerStop ?? 20 }
}

/** Favoritas guardadas en la BD, con actualización optimista. */
export function useFavorites(onError) {
  const [ids, setIds] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getFavorites()
      .then((res) => setIds(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const set = useMemo(() => new Set(ids), [ids])

  const toggle = useCallback(
    async (stationId) => {
      const had = set.has(stationId)
      setIds((prev) => (had ? prev.filter((id) => id !== stationId) : [...prev, stationId]))
      try {
        const res = await (had ? removeFavorite(stationId) : addFavorite(stationId))
        setIds(res.data ?? [])
        return !had
      } catch (err) {
        setIds((prev) => (had ? [...prev, stationId] : prev.filter((id) => id !== stationId)))
        onError?.(err)
        return had
      }
    },
    [set, onError],
  )

  return { ids, set, toggle, loaded }
}
