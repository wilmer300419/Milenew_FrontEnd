import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, FileWarning } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { postDriverReport } from '../../services/transitService.js'
import { timeAgo } from '../../utils/text.js'
import Glass from '../ui/Glass.jsx'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import { revealItem } from '../ui/Reveal.jsx'

const STATUS = { open: 'Abierta', in_progress: 'En curso', closed: 'Cerrada' }

function ReportModal({ open, onClose, categories, onSent }) {
  const toast = useToast()
  const [category, setCategory] = useState(null)
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    try {
      const res = await postDriverReport({ category, description })
      toast.success(res.message)
      setCategory(null)
      setDescription('')
      onSent()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Reportar novedad" subtitle="Llega a la central con tu bus y tu ubicación actual.">
      <div className="cats">
        {categories.map((c) => (
          <button key={c} type="button" className={`cat ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)} aria-pressed={category === c}>
            {category === c && <motion.span layoutId="report-lens" className="cat-lens" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <span>{c}</span>
          </button>
        ))}
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <input id="report-desc" placeholder=" " maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
        <label htmlFor="report-desc">Detalle (opcional)</label>
      </div>
      <Button size="lg" block onClick={send} loading={sending} disabled={!category}>
        Enviar a la central
      </Button>
    </Modal>
  )
}

/** Novedades del operador (fallas, accidentes, SOS) y su estado en la central. */
function ReportsCard({ reports, onChange }) {
  const [open, setOpen] = useState(false)
  const items = reports.data?.reports ?? []

  return (
    <Glass variants={revealItem}>
      <div className="card-head">
        <h3 className="title-md">
          <FileWarning size={18} /> Novedades
        </h3>
        <Button variant="glass" size="sm" onClick={() => setOpen(true)} disabled={!reports.data}>
          Reportar
        </Button>
      </div>
      {reports.loading && !reports.data ? (
        <Skeleton h={90} />
      ) : items.length ? (
        <ul className="incidents">
          <AnimatePresence initial={false}>
            {items.map((r) => (
              <motion.li key={r.id} layout className={`incident ${r.status} ${r.priority === 'sos' && r.status !== 'closed' ? 'sos' : ''}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="incident-main">
                  <div className="row wrap" style={{ gap: 8 }}>
                    <b>{r.category}</b>
                    <span className={`status-pill ${r.status}`}>{STATUS[r.status]}</span>
                  </div>
                  {r.description && <p className="incident-desc">“{r.description}”</p>}
                  <small className="muted">
                    {r.location} · {timeAgo(r.createdAt)}
                  </small>
                  {r.resolutionNote && (
                    <small className="incident-note">
                      <CheckCircle2 size={12} /> {r.resolutionNote}
                    </small>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="empty">Sin novedades en las últimas 24 h.</p>
      )}
      <ReportModal open={open} onClose={() => setOpen(false)} categories={reports.data?.categories ?? []} onSent={onChange} />
    </Glass>
  )
}

export default ReportsCard
