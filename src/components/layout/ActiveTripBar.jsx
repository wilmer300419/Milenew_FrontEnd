import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Navigation } from 'lucide-react'
import { useActiveTrip } from '../../context/TripContext.jsx'
import { useNow } from '../../hooks/useNow.js'
import { formatTime } from '../../utils/text.js'
import { tripProgress } from '../transit-ui/ActiveTripCard.jsx'

/** Recordatorio del viaje en curso en todas las páginas (salvo donde ya hay tarjeta). */
function ActiveTripBar() {
  const { trip } = useActiveTrip()
  const { pathname } = useLocation()
  const now = useNow(10000)
  const hidden = !trip || pathname === '/app' || pathname === '/app/viajes'
  const p = trip ? tripProgress(trip, now) : null

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          <Link to="/app/viajes" className="trip-bar glass strong">
            <Navigation size={15} className="trip-bar-ico" />
            <span className="trip-bar-text">
              Vas a <b>{trip.toName}</b>
              <span className="muted">
                {' '}
                · {p.arrived ? 'llegando' : `llega ${formatTime(trip.arrivesAt)}`}
              </span>
            </span>
            <span className="trip-bar-track" aria-hidden="true">
              <i style={{ width: `${p.pct * 100}%` }} />
            </span>
            <ChevronRight size={16} className="muted" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ActiveTripBar
