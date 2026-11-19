import { motion } from 'framer-motion'

const level = (pct) => (pct > 80 ? 'high' : pct > 50 ? 'mid' : 'low')
const label = { high: 'lleno', mid: 'medio', low: 'libre' }

function Occupancy({ cars = [] }) {
  if (!cars.length) return <p className="empty">Sin datos de ocupación.</p>
  return (
    <div className="occ">
      {cars.map((c) => {
        const l = level(c.pct)
        return (
          <div className="occ-row" key={c.n}>
            <span className="occ-lbl mono">VAGÓN {c.n}</span>
            <span className="occ-track">
              <motion.i
                className={l}
                initial={false}
                animate={{ width: `${c.pct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </span>
            <span className="occ-pct mono">
              {c.pct}% <small>{label[l]}</small>
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default Occupancy
