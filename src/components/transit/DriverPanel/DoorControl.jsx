import { useState } from 'react'

// El control de puertas todavía no tiene endpoint en el backend (es un actuador
// del vehículo, no un recurso del API); por ahora es estado local con el mismo
// bloqueo de seguridad del mockup: no se abren en movimiento.
function DoorControl({ speed }) {
  const [open, setOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const moving = speed != null && speed > 0

  const handleToggle = () => {
    if (!open && moving) {
      setBlocked(true)
      setTimeout(() => setBlocked(false), 3200)
      return
    }
    setOpen((o) => !o)
  }

  return (
    <div className="card">
      {blocked && (
        <div className="alert" style={{ marginBottom: 12 }}>
          Bloqueo de seguridad · el vehículo se mueve a {speed} km/h.
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>Puertas</div>
          <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>{open ? 'Abiertas' : 'Cerradas'}</div>
        </div>
        <div className={`sw ${open ? 'on' : ''}`} onClick={handleToggle}>
          <i />
        </div>
      </div>
    </div>
  )
}

export default DoorControl
