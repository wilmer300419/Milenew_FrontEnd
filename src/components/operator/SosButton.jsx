import { useEffect, useRef, useState } from 'react'
import { Siren } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { postDriverReport } from '../../services/transitService.js'

const HOLD_MS = 2000

/**
 * Botón de emergencia: hay que mantenerlo presionado 2 s (mouse, dedo o teclado)
 * para que no se active por accidente. Con un SOS abierto muestra su estado.
 */
function SosButton({ active, onSent }) {
  const toast = useToast()
  const [holding, setHolding] = useState(false)
  const [sending, setSending] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const fire = async () => {
    setHolding(false)
    setSending(true)
    try {
      const res = await postDriverReport({ sos: true })
      toast.success(res.message)
      navigator.vibrate?.([120, 60, 120])
      onSent()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const start = () => {
    if (active || sending || timer.current) return
    setHolding(true)
    timer.current = setTimeout(() => {
      timer.current = null
      fire()
    }, HOLD_MS)
  }

  const cancel = () => {
    clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }

  if (active) {
    return (
      <div className="sos-btn on" role="status">
        <Siren size={18} />
        <span>
          <b>SOS activo</b>
          <small>{active.status === 'in_progress' ? 'La central lo está atendiendo' : 'La central fue alertada'}</small>
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`sos-btn ${holding ? 'holding' : ''}`}
      aria-label="SOS: mantén presionado 2 segundos para alertar a la central"
      disabled={sending}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && (e.preventDefault(), start())}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && cancel()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="sos-fill" style={{ transitionDuration: holding ? `${HOLD_MS}ms` : '200ms' }} />
      <Siren size={18} />
      <span>
        <b>{sending ? 'Enviando…' : 'SOS'}</b>
        <small>{holding ? 'Sigue presionando…' : 'Mantén 2 s'}</small>
      </span>
    </button>
  )
}

export default SosButton
