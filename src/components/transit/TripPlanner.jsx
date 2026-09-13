import { useState } from 'react'
import { computeTripPlan } from '../../utils/tripPlanner.js'
import { formatPrice } from '../../utils/formatters.js'
import Button from '../common/Button.jsx'

const DEFAULT_FARE = 3200

function TripPlanner({ stations, fare = DEFAULT_FARE }) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [plan, setPlan] = useState(null)

  const indexOf = (id) => stations.findIndex((s) => String(s.id) === String(id))

  const canPlan = fromId !== '' && toId !== '' && stations.length > 0

  const handlePlan = () => {
    const fromIndex = indexOf(fromId)
    const toIndex = indexOf(toId)
    if (fromIndex === -1 || toIndex === -1) return
    setPlan(computeTripPlan({ stations, fromIndex, toIndex, fare }))
  }

  const handleSwap = () => {
    setFromId(toId)
    setToId(fromId)
    setPlan(null)
  }

  if (!stations.length) {
    return <p className="empty">El planificador estará disponible cuando carguen las estaciones.</p>
  }

  return (
    <div>
      <div className="trip">
        <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
          <option value="" disabled>
            Origen
          </option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="button" className="swap" onClick={handleSwap} title="Invertir">
          <svg viewBox="0 0 24 24">
            <path d="M7 4v13M7 4 4 7M7 4l3 3M17 20V7M17 20l-3-3M17 20l3-3" />
          </svg>
        </button>
        <select className="input" value={toId} onChange={(e) => setToId(e.target.value)}>
          <option value="" disabled>
            Destino
          </option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button variant="fill" onClick={handlePlan} disabled={!canPlan}>
          Calcular
        </Button>
      </div>

      {plan && plan.sameStation && (
        <div className="reco" style={{ marginTop: 16 }}>
          Origen y destino son la misma estación. Elige dos distintas.
        </div>
      )}

      {plan && !plan.sameStation && (
        <div style={{ marginTop: 16 }}>
          <div className="tripgrid">
            <div>
              <div className="k">Paradas</div>
              <div className="v">{plan.stops}</div>
            </div>
            <div>
              <div className="k">Duración</div>
              <div className="v">{plan.bestMinutes} min</div>
            </div>
            <div>
              <div className="k">Tarifa</div>
              <div className="v">{formatPrice(plan.fare)}</div>
            </div>
            <div>
              <div className="k">Sentido</div>
              <div className="v" style={{ fontSize: 14 }}>
                {plan.direction === 'sur' ? 'Hacia el sur' : 'Hacia el norte'}
              </div>
            </div>
          </div>
          <div className="reco">
            Te conviene <b>{plan.bestService}</b>
            {plan.savedMinutes > 0
              ? ` · ahorras ${plan.savedMinutes} min frente al corriente`
              : plan.expressAvailable
                ? ''
                : ' · el expreso no cubre este tramo'}
          </div>
          <div className="legs">
            {plan.legs.map((leg) => (
              <span key={leg.station.id} className={leg.skipped ? 'x' : ''}>
                {leg.station.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TripPlanner
