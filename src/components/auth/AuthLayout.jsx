import { motion } from 'framer-motion'
import Brand from '../layout/Brand.jsx'
import ThemeToggle from '../layout/ThemeToggle.jsx'
import Glass from '../ui/Glass.jsx'

/** Pantallas de acceso: mensaje a la izquierda y tarjeta de vidrio a la derecha. */
function AuthLayout({ eyebrow, title, lead, children, side }) {
  return (
    <div className="auth">
      <motion.aside
        className="auth-side"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      >
        <div className="row between">
          <Brand />
          <ThemeToggle />
        </div>
        {side}
        <p className="hide-sm muted" style={{ fontSize: 12.5 }}>
          Proyecto académico Milenew · Bogotá
        </p>
      </motion.aside>

      <Glass
        strong
        tilt
        pad={false}
        className="auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.05 }}
      >
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="title-lg">{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </Glass>
    </div>
  )
}

export default AuthLayout
