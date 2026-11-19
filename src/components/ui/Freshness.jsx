import { useNow } from '../../hooks/useNow.js'

/** "Actualizado hace 2 s" — se pone en alerta si los datos tienen más de 15 s. */
function Freshness({ at }) {
  const now = useNow(1000)
  if (!at) return <span className="freshness">Conectando…</span>
  const s = Math.max(0, Math.round((now - at) / 1000))
  const stale = s > 15
  return (
    <span className={`freshness ${stale ? 'stale' : ''}`} aria-live="off">
      {stale ? 'Datos sin actualizar hace ' : 'Actualizado hace '}
      {s < 60 ? `${s} s` : `${Math.round(s / 60)} min`}
    </span>
  )
}

export default Freshness
