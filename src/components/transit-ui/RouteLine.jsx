import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'

const PAD = 48
const COMPACT_PAD = 22

/**
 * Troncal en horizontal: estaciones y buses moviéndose en vivo.
 * `position` de cada bus es un número continuo (índice de estación con
 * decimales); se anima en línea recta durante el intervalo de consulta.
 */
function RouteLine({ stations, vehicles = [], selectedId, onSelect, favorites, focusVehicle, tween = 2, compact = false }) {
  const narrow = useMediaQuery('(max-width: 640px)')
  const scrollRef = useRef(null)
  const [boxWidth, setBoxWidth] = useState(0)

  // La versión compacta se ajusta al ancho de su tarjeta para mostrar la troncal completa
  useEffect(() => {
    if (!compact || !scrollRef.current) return undefined
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width))
    ro.observe(scrollRef.current)
    return () => ro.disconnect()
  }, [compact])

  const pad = compact ? COMPACT_PAD : PAD
  const segments = Math.max(stations.length - 1, 1)
  const gap = compact ? Math.max(18, (boxWidth - pad * 2) / segments) : narrow ? 64 : 84
  const width = pad * 2 + gap * segments

  // Mantiene visible el bus que se está siguiendo
  const focus = vehicles.find((v) => v.vehicleId === focusVehicle)
  const focusX = focus ? pad + focus.position * gap : null
  useEffect(() => {
    const el = scrollRef.current
    if (!el || focusX == null) return
    const target = focusX - el.clientWidth / 2
    if (Math.abs(el.scrollLeft - target) > el.clientWidth * 0.3) el.scrollTo({ left: target, behavior: 'smooth' })
  }, [focusX])

  return (
    <div className={`routeline-scroll ${compact ? 'compact' : ''}`} ref={scrollRef}>
      <div className="routeline" style={{ width }}>
        <div className="rl-track" style={{ left: pad, right: pad }} />

        {stations.map((s, i) => {
          const x = pad + i * gap
          const selected = s.id === selectedId
          const fav = favorites?.has(s.id)
          return (
            <button
              key={s.id}
              type="button"
              className={`rl-station ${s.isExpressStop ? 'express' : ''} ${selected ? 'selected' : ''}`}
              style={{ left: x }}
              onClick={() => onSelect?.(s)}
              title={s.name}
            >
              {fav && <Star className="rl-fav" size={11} fill="currentColor" />}
              <span className="rl-dot" />
              {!compact && <span className="rl-name">{s.name}</span>}
            </button>
          )
        })}

        {vehicles.map((v) => (
          <motion.div
            key={v.vehicleId}
            className={`rl-bus ${v.service === 'Expreso' ? 'express' : ''} ${v.vehicleId === focusVehicle ? 'focus' : ''} ${v.direction}`}
            initial={false}
            animate={{ x: pad + v.position * gap }}
            transition={{ type: 'tween', ease: 'linear', duration: tween }}
            title={`${v.label} · ${v.service} · hacia el ${v.direction}`}
          >
            <span className="rl-bus-body">
              <i />
            </span>
            {!compact && <span className="rl-bus-tag">{v.label.split(' · ')[0]}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default RouteLine
