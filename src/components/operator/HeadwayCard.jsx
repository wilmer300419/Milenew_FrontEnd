import { motion } from 'framer-motion'
import { ArrowLeftRight } from 'lucide-react'
import Glass from '../ui/Glass.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import { revealItem } from '../ui/Reveal.jsx'

const gap = (s) => (s < 60 ? `${Math.round(s)} s` : `${Math.round(s / 60)} min`)

const STATUS = {
  early: { label: 'Adelantado', chip: 'yellow' },
  on_time: { label: 'A tiempo', chip: 'ink' },
  late: { label: 'Atrasado', chip: 'danger' },
}

function advice(h) {
  if (h.status === 'early') return `Vas muy pegado al ${h.ahead.label}. Reduce la velocidad o prolonga un poco la parada (≈${gap(h.deviationSeconds)}).`
  if (h.status === 'late') return `El ${h.behind.label} te está alcanzando. Agiliza el abordaje y no prolongues las paradas.`
  return 'Intervalo equilibrado con los buses de adelante y de atrás. Mantén el ritmo.'
}

/** Regulación por intervalo: distancia (en tiempo) con el bus de adelante y el de atrás. */
function HeadwayCard({ headway, loading }) {
  const status = STATUS[headway?.status]
  const total = headway ? Math.max(1, headway.ahead.seconds + headway.behind.seconds) : 1
  // Se limita para que la etiqueta "Tú" no se salga de la barra en los extremos
  const me = headway ? Math.min(92, Math.max(8, (headway.behind.seconds / total) * 100)) : 50

  return (
    <Glass variants={revealItem} className="headway-card">
      <div className="card-head">
        <h3 className="title-md">
          <ArrowLeftRight size={18} /> Intervalo
        </h3>
        {status && <span className={`chip ${status.chip}`}>{status.label}</span>}
      </div>

      {loading ? (
        <Skeleton h={150} />
      ) : !headway ? (
        <p className="empty">No hay otros buses en la troncal para comparar.</p>
      ) : (
        <>
          <div className="headway-track" aria-hidden="true">
            <span className="hw-end">Atrás</span>
            <div className="hw-line">
              <i className="hw-ideal" />
              <motion.span className={`hw-me ${headway.status}`} animate={{ left: `${me}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
                Tú
              </motion.span>
            </div>
            <span className="hw-end">Adelante</span>
          </div>

          <div className="headway-gaps">
            <div>
              <small>Bus de atrás</small>
              <b className="tnum">{gap(headway.behind.seconds)}</b>
              <span className="muted">{headway.behind.label}</span>
            </div>
            <div>
              <small>Bus de adelante</small>
              <b className="tnum">{gap(headway.ahead.seconds)}</b>
              <span className="muted">{headway.ahead.label}</span>
            </div>
          </div>

          <p className="headway-advice" aria-live="polite">
            {advice(headway)} <span className="muted">Ideal: {gap(headway.targetSeconds)} con cada uno.</span>
          </p>
        </>
      )}
    </Glass>
  )
}

export default HeadwayCard
