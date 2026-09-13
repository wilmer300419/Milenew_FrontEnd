import { useFetch } from '../../../hooks/useFetch.js'
import { getChecklist, postChecklistItem } from '../../../services/transitService.js'

function Checklist({ onAllComplete }) {
  const { data, loading, error, refetch } = useFetch(getChecklist, [])
  const items = data?.data ?? []

  const handleToggle = async (item) => {
    try {
      await postChecklistItem(item.id, !item.done)
      refetch()
      if (items.every((i) => (i.id === item.id ? !item.done : i.done))) onAllComplete?.()
    } catch {
      // se puede reintentar; el checklist queda como estaba
    }
  }

  if (loading) return <p className="empty">Cargando checklist…</p>
  if (error) return <p className="empty">No se pudo cargar el checklist pre-operacional.</p>
  if (!items.length) return <p className="empty">Sin ítems de checklist configurados.</p>

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className={`chk ${item.done ? 'on' : ''}`} onClick={() => handleToggle(item)}>
          <div className="bx">
            <svg viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="lb">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default Checklist
