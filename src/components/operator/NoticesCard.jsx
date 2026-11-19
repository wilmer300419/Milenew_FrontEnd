import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Megaphone } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { ackDriverNotice, getDriverNotices } from '../../services/transitService.js'
import Glass from '../ui/Glass.jsx'
import Button from '../ui/Button.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import { revealItem } from '../ui/Reveal.jsx'

/** Avisos de la central (desvíos, cierres…). El operador confirma que los leyó. */
function NoticesCard() {
  const toast = useToast()
  const { data, loading, refresh } = usePolling(getDriverNotices, 20000)
  const [acking, setAcking] = useState(null)
  const seen = useRef(null)
  const notices = data ?? []
  const pending = notices.filter((n) => !n.acked)

  // Aviso nuevo sin confirmar mientras el panel está abierto: se anuncia
  useEffect(() => {
    if (!data) return
    const ids = new Set(data.map((n) => n.id))
    if (seen.current) {
      const fresh = data.filter((n) => !n.acked && !seen.current.has(n.id))
      if (fresh.length) toast.info(`Nuevo aviso de la central: ${fresh[0].title}`)
    }
    seen.current = ids
  }, [data, toast])

  const ack = async (notice) => {
    setAcking(notice.id)
    try {
      await ackDriverNotice(notice.id)
      await refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAcking(null)
    }
  }

  return (
    <Glass variants={revealItem}>
      <div className="card-head">
        <h3 className="title-md">
          <Megaphone size={18} /> Avisos de la central
        </h3>
        <span className={`chip ${pending.length ? 'yellow' : ''}`}>{pending.length ? `${pending.length} por confirmar` : 'Al día'}</span>
      </div>
      {loading && !data ? (
        <Skeleton h={90} />
      ) : notices.length ? (
        <ul className="notices">
          <AnimatePresence initial={false}>
            {notices.map((n) => (
              <motion.li key={n.id} layout className={`notice ${n.acked ? '' : 'pending'}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="notice-main">
                  <b>{n.title}</b>
                  {n.description && <p>{n.description}</p>}
                  <small className="muted">
                    {n.audience === 'drivers' ? 'Solo operadores' : 'Para todos'} · {n.relativeTime}
                  </small>
                </div>
                {n.acked ? (
                  <span className="notice-ok" role="img" aria-label="Confirmado">
                    <Check size={14} strokeWidth={3} />
                  </span>
                ) : (
                  <Button size="sm" loading={acking === n.id} onClick={() => ack(n)}>
                    Enterado
                  </Button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="empty">Sin avisos en los últimos 3 días.</p>
      )}
    </Glass>
  )
}

export default NoticesCard
