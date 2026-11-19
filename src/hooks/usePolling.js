import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Ejecuta fetchFn al montar y luego cada `interval` ms (0 = una sola vez).
 * Se pausa con la pestaña oculta. Devuelve { data, error, loading, refresh, fetchedAt }.
 * Solo vale la respuesta más reciente: si cambian las deps mientras una petición
 * sigue en camino, su respuesta (ya vieja) se descarta.
 */
export function usePolling(fetchFn, interval, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true, fetchedAt: 0 })
  const fnRef = useRef(fetchFn)
  const seq = useRef(0)
  fnRef.current = fetchFn

  // Subir el contador invalida cualquier respuesta que aún esté en camino
  const invalidate = useCallback(() => {
    seq.current += 1
  }, [])

  const run = useCallback(async () => {
    const id = ++seq.current
    try {
      const res = await fnRef.current()
      if (id === seq.current) setState({ data: res?.data ?? null, error: null, loading: false, fetchedAt: Date.now() })
    } catch (error) {
      if (id === seq.current) setState((s) => ({ ...s, error, loading: false }))
    }
  }, [])

  useEffect(() => {
    let timer = null
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    const tick = async () => {
      if (!document.hidden) await run()
      if (!cancelled && interval) timer = setTimeout(tick, interval)
    }
    tick()

    const onVisible = () => !document.hidden && run()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      invalidate() // deps nuevas o componente desmontado
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, invalidate, interval, ...deps])

  return { ...state, refresh: run }
}
