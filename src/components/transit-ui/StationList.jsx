import { AnimatePresence, motion } from 'framer-motion'
import { Star } from 'lucide-react'

/** Troncal en vertical: cada estación con los buses que están allí o saliendo. */
function StationList({ stations, vehicles = [], selectedId, onSelect, favorites, onToggleFavorite }) {
  return (
    <div className="stlist">
      <div className="stlist-rail" aria-hidden="true" />
      <ol className="stlist-items" aria-label="Estaciones de la troncal">
      {stations.map((s, i) => {
        const here = vehicles.filter((v) => v.currentIndex === i)
        const selected = s.id === selectedId
        const fav = favorites?.has(s.id)
        const kind = i === 0 ? 'Terminal norte' : i === stations.length - 1 ? 'Portal · terminal sur' : 'Estación sencilla'
        return (
          <motion.li key={s.id} layout className={`st-row ${selected ? 'selected' : ''}`}>
            <button type="button" className="st-main" onClick={() => onSelect?.(s)} aria-pressed={selected}>
              <span
                className={`st-node ${s.isExpressStop ? 'express' : ''} ${i === 0 || i === stations.length - 1 ? 'terminal' : ''}`}
                aria-hidden="true"
              />
              <span className="st-text">
                <b>{s.name}</b>
                <small>
                  {kind}
                  {s.isExpressStop ? ' · para el expreso' : ''}
                </small>
                <AnimatePresence initial={false}>
                  {here.length > 0 && (
                    <motion.span
                      className="st-buses"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {here.map((v) => (
                        <span key={v.vehicleId} className={`chip ${v.service === 'Expreso' ? 'red' : ''}`}>
                          {v.label} · {v.atStation ? 'en estación' : `saliendo ${v.direction === 'sur' ? '↓' : '↑'}`}
                        </span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </button>
            {onToggleFavorite && (
              <motion.button
                type="button"
                className={`star-btn ${fav ? 'on' : ''}`}
                aria-label={fav ? `Quitar ${s.name} de favoritas` : `Marcar ${s.name} como favorita`}
                aria-pressed={fav}
                whileTap={{ scale: 0.8, rotate: -15 }}
                onClick={() => onToggleFavorite(s)}
              >
                <Star size={17} fill={fav ? 'currentColor' : 'none'} />
              </motion.button>
            )}
          </motion.li>
        )
      })}
      </ol>
    </div>
  )
}

export default StationList
