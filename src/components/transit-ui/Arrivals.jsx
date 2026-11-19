import { AnimatePresence, motion } from 'framer-motion'
import { usePolling } from '../../hooks/usePolling.js'
import { useNow } from '../../hooks/useNow.js'
import { getStationArrivals } from '../../services/transitService.js'
import { formatEta } from '../../utils/formatters.js'
import { humanEta } from '../../utils/human.js'
import Skeleton from '../ui/Skeleton.jsx'

/** Próximas llegadas a una estación, con cuenta regresiva por segundo. */
function Arrivals({ stationId, limit = 4, direction }) {
  const { data, loading, error, fetchedAt } = usePolling(() => getStationArrivals(stationId), 6000, [stationId])
  const now = useNow(1000)
  const elapsed = (now - fetchedAt) / 1000

  if (loading && !data) {
    return (
      <div className="stack" style={{ gap: 10 }}>
        <Skeleton h={54} r={16} />
        <Skeleton h={54} r={16} />
      </div>
    )
  }
  if (error) return <p className="empty">No se pudieron cargar las llegadas.</p>

  const arrivals = (data?.arrivals ?? []).filter((a) => !direction || a.direction === direction).slice(0, limit)
  if (!arrivals.length) return <p className="empty">Ningún bus para en esta estación por ahora.</p>

  const first = arrivals[0]
  const firstEta = Math.max(0, first.etaSeconds - elapsed)
  const lead =
    firstEta <= 20
      ? `El ${first.service.toLowerCase()} ${first.label.split(' · ')[0]} está llegando. ¡Súbete!`
      : firstEta <= 90
        ? `El próximo ${first.service.toLowerCase()} llega en ${formatEta(firstEta)}. Alístate.`
        : `Tienes ${formatEta(firstEta)} hasta el próximo bus. Sin afanes.`

  return (
    <>
    <motion.p key={lead.slice(0, 18)} className="arrivals-lead" aria-live="polite" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
      {lead}
    </motion.p>
    <motion.ul className="arrivals" layout>
      <AnimatePresence initial={false}>
        {arrivals.map((a, i) => {
          const eta = Math.max(0, a.etaSeconds - elapsed)
          const soon = eta <= 60
          return (
            <motion.li
              key={a.vehicleId}
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32, delay: i * 0.03 }}
              className={`arrival ${soon ? 'soon' : ''}`}
            >
              <span className={`svc ${a.service === 'Expreso' ? 'express' : ''}`}>{a.label.split(' · ')[0]}</span>
              <div className="arrival-text">
                <b>{a.service}</b>
                <small>
                  Hacia el {a.direction} · ahora en {a.currentStation}
                </small>
              </div>
              <span className={`eta-box ${humanEta(eta).tone}`}>
                <span className="eta mono">{formatEta(eta)}</span>
                <small>{humanEta(eta).hint}</small>
              </span>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </motion.ul>
    </>
  )
}

export default Arrivals
