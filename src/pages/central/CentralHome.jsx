import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Bus, CheckCircle2, Clock, MessageSquare, Siren, Users } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { useStations, useVehicles } from '../../hooks/useTransit.js'
import { getIncidents, getSummary, updateIncident } from '../../services/adminService.js'
import { timeAgo } from '../../utils/text.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Segmented from '../../components/ui/Segmented.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Freshness from '../../components/ui/Freshness.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'
import RouteLine from '../../components/transit-ui/RouteLine.jsx'

const FILTERS = [
  { value: 'open', label: 'Abiertas' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'closed', label: 'Cerradas' },
  { value: '', label: 'Todas' },
]
const STATUS = { open: 'Abierta', in_progress: 'En curso', closed: 'Cerrada' }

function Kpi({ icon: Icon, label, value, hint, to }) {
  const body = (
    <>
      <span className="kpi-ico">
        <Icon size={16} />
      </span>
      <span className="kpi-label">{label}</span>
      <b className="kpi-value tnum">{value ?? '—'}</b>
      {hint && <small className="kpi-hint">{hint}</small>}
    </>
  )
  return (
    <Glass variants={revealItem} className="kpi" pad={false}>
      {to ? <Link to={to} className="kpi-link">{body}</Link> : <div className="kpi-link">{body}</div>}
    </Glass>
  )
}

function CloseDialog({ incident, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await updateIncident(incident.id, 'closed', note)
      toast.success(incident.reporterName !== 'Anónimo' ? `Cerrada. Avisamos a ${incident.reporterName}.` : 'Incidencia cerrada')
      onDone()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={Boolean(incident)} onClose={onClose} title="Cerrar incidencia" subtitle={incident ? `${incident.category} · reportada por ${incident.reporterName}` : ''}>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <textarea id="close-note" className="textarea" placeholder=" " maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <label htmlFor="close-note">Qué se hizo (lo verá quien la reportó)</label>
        </div>
        <div className="dialog-actions">
          <Button variant="glass" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" loading={busy}>
            Cerrar incidencia
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function CentralHome() {
  const toast = useToast()
  const [filter, setFilter] = useState('open')
  const [closing, setClosing] = useState(null)
  const summary = usePolling(getSummary, 5000)
  const incidents = usePolling(() => getIncidents(filter), 5000, [filter])
  const { stations } = useStations()
  const { vehicles } = useVehicles()
  const s = summary.data

  const take = async (incident) => {
    try {
      await updateIncident(incident.id, 'in_progress')
      toast.success('Incidencia en curso')
      incidents.refresh()
      summary.refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const refreshAll = () => {
    incidents.refresh()
    summary.refresh()
  }

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">Central de operaciones</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            Resumen de la operación
          </h1>
          <p>
            <Freshness at={summary.fetchedAt} />
          </p>
        </div>
      </Reveal.Item>

      <AnimatePresence>
        {s?.sosOpen > 0 && (
          <motion.div className="sos-alert" role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Siren size={20} />
            <span>
              <b>{s.sosOpen === 1 ? 'Un operador activó SOS' : `${s.sosOpen} operadores activaron SOS`}</b>
              <small>Atiéndelo primero: los SOS sin cerrar aparecen arriba de la lista.</small>
            </span>
            {filter !== '' && (
              <Button size="sm" variant="glass" onClick={() => setFilter('')}>
                Ver todas
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="kpis">
        <Kpi icon={AlertTriangle} label="Incidencias abiertas" value={s?.openIncidents} hint={s ? `${s.inProgressIncidents} en curso` : null} />
        <Kpi icon={MessageSquare} label="Mensajes sin leer" value={s?.unreadMessages} hint="de operadores" to="/central/mensajes" />
        <Kpi icon={Bus} label="Buses con operador" value={s ? `${s.assignedVehicles}/${s.vehicles}` : null} hint={s ? `${s.activeShifts} en turno · ${s.drivers} operadores` : null} to="/central/flota" />
        <Kpi icon={Users} label="Pasajeros registrados" value={s?.passengers} />
      </div>

      <div className="grid grid-main">
        <Glass variants={revealItem}>
          <div className="card-head">
            <h3 className="title-md">
              <AlertTriangle size={18} /> Incidencias
            </h3>
            <Segmented size="sm" options={FILTERS} value={filter} onChange={setFilter} />
          </div>
          {incidents.loading && !incidents.data ? (
            <Skeleton h={180} r={16} />
          ) : incidents.data?.length ? (
            <ul className="incidents">
              <AnimatePresence initial={false}>
                {incidents.data.map((i) => (
                  <motion.li key={i.id} layout className={`incident ${i.status} ${i.priority === 'sos' && i.status !== 'closed' ? 'sos' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="incident-main">
                      <div className="row wrap" style={{ gap: 8 }}>
                        <b>{i.category}</b>
                        <span className={`status-pill ${i.status}`}>{STATUS[i.status]}</span>
                        {i.fromDriver && <span className="status-pill">Operador</span>}
                      </div>
                      {i.description && <p className="incident-desc">“{i.description}”</p>}
                      <small className="muted">
                        {i.fromDriver ? `${i.reporterName} · ${i.vehicleLabel} · ${i.location}` : `${i.reporterName} · ${i.routeName ?? 'Sin ruta'}`} ·{' '}
                        {timeAgo(i.createdAt)}
                      </small>
                      {i.resolutionNote && (
                        <small className="incident-note">
                          <CheckCircle2 size={12} /> {i.resolutionNote}
                          {i.handledByName ? ` — ${i.handledByName}` : ''}
                        </small>
                      )}
                    </div>
                    {i.status !== 'closed' && (
                      <div className="incident-actions">
                        {i.status === 'open' && (
                          <Button variant="glass" size="sm" onClick={() => take(i)}>
                            <Clock size={14} /> Atender
                          </Button>
                        )}
                        <Button size="sm" onClick={() => setClosing(i)}>
                          Cerrar
                        </Button>
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="empty">{filter === 'open' ? 'No hay incidencias abiertas. Todo en orden.' : 'No hay incidencias en esta vista.'}</p>
          )}
        </Glass>

        <Glass variants={revealItem}>
          <div className="card-head">
            <h3 className="title-md">
              <span className="live-dot" /> Troncal en vivo
            </h3>
            <Link to="/app/en-vivo" className="link" style={{ fontSize: 13 }}>
              Ver detalle
            </Link>
          </div>
          <RouteLine stations={stations} vehicles={vehicles} compact />
          <ul className="list" style={{ marginTop: 8 }}>
            {vehicles.map((v) => (
              <li key={v.vehicleId} className="list-item">
                <span className={`svc ${v.service === 'Expreso' ? 'express' : ''}`}>{v.label.split(' · ')[0]}</span>
                <span className="list-text">
                  <b>{v.label}</b>
                  <small>{v.atStation ? `En ${v.currentStation}` : `${v.currentStation} → ${v.nextStation}`}</small>
                </span>
                <small className="mono muted">{v.occupancyPct}%</small>
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <CloseDialog key={closing?.id} incident={closing} onClose={() => setClosing(null)} onDone={refreshAll} />
    </Reveal>
  )
}

export default CentralHome
