import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Star } from 'lucide-react'
import { normalize } from '../../utils/text.js'

/**
 * Selector de estación con búsqueda (combobox accesible).
 * Escribe para filtrar (sin importar tildes); ↑ ↓ para moverte, Enter para elegir, Esc para cerrar.
 * Sin texto muestra primero tus favoritas y recientes.
 */
function StationPicker({ label, icon: Icon, stations, value, onChange, favorites, recents = [] }) {
  const id = useId()
  const listId = `${id}-list`
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const selected = stations.find((s) => String(s.id) === String(value))
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const options = useMemo(() => {
    const q = normalize(query)
    if (q) {
      return stations
        .filter((s) => normalize(s.name).includes(q))
        .map((s) => ({ station: s, group: 'Resultados' }))
    }
    const favs = stations.filter((s) => favorites?.has(s.id))
    const recent = recents
      .map((rid) => stations.find((s) => s.id === rid))
      .filter((s) => s && !favorites?.has(s.id))
      .slice(0, 3)
    const shown = new Set([...favs, ...recent].map((s) => s.id))
    return [
      ...favs.map((s) => ({ station: s, group: 'Favoritas' })),
      ...recent.map((s) => ({ station: s, group: 'Recientes' })),
      ...stations.filter((s) => !shown.has(s.id)).map((s) => ({ station: s, group: 'Todas las estaciones' })),
    ]
  }, [query, stations, favorites, recents])

  useEffect(() => setActive(0), [query, open])

  // Mantiene visible la opción activa al usar el teclado
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const choose = (station) => {
    onChange(String(station.id))
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault()
      choose(options[active].station)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  const display = open ? query : selected?.name ?? ''

  return (
    <div className={`field picker ${Icon ? 'has-icon' : ''}`}>
      {Icon && <Icon className="field-icon" size={18} strokeWidth={1.8} />}
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        spellCheck="false"
        placeholder=" "
        value={display}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false)
          setQuery('')
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />
      <label htmlFor={id}>{label}</label>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="picker-list glass strong"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
          >
            {options.length === 0 && <li className="picker-empty">Ninguna estación se llama “{query}”.</li>}
            {options.map((opt, i) => (
              <li key={`${opt.group}-${opt.station.id}`} role="presentation">
                {(i === 0 || options[i - 1].group !== opt.group) && <div className="picker-group">{opt.group}</div>}
                <div
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  className={`picker-option ${i === active ? 'active' : ''} ${String(opt.station.id) === String(value) ? 'chosen' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(opt.station)}
                >
                  {opt.group === 'Favoritas' ? (
                    <Star size={14} className="picker-ico fav" fill="currentColor" />
                  ) : opt.group === 'Recientes' ? (
                    <Clock size={14} className="picker-ico" />
                  ) : (
                    <span className={`picker-dot ${opt.station.isExpressStop ? 'express' : ''}`} />
                  )}
                  <span className="picker-name">{opt.station.name}</span>
                  {opt.station.isExpressStop && <small>expreso</small>}
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StationPicker
