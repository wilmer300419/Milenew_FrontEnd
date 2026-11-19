import { motion } from 'framer-motion'

function Splash() {
  return (
    <div className="splash">
      <motion.span
        className="splash-dot"
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

export default Splash
