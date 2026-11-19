import { useState } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

/**
 * Confirmación con resumen antes de una acción con dinero.
 * rows: [{ label, value, strong? }]
 */
function ConfirmDialog({ open, onClose, title, subtitle, rows = [], note, confirmLabel = 'Confirmar', onConfirm }) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // quien llama muestra el error; el diálogo queda abierto para reintentar
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} subtitle={subtitle}>
      <dl className="summary">
        {rows.map((r) => (
          <div key={r.label} className={r.strong ? 'strong' : ''}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="summary-note">{note}</p>}
      <div className="dialog-actions">
        <Button variant="glass" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button onClick={confirm} loading={busy} autoFocus>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
