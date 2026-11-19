import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Coffee, Play, Square, Timer } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { useNow } from '../../hooks/useNow.js'
import { endShift, setShiftBreak, startShift } from '../../services/transitService.js'
import { formatClock, formatDateTime, formatDuration } from '../../utils/formatters.js'
import Glass from '../ui/Glass.jsx'
import Button from '../ui/Button.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { revealItem } from '../ui/Reveal.jsx'

const CONTINUOUS_LIMIT = 4 * 3600

function statRows(stats) {
  if (!stats) return []
  return [
    { label: 'Paradas', value: stats.stops },
    { label: 'Km', value: stats.km.toLocaleString('es-CO') },
    { label: 'Vueltas', value: stats.laps.toLocaleString('es-CO') },
    { label: 'Pasajeros', value: stats.passengers.toLocaleString('es-CO') },
    { label: 'Puntualidad', value: stats.punctualityPct == null ? '—' : `${stats.punctualityPct}%` },
  ]
}

function Stats({ stats }) {
  return (
    <div className="shift-stats">
      {statRows(stats).map((s) => (
        <div key={s.label} className="stat">
          <small>{s.label}</small>
          <b className="tnum">{s.value}</b>
        </div>
      ))}
    </div>
  )
}

/** Turno del operador: requisitos, cronómetro, pausas, resumen y cierre. */
function ShiftCard({ shift, onChange }) {
  const toast = useToast()
  const now = useNow(1000)
  const [busy, setBusy] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const { data, fetchedAt } = shift
  const active = data?.active
  const req = data?.requirements
  // Entre consultas, el cronómetro avanza en el navegador
  const tick = active && !active.onBreak ? Math.max(0, (now - fetchedAt) / 1000) : 0
  const driving = (active?.drivingSeconds ?? 0) + tick
  const continuous = (active?.continuousSeconds ?? 0) + tick
  const ready = req?.hasVehicle && req.checklistTotal > 0 && req.checklistDone === req.checklistTotal

  const run = async (action, message) => {
    setBusy(true)
    try {
      const res = await action()
      toast.success(message ?? res.message)
      await onChange()
    } catch (err) {
      toast.error(err.message)
      throw err
    } finally {
      setBusy(false)
    }
  }

  if (!data) {
    return (
      <Glass variants={revealItem}>
        <Skeleton h={190} />
      </Glass>
    )
  }

  return (
    <Glass variants={revealItem} className="shift-card">
      <div className="card-head">
        <h3 className="title-md">
          <Timer size={18} /> Turno
        </h3>
        <span className={`chip ${active ? (active.onBreak ? 'yellow' : 'ink') : ''}`}>
          {active ? (active.onBreak ? 'En pausa' : 'En turno') : 'Fuera de turno'}
        </span>
      </div>

      {active ? (
        <>
          <div className="shift-clock">
            <div>
              <small className="muted">Tiempo conducido</small>
              <b className="mono tnum">{formatClock(driving)}</b>
            </div>
            <small className="muted">
              Desde {formatDateTime(active.startedAt)} · pausas {formatDuration(active.breakSeconds)}
            </small>
          </div>

          {!active.onBreak && (
            <div className={`shift-continuous ${continuous >= CONTINUOUS_LIMIT ? 'warn' : ''}`}>
              <div className="row between">
                <small>Conducción continua</small>
                <small className="mono">
                  {formatDuration(continuous)} / {formatDuration(CONTINUOUS_LIMIT)}
                </small>
              </div>
              <div className="bar" role="progressbar" aria-label="Conducción continua" aria-valuemin={0} aria-valuemax={CONTINUOUS_LIMIT} aria-valuenow={Math.round(continuous)}>
                <motion.i animate={{ width: `${Math.min(100, (continuous / CONTINUOUS_LIMIT) * 100)}%` }} transition={{ ease: 'linear', duration: 1 }} />
              </div>
              {continuous >= CONTINUOUS_LIMIT && <small className="warn-text">Llevas más de 4 h seguidas: toma una pausa activa en la próxima terminal.</small>}
            </div>
          )}

          <Stats stats={active.stats} />
          <p className="shift-note">Estimaciones a escala real a partir del tiempo conducido.</p>

          <div className="row wrap" style={{ gap: 8 }}>
            <Button variant="glass" loading={busy} onClick={() => run(() => setShiftBreak(!active.onBreak)).catch(() => {})}>
              {active.onBreak ? <Play size={15} /> : <Coffee size={15} />}
              {active.onBreak ? 'Reanudar' : 'Iniciar pausa'}
            </Button>
            <Button disabled={busy} onClick={() => setConfirmEnd(true)}>
              <Square size={14} /> Terminar turno
            </Button>
          </div>
        </>
      ) : (
        <>
          <ul className="shift-reqs">
            <li className={req?.hasVehicle ? 'ok' : ''}>
              <span>{req?.hasVehicle && <Check size={13} strokeWidth={3} />}</span>
              Bus asignado por la central
            </li>
            <li className={ready ? 'ok' : ''}>
              <span>{ready && <Check size={13} strokeWidth={3} />}</span>
              Checklist pre-operacional ({req?.checklistDone ?? 0}/{req?.checklistTotal ?? 0})
              {!ready && req?.hasVehicle && (
                <button type="button" className="link" onClick={() => document.getElementById('checklist')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                  Completar
                </button>
              )}
            </li>
          </ul>
          <Button block size="lg" disabled={!ready} loading={busy} onClick={() => run(startShift, 'Turno iniciado. ¡Buen viaje!').catch(() => {})}>
            <Play size={16} /> Iniciar turno
          </Button>
          {data.last && (
            <div className="shift-last">
              <small className="muted">
                Último turno · {formatDateTime(data.last.startedAt)} · {formatDuration(data.last.drivingSeconds)} conducidas
              </small>
              <Stats stats={data.last.stats} />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="Terminar turno"
        subtitle="Se guarda el resumen y el bus queda fuera de operación."
        rows={[{ label: 'Tiempo conducido', value: formatDuration(driving), strong: true }, ...statRows(active?.stats)]}
        confirmLabel="Terminar turno"
        onConfirm={() => run(endShift, 'Turno terminado. ¡Buen descanso!')}
      />
    </Glass>
  )
}

export default ShiftCard
