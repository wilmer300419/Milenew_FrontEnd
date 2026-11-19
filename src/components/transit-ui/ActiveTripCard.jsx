import { motion } from 'framer-motion'
import { Flag, Navigation } from 'lucide-react'
import { useActiveTrip } from '../../context/TripContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useNow } from '../../hooks/useNow.js'
import { useStations } from '../../hooks/useTransit.js'
import { formatTime } from '../../utils/text.js'
import Glass from '../ui/Glass.jsx'
import Button from '../ui/Button.jsx'
import Arrivals from './Arrivals.jsx'

export function tripProgress(trip, now) {
  const start = new Date(trip.startedAt).getTime()
  const end = new Date(trip.arrivesAt).getTime()
  const pct = Math.min(1, Math.max(0, (now - start) / Math.max(1, end - start)))
  const left = Math.max(0, Math.round((end - now) / 60000))
  return { pct, left, arrived: now >= end }
}

/** Tarjeta del viaje pagado en curso: progreso, llegada estimada y próximo bus en el origen. */
function ActiveTripCard() {
  const { trip, finish } = useActiveTrip()
  const toast = useToast()
  const now = useNow(5000)
  const { stations } = useStations()
  if (!trip) return null

  const order = (id) => stations.findIndex((s) => s.id === id)
  const direction = order(trip.toStationId) > order(trip.fromStationId) ? 'sur' : 'norte'

  const { pct, left, arrived } = tripProgress(trip, now)
  const sinceStart = (now - new Date(trip.startedAt).getTime()) / 60000

  const done = async () => {
    try {
      await finish()
      toast.success(`Llegaste a ${trip.toName}. ¡Gracias por viajar con Milenew!`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Glass dark className="trip-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="card-head">
        <h3 className="title-md">
          <Navigation size={17} /> Viaje en curso
        </h3>
        <span className="chip">{trip.service}</span>
      </div>
      <p className="trip-route">
        {trip.fromName} <span>→</span> {trip.toName}
      </p>
      <div className="trip-progress" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del viaje">
        <motion.i initial={false} animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 60, damping: 20 }} />
      </div>
      <p className="trip-eta">
        {arrived ? (
          <>Deberías estar llegando a {trip.toName}.</>
        ) : (
          <>
            Llegada estimada <b>{formatTime(trip.arrivesAt)}</b> · faltan {left} min
          </>
        )}
      </p>

      {sinceStart < 5 && !arrived && (
        <div className="trip-board">
          <small>
            Tu bus en {trip.fromName} · hacia el {direction}
          </small>
          <Arrivals stationId={trip.fromStationId} limit={2} direction={stations.length ? direction : undefined} />
        </div>
      )}

      <Button variant={arrived ? 'primary' : 'glass'} size="sm" onClick={done} className="trip-finish">
        <Flag size={14} /> {arrived ? 'Ya llegué' : 'Terminar viaje'}
      </Button>
    </Glass>
  )
}

export default ActiveTripCard
