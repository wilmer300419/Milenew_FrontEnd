import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'

/** Aviso fijo cuando el navegador pierde internet o el servidor no responde. */
function ConnectionBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [apiUp, setApiUp] = useState(true)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    const api = (e) => setApiUp(e.detail)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    window.addEventListener('api:connection', api)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      window.removeEventListener('api:connection', api)
    }
  }, [])

  const down = !online || !apiUp
  return (
    <AnimatePresence>
      {down && (
        <motion.div
          role="status"
          className="conn-banner glass strong"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
        >
          <WifiOff size={15} />
          {online ? 'No hay conexión con el servidor. Reintentando…' : 'Estás sin internet. Mostramos los últimos datos.'}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConnectionBanner
