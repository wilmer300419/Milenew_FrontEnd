import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Ejecuta fetchFn al montar y luego cada `interval` ms. Se pausa con la pestaña
 * oculta. Devuelve { data, error, loading, refresh, fetchedAt }.
 */
export function usePolling(fetchFn, interval, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true, fetchedAt: 0 })
  const fnRef = useRef(fetchFn)
  fnRef.current = fetchFn

  const run = useCallback(async () => {
    try {
      const res = await fnRef.current()
      setState({ data: res?.data ?? null, error: null, loading: false, fetchedAt: Date.now() })
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }))
    }
  }, [])

  useEffect(() => {
    let timer = null
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    const tick = async () => {
      if (cancelled) return
      if (!document.hidden) await run()
      if (!cancelled && interval) timer = setTimeout(tick, interval)
    }
    tick()

    const onVisible = () => !document.hidden && run()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, interval, ...deps])

  return { ...state, refresh: run }
}
