import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useNow } from '../../hooks/useNow.js'
import { formatEta } from '../../utils/formatters.js'
import { occupancyMood } from '../../utils/human.js'

/** Tarjeta de un bus con su estado y las próximas paradas. */
function BusCard({ vehicle, fetchedAt, active, onClick }) {
  const now = useNow(1000)
  const elapsed = (now - fetchedAt) / 1000
  const Arrow = vehicle.direction === 'sur' ? ArrowDown : ArrowUp

  return (
    <motion.button
      type="button"
      layout
      className={`bus-card ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-expanded={active}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="row between">
        <span className="row" style={{ gap: 8 }}>
          <span className={`svc ${vehicle.service === 'Expreso' ? 'express' : ''}`}>{vehicle.label.split(' · ')[0]}</span>
          <b className="mono" style={{ fontSize: 13 }}>{vehicle.label.split(' · ')[1]}</b>
        </span>
        <span className="chip">
          <Arrow size={12} /> {vehicle.direction === 'sur' ? 'Al sur' : 'Al norte'}
        </span>
      </div>
      <div className="bus-now">
        <small>{vehicle.atStation ? 'En estación' : 'Entre estaciones'}</small>
        <b>
          {vehicle.atStation ? vehicle.currentStation : `${vehicle.currentStation} → ${vehicle.nextStation}`}
        </b>
      </div>
      {active && (
        <motion.ol className="upcoming" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          {vehicle.upcomingStops.map((u, i) => (
            <li key={`${u.stationId}-${i}`}>
              <span className="up-dot" />
              <span className="up-name">{u.name}</span>
              <span className="mono up-eta">{formatEta(Math.max(0, u.etaSeconds - elapsed))}</span>
            </li>
          ))}
        </motion.ol>
      )}
      <div className="bus-meta">
        <span className="mono">{vehicle.speed} km/h</span>
        <span className={`mood ${vehicle.occupancyPct > 85 ? 'full' : ''}`}>{occupancyMood(vehicle.occupancyPct)}</span>
      </div>
    </motion.button>
  )
}

export default BusCard
