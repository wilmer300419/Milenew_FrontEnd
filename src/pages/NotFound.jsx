import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button.jsx'
import Glass from '../components/ui/Glass.jsx'

function NotFound() {
  return (
    <div className="notfound">
      <Glass strong initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 440 }}>
        <motion.div className="big" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          4<span style={{ color: 'var(--muted)' }}>0</span>4
        </motion.div>
        <p className="muted">Esta estación no existe en la troncal.</p>
        <Link to="/">
          <Button>Volver al inicio</Button>
        </Link>
      </Glass>
    </div>
  )
}

export default NotFound
