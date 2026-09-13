import { useEffect, useState } from 'react'
import { useFetch } from '../../../hooks/useFetch.js'
import { getTelemetry } from '../../../services/transitService.js'
import Card from '../../common/Card.jsx'
import Checklist from './Checklist.jsx'
import Gauges from './Gauges.jsx'
import DoorControl from './DoorControl.jsx'
import OperationsChat from './OperationsChat.jsx'

const POLL_MS = 4000

function DriverPanel({ vehicleId }) {
  const { data, refetch } = useFetch(() => getTelemetry(vehicleId), [vehicleId])
  const [checklistDone, setChecklistDone] = useState(false)
  const telemetry = data?.data ?? null

  useEffect(() => {
    const id = setInterval(refetch, POLL_MS)
    return () => clearInterval(id)
  }, [refetch])

  return (
    <>
      <Card>
        <div className="sec">
          <h3>Checklist pre-operacional</h3>
        </div>
        <Checklist onAllComplete={() => setChecklistDone(true)} />
      </Card>

      <Card>
        <div className="sec">
          <h3>Telemetría</h3>
          <span className="act">{telemetry ? 'en vivo' : 'sin datos'}</span>
        </div>
        <Gauges telemetry={telemetry} />
      </Card>

      <DoorControl speed={telemetry?.speed} />

      <Card>
        <div className="sec">
          <h3>Ocupación por vagón</h3>
        </div>
        {telemetry?.cars?.length ? (
          <div className="cars">
            {telemetry.cars.map((car) => (
              <div className="carrow" key={car.n}>
                <div className="lbl">VAGÓN {car.n}</div>
                <div className="track">
                  <i style={{ width: `${car.pct}%`, background: 'var(--red)' }} />
                </div>
                <div className="pct">{car.pct}%</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">Esperando datos en vivo del vehículo…</p>
        )}
      </Card>

      <Card>
        <div className="sec">
          <h3>Central de operaciones</h3>
        </div>
        <OperationsChat />
      </Card>

      {!checklistDone && (
        <p className="empty" style={{ padding: 0 }}>
          Completa el checklist para habilitar el inicio de ruta.
        </p>
      )}
    </>
  )
}

export default DriverPanel
