import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROUTE_ID, getRouteVehicles, getRoutes, getStations } from '../services/transitService.js'
import { addFavorite, getFavorites, removeFavorite } from '../services/userService.js'
import { usePolling } from './usePolling.js'

export const LIVE_INTERVAL = 2000
export { ROUTE_ID as DEFAULT_ROUTE }

// ---------------------------------------------------------------- caché compartida
// Una sola petición por recurso aunque varios componentes lo pidan a la vez.
const cache = new Map()
function shared(key, loader) {
  if (!cache.has(key)) {
    const entry = { data: null, promise: null }
    entry.promise = loader()
      .then((res) => {
        entry.data = res.data ?? []
        return entry.data
      })
      .catch((err) => {
        cache.delete(key) // se puede reintentar
        throw err
      })
    cache.set(key, entry)
  }
  return cache.get(key)
}

function useShared(key, loader) {
  const entry = key ? shared(key, loader) : null
  const [data, setData] = useState(entry?.data ?? [])
  const [loading, setLoading] = useState(!entry?.data)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!key) return undefined
    let active = true
    setLoading(!cache.get(key)?.data)
    shared(key, loader)
      .promise.then((list) => active && setData(list))
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading, error }
}

/** Troncales disponibles. */
export function useRoutes() {
  const { data, loading } = useShared('routes', getRoutes)
  return { routes: data, loading }
}

/** Estaciones de una troncal (norte → sur). */
export function useStations(route = ROUTE_ID) {
  const { data, loading, error } = useShared(route ? `stations:${route}` : null, () => getStations(route))
  return { stations: data, loading, error }
}

/** Estaciones de TODAS las troncales (para favoritas y viajes). */
export function useAllStations() {
  const { routes } = useRoutes()
  const [all, setAll] = useState([])
  const codes = routes.map((r) => r.code).join(',')

  useEffect(() => {
    if (!codes) return undefined
    let active = true
    Promise.all(codes.split(',').map((code) => shared(`stations:${code}`, () => getStations(code)).promise))
      .then((lists) => active && setAll(lists.flat()))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [codes])

  return all
}

/** Nombre corto: "Troncal Caracas · Calle 76 ↔ Portal Tunal" → "Caracas". */
export const shortRouteName = (route) => route?.name?.split(' · ')[0].replace('Troncal ', '') ?? ''

const ROUTE_KEY = 'milenew_route'

/** Troncal elegida por el usuario (se recuerda en este navegador). */
export function useSelectedRoute() {
  const [route, setRouteState] = useState(() => {
    try {
      return localStorage.getItem(ROUTE_KEY) || ROUTE_ID
    } catch {
      return ROUTE_ID
    }
  })
  const setRoute = useCallback((code) => {
    setRouteState(code)
    try {
      localStorage.setItem(ROUTE_KEY, code)
    } catch {
      // sin persistencia
    }
  }, [])
  return [route, setRoute]
}

/** Buses de una troncal en vivo (consulta cada 2 s). */
export function useVehicles(route = ROUTE_ID, interval = LIVE_INTERVAL) {
  const q = usePolling(() => getRouteVehicles(route), interval, [route])
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
