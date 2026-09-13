import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { postIncident } from '../../services/transitService.js'

const CATEGORIES = ['Falla mecánica', 'Seguridad', 'Vía / tráfico', 'Aglomeración']

function IncidentModal({ onClose, onSent }) {
  const [category, setCategory] = useState(null)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!category) return
    setSending(true)
    try {
      await postIncident({ category })
      onSent?.(category)
      onClose()
    } catch {
      // el usuario puede reintentar; no bloqueamos el modal
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Reportar incidencia" subtitle="Selecciona una categoría">
      <div className="cats">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={category === c ? 'sel' : ''}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <Button variant="fill" style={{ width: '100%' }} onClick={handleSend} disabled={!category || sending}>
        {sending ? 'Enviando…' : 'Enviar reporte'}
      </Button>
    </Modal>
  )
}

export default IncidentModal
