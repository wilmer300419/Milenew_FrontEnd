import { motion } from 'framer-motion'

/** Interruptor de vidrio: la perilla se estira al moverse. */
function Switch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`switch ${checked ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <motion.span
        className="switch-knob"
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        whileTap={{ scaleX: 1.25 }}
      />
    </button>
  )
}

export default Switch
