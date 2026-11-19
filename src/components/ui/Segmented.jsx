import { useId } from 'react'
import { motion } from 'framer-motion'

/** Control segmentado con lente de vidrio líquido que se desliza (spring). */
function Segmented({ options, value, onChange, size = 'md', className = '' }) {
  const layoutId = useId()
  return (
    <div className={`segmented ${size} ${className}`} role="tablist">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? 'on' : ''}
            onClick={() => onChange(opt.value)}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="segmented-lens"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="segmented-label">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default Segmented
