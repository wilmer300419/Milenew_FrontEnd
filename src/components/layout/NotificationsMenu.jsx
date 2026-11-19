import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

/** Campana con contador de avisos sin leer y panel desplegable. */
function NotificationsMenu() {
  const { items, unread, markRead, markAll } = useNotifications()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const read = async (n) => {
    if (!n.unread) return
    try {
      await markRead(n.id)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="btn glass-btn icon sm"
        aria-label={unread ? `Avisos, ${unread} sin leer` : 'Avisos'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={16} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span className="notif-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Avisos"
            className="notif-panel glass strong"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
          >
            <div className="notif-head">
              <b>Avisos</b>
              {unread > 0 && (
                <button type="button" className="link-btn" onClick={() => markAll().catch((e) => toast.error(e.message))}>
                  <CheckCheck size={14} /> Marcar todo como leído
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="empty">No tienes avisos.</p>
            ) : (
              <ul className="notif-list">
                {items.map((n) => (
                  <li key={n.id}>
                    <button type="button" className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => read(n)}>
                      <span className="notif-dot" aria-hidden="true" />
                      <span className="notif-text">
                        <b>{n.title}</b>
                        <small>{n.description}</small>
                      </span>
                      <time>{n.relativeTime}</time>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationsMenu
