import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { getIncidentCategories, postIncident } from '../../services/transitService.js'
import { useToast } from '../../context/ToastContext.jsx'

function IncidentModal({ open, onClose, route }) {
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState(null)
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (open && !categories.length) {
      getIncidentCategories()
        .then((res) => setCategories(res.data ?? []))
        .catch(() => toast.error('No se pudieron cargar las categorías'))
    }
  }, [open, categories.length, toast])

  const send = async () => {
    setSending(true)
    try {
      const res = await postIncident({ category, description, routeId: route })
      toast.success(res.message)
      setCategory(null)
      setDescription('')
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Reportar incidencia" subtitle="La central de operaciones lo recibe al instante.">
      <div className="cats">
        {categories.map((c) => (
          <button key={c} type="button" className={`cat ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>
            {category === c && <motion.span layoutId="cat-lens" className="cat-lens" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <span>{c}</span>
          </button>
        ))}
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <input placeholder=" " maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} id="incident-desc" />
        <label htmlFor="incident-desc">Detalle (opcional)</label>
      </div>
      <Button size="lg" block onClick={send} loading={sending} disabled={!category}>
        Enviar reporte
      </Button>
    </Modal>
  )
}

export default IncidentModal
