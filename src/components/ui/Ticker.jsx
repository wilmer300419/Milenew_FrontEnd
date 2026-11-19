import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

/** Número que cuenta suavemente hasta su nuevo valor. */
function Ticker({ value = 0, format = (n) => Math.round(n).toLocaleString('es-CO'), duration = 0.9, className = '' }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => format(v))

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
  }, [mv, value, duration])

  return <motion.span className={`tnum ${className}`}>{text}</motion.span>
}

export default Ticker
