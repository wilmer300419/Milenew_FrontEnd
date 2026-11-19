import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ClipboardCheck, DoorOpen, MessageSquare, Navigation, Send } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { useNow } from '../../hooks/useNow.js'
import { useStations } from '../../hooks/useTransit.js'
import {
  getChatMessages,
  getChecklist,
  getDriverReports,
  getMyVehicle,
  getShift,
  postChatMessage,
  postChecklistItem,
} from '../../services/transitService.js'
import { formatEta } from '../../utils/formatters.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Switch from '../../components/ui/Switch.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'
import RouteLine from '../../components/transit-ui/RouteLine.jsx'
import Occupancy from '../../components/transit-ui/Occupancy.jsx'
import ShiftCard from '../../components/operator/ShiftCard.jsx'
import HeadwayCard from '../../components/operator/HeadwayCard.jsx'
import SosButton from '../../components/operator/SosButton.jsx'
import ReportsCard from '../../components/operator/ReportsCard.jsx'
import NoticesCard from '../../components/operator/NoticesCard.jsx'

const CIRC = 2 * Math.PI * 44
const QUICK = ['Todo en orden', 'Retraso leve', 'Solicito apoyo']

function Gauge({ value, max, unit, color }) {
  const pct = Math.min(1, Math.max(0, (value ?? 0) / max))
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 100">
        <circle className="g-bg" cx="50" cy="50" r="44" />
        <motion.circle
          className="g-fg"
          cx="50"
          cy="50"
          r="44"
          stroke={color}
          strokeDasharray={CIRC}
          initial={false}
          animate={{ strokeDashoffset: CIRC * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <div className="gauge-center">
        <div>
          <b>{value ?? '—'}</b>
          <small>{unit}</small>
        </div>
      </div>
    </div>
  )
}

function Checklist({ onChange }) {
  const toast = useToast()
  const { data, loading, refresh } = usePolling(getChecklist, 0)
  const items = data ?? []
  const done = items.filter((i) => i.done).length

  const toggle = async (item) => {
    try {
      await postChecklistItem(item.id, !item.done)
      await refresh()
      onChange()
      if (!item.done && done + 1 === items.length) toast.success('Checklist completo. ¡Ya puedes iniciar el turno!')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Glass variants={revealItem} id="checklist">
      <div className="card-head">
        <h3 className="title-md">
          <ClipboardCheck size={18} /> Checklist pre-operacional
        </h3>
        <span className={`chip ${done === items.length && items.length ? 'yellow' : ''}`}>
          {done}/{items.length}
        </span>
      </div>
      {loading ? (
        <Skeleton h={180} />
      ) : (
        <div className="checklist">
          {items.map((item) => (
            <motion.button key={item.id} type="button" className={`chk ${item.done ? 'on' : ''}`} onClick={() => toggle(item)} whileTap={{ scale: 0.98 }}>
              <span className="chk-box">
                <AnimatePresence>
                  {item.done && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                      <Check size={14} strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="chk-label">{item.label}</span>
            </motion.button>
          ))}
        </div>
      )}
    </Glass>
  )
}

function OperationsChat() {
  const toast = useToast()
  const { data, refresh } = usePolling(getChatMessages, 8000)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const boxRef = useRef(null)
  const messages = data ?? []

  useEffect(() => {
    // Solo se desplaza la caja del chat (scrollIntoView movía toda la página)
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const send = async (message) => {
    if (!message.trim()) return
    setSending(true)
    try {
      await postChatMessage(message.trim())
      setText('')
      await refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Glass variants={revealItem}>
      <div className="card-head">
        <h3 className="title-md">
          <MessageSquare size={18} /> Central de operaciones
        </h3>
      </div>
      <div className="chat" ref={boxRef}>
        {!messages.length && <p className="empty">Sin mensajes todavía.</p>}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={`bubble ${m.from}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="chips">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => send(q)} disabled={sending}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe a la central…" maxLength={500} />
        <Button type="submit" icon disabled={sending || !text.trim()} aria-label="Enviar">
          <Send size={16} />
        </Button>
      </form>
    </Glass>
  )
}

function Operator() {
  const toast = useToast()
  const { stations } = useStations()
  const { data: bus, error, loading: busLoading, fetchedAt } = usePolling(getMyVehicle, 2000)
  const shift = usePolling(getShift, 15000)
  const reports = usePolling(getDriverReports, 10000)
  const activeSos = reports.data?.reports.find((r) => r.priority === 'sos' && r.status !== 'closed')
  const now = useNow(1000)
  const [doorsOpen, setDoorsOpen] = useState(false)
  const elapsed = (now - fetchedAt) / 1000

  // Seguridad: si el bus arranca, las puertas se cierran solas
  useEffect(() => {
    if (bus && bus.speed > 0 && doorsOpen) {
      setDoorsOpen(false)
      toast.info('Puertas cerradas automáticamente: el bus está en movimiento')
    }
  }, [bus, doorsOpen, toast])

  const toggleDoors = (open) => {
    if (open && bus?.speed > 0) {
      toast.error(`Bloqueo de seguridad: el bus va a ${bus.speed} km/h`)
      return
    }
    setDoorsOpen(open)
  }

  if (error && !bus) {
    return (
      <Glass strong style={{ maxWidth: 560, margin: '40px auto' }}>
        <h2 className="title-md">Sin bus asignado</h2>
        <p className="muted">{error.message}</p>
      </Glass>
    )
  }

  const segment = bus ? Math.abs(bus.position - bus.currentIndex) / Math.max(1, Math.abs(bus.nextIndex - bus.currentIndex)) : 0

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">Panel de operador</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            {bus ? `Bus ${bus.label}` : 'Cargando bus…'}
          </h1>
          <p>{bus ? `${bus.service} · ${bus.routeName}` : ' '}</p>
        </div>
        <SosButton active={activeSos} onSent={reports.refresh} />
      </Reveal.Item>

      <Glass variants={revealItem} dark style={{ marginBottom: 20 }}>
        {!bus ? (
          <Skeleton h={140} />
        ) : (
          <div className="op-hero">
            <div>
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>
                <Navigation size={12} /> {bus.atStation ? 'Detenido en estación' : `Rumbo al ${bus.direction}`}
              </span>
              <div className="op-stations">
                <b>{bus.currentStation}</b>
                <span style={{ opacity: 0.5 }}>→</span>
                <b style={{ color: 'var(--muted)' }}>{bus.nextStation}</b>
              </div>
              <div className="op-progress">
                <motion.i animate={{ width: `${Math.round(segment * 100)}%` }} transition={{ type: 'tween', ease: 'linear', duration: 2 }} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 13, opacity: 0.7 }}>
                Llegada a {bus.nextStation}: {formatEta(Math.max(0, bus.upcomingStops[0].etaSeconds - elapsed))}
              </p>
            </div>
            <div className="gauges">
              <Gauge value={bus.speed} max={60} unit="km/h" color="var(--text)" />
              <Gauge value={bus.occupancyPct} max={100} unit="% aforo" color="var(--yellow)" />
            </div>
          </div>
        )}
      </Glass>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <ShiftCard shift={shift} onChange={shift.refresh} />
        <HeadwayCard headway={bus?.headway} loading={busLoading && !bus} />
      </div>

      {bus && (
        <Glass variants={revealItem} style={{ marginBottom: 20 }}>
          <RouteLine stations={stations} vehicles={[bus]} focusVehicle={bus.vehicleId} tween={2} />
        </Glass>
      )}

      <div className="grid grid-3">
        <div className="stack">
          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">Próximas paradas</h3>
            </div>
            {bus ? (
              <ol className="upcoming">
                {bus.upcomingStops.map((u, i) => (
                  <li key={`${u.stationId}-${i}`}>
                    <span className="up-dot" />
                    <span className="up-name">{u.name}</span>
                    <span className="mono up-eta">{formatEta(Math.max(0, u.etaSeconds - elapsed))}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Skeleton h={150} />
            )}
          </Glass>
          <Glass variants={revealItem}>
            <div className="row between">
              <div>
                <h3 className="title-md" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <DoorOpen size={18} /> Puertas
                </h3>
                <small className="muted">{doorsOpen ? 'Abiertas' : bus?.speed > 0 ? 'Bloqueadas en movimiento' : 'Cerradas'}</small>
              </div>
              <Switch checked={doorsOpen} onChange={toggleDoors} label="Abrir o cerrar puertas" />
            </div>
          </Glass>
          <ReportsCard reports={reports} onChange={reports.refresh} />
        </div>

        <div className="stack">
          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">Ocupación por vagón</h3>
            </div>
            <Occupancy cars={bus?.cars} />
          </Glass>
          <Checklist onChange={shift.refresh} />
        </div>

        <div className="stack">
          <NoticesCard />
          <OperationsChat />
        </div>
      </div>
    </Reveal>
  )
}

export default Operator
