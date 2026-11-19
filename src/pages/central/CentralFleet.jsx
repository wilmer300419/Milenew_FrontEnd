import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bus, Megaphone, Trash2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { assignDriver, createNotice, deleteNotice, getFleet, getNotices } from '../../services/adminService.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'

function CentralFleet() {
  const toast = useToast()
  const fleet = usePolling(getFleet, 0)
  const notices = usePolling(getNotices, 0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [removing, setRemoving] = useState(null)
  const vehicles = fleet.data?.vehicles ?? []
  const drivers = fleet.data?.drivers ?? []

  const assign = async (vehicle, value) => {
    const driverId = value ? Number(value) : null
    try {
      await assignDriver(vehicle.code, driverId)
      const name = drivers.find((d) => d.id === driverId)?.name
      toast.success(driverId ? `${vehicle.label} asignado a ${name}` : `${vehicle.label} quedó sin operador`)
      fleet.refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const publish = async (e) => {
    e.preventDefault()
    setPublishing(true)
    try {
      await createNotice(title.trim(), description.trim())
      toast.success('Aviso publicado para todos los pasajeros')
      setTitle('')
      setDescription('')
      notices.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const remove = async () => {
    try {
      await deleteNotice(removing.id)
      toast.success('Aviso eliminado')
      notices.refresh()
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">Central de operaciones</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            Flota y avisos
          </h1>
          <p>Cada operador maneja un solo bus. Al asignarle otro, el anterior queda libre.</p>
        </div>
      </Reveal.Item>

      <div className="grid grid-main">
        <Glass variants={revealItem}>
          <div className="card-head">
            <h3 className="title-md">
              <Bus size={18} /> Buses
            </h3>
            <span className="chip">{vehicles.filter((v) => v.driverId).length}/{vehicles.length} con operador</span>
          </div>
          {fleet.loading && !fleet.data ? (
            <Skeleton h={200} />
          ) : (
            <ul className="list">
              {vehicles.map((v) => (
                <li key={v.code} className="list-item fleet-row">
                  <span className={`svc ${v.service === 'Expreso' ? 'express' : ''}`}>{v.label.split(' · ')[0]}</span>
                  <span className="list-text">
                    <b>{v.label}</b>
                    <small>
                      {v.service} · {v.routeName}
                    </small>
                  </span>
                  <div className="field compact-select">
                    <select aria-label={`Operador de ${v.label}`} value={v.driverId ?? ''} onChange={(e) => assign(v, e.target.value)}>
                      <option value="">Sin operador</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                          {d.vehicleCode && d.vehicleCode !== v.code ? ' (tiene otro bus)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Glass>

        <div className="stack">
          <Glass as="form" variants={revealItem} onSubmit={publish}>
            <div className="card-head">
              <h3 className="title-md">
                <Megaphone size={18} /> Publicar aviso
              </h3>
            </div>
            <div className="form">
              <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
              <div className="field">
                <textarea id="notice-desc" className="textarea" placeholder=" " rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
                <label htmlFor="notice-desc">Detalle para los pasajeros</label>
              </div>
              <Button type="submit" loading={publishing} disabled={title.trim().length < 3}>
                Publicar a todos
              </Button>
            </div>
          </Glass>

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">Avisos publicados</h3>
              <span className="chip">{notices.data?.length ?? 0}</span>
            </div>
            <ul className="list">
              <AnimatePresence initial={false}>
                {(notices.data ?? []).map((n) => (
                  <motion.li key={n.id} layout className="list-item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                    <span className="list-text">
                      <b>{n.title}</b>
                      <small>
                        {n.relativeTime}
                        {n.description ? ` · ${n.description}` : ''}
                      </small>
                    </span>
                    <Button variant="ghost" size="sm" icon onClick={() => setRemoving(n)} aria-label={`Eliminar aviso ${n.title}`}>
                      <Trash2 size={15} />
                    </Button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Glass>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Eliminar aviso"
        subtitle="Dejará de verse para todos los pasajeros."
        rows={removing ? [{ label: 'Aviso', value: removing.title }] : []}
        confirmLabel="Eliminar"
        onConfirm={remove}
      />
    </Reveal>
  )
}

export default CentralFleet
