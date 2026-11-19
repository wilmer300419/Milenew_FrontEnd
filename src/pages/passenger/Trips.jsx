import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpDown, CircleDot, History, MapPin, RotateCcw, Ticket } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { useActiveTrip } from '../../context/TripContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { useFavorites, useStations } from '../../hooks/useTransit.js'
import { planTrip } from '../../services/transitService.js'
import { getTrips, startTrip } from '../../services/tripService.js'
import { getWallet } from '../../services/walletService.js'
import { formatDateTime, formatPrice } from '../../utils/formatters.js'
import { haptic } from '../../utils/human.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Ticker from '../../components/ui/Ticker.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'
import StationPicker from '../../components/transit-ui/StationPicker.jsx'
import ActiveTripCard from '../../components/transit-ui/ActiveTripCard.jsx'

const svcCode = (service) => (service === 'Expreso' ? 'B75' : 'C15')

function Trips() {
  const toast = useToast()
  const { stations } = useStations()
  const favorites = useFavorites()
  const { trip: activeTrip, setTrip } = useActiveTrip()
  const trips = usePolling(getTrips, 0)
  const wallet = usePolling(getWallet, 0)
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [plan, setPlan] = useState(null)
  const [planning, setPlanning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const topRef = useRef(null)

  const history = useMemo(() => trips.data ?? [], [trips.data])
  const balance = wallet.data?.balance ?? 0

  // Estaciones usadas recientemente (para el buscador)
  const recents = useMemo(() => {
    const ids = []
    for (const t of history) for (const id of [t.fromStationId, t.toStationId]) if (!ids.includes(id)) ids.push(id)
    return ids
  }, [history])

  // Tramos más repetidos
  const frequent = useMemo(() => {
    const map = new Map()
    for (const t of history) {
      const key = `${t.fromStationId}-${t.toStationId}`
      const item = map.get(key) ?? { ...t, count: 0 }
      item.count += 1
      map.set(key, item)
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 3)
  }, [history])

  // La ruta se calcula sola al tener origen y destino
  useEffect(() => {
    if (!fromId || !toId) {
      setPlan(null)
      return undefined
    }
    let active = true
    setPlanning(true)
    planTrip(fromId, toId)
      .then((res) => active && setPlan(res.data))
      .catch((err) => active && toast.error(err.message))
      .finally(() => active && setPlanning(false))
    return () => {
      active = false
    }
  }, [fromId, toId, toast])

  const choose = (from, to) => {
    setFromId(String(from))
    setToId(String(to))
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const swap = () => {
    setFromId(toId)
    setToId(fromId)
  }

  const pay = async () => {
    try {
      const res = await startTrip(Number(fromId), Number(toId))
      haptic([12, 60, 18])
      setTrip(res.data)
      toast.success(`Pasaje pagado. Nuevo saldo ${formatPrice(res.data.balance)}`)
      setFromId('')
      setToId('')
      trips.refresh()
      wallet.refresh()
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  const stationName = (id) => stations.find((s) => String(s.id) === String(id))?.name
  const valid = plan && !plan.sameStation
  const enough = valid && balance >= plan.fare

  return (
    <Reveal>
      <Reveal.Item className="page-head" ref={topRef}>
        <div>
          <span className="eyebrow">Viajes</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            ¿A dónde vas?
          </h1>
          <p>Elige origen y destino: te decimos si conviene el expreso o el corriente.</p>
        </div>
        <Link to="/app/tullave" className="head-stat" aria-label="Saldo de tu TuLlave">
          <small>Saldo TuLlave</small>
          <b>
            <Ticker value={balance} format={(n) => formatPrice(n)} />
          </b>
        </Link>
      </Reveal.Item>

      <div className="grid grid-main">
        <div className="stack">
          {activeTrip && <ActiveTripCard />}

          <Glass variants={revealItem} strong className="allow-overflow">
            <div className="planner">
              <StationPicker
                label="Origen"
                icon={CircleDot}
                stations={stations}
                value={fromId}
                onChange={setFromId}
                favorites={favorites.set}
                recents={recents}
              />
              <Button variant="glass" icon className="swap" onClick={swap} aria-label="Invertir origen y destino" disabled={!fromId && !toId}>
                <ArrowUpDown size={18} />
              </Button>
              <StationPicker
                label="Destino"
                icon={MapPin}
                stations={stations}
                value={toId}
                onChange={setToId}
                favorites={favorites.set}
                recents={recents}
              />
            </div>

            <AnimatePresence mode="wait">
              {planning && !plan && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: 18 }}>
                  <Skeleton h={76} r={16} />
                </motion.div>
              )}
              {!fromId && !toId && !planning && (
                <motion.p key="hint" className="planner-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Escribe el nombre de una estación, por ejemplo “Calle 26”.
                </motion.p>
              )}
              {plan?.sameStation && (
                <motion.div key="same" className="alert info" style={{ marginTop: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Origen y destino son la misma estación.
                </motion.div>
              )}
              {valid && (
                <motion.div key={`${fromId}-${toId}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="plan-stats">
                    {[
                      ['Servicio', plan.bestService],
                      ['Duración', `${plan.bestMinutes} min`],
                      ['Paradas', plan.stops],
                      ['Pasaje', formatPrice(plan.fare)],
                    ].map(([k, v], i) => (
                      <motion.div key={k} className="plan-stat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <small>{k}</small>
                        <b>{v}</b>
                      </motion.div>
                    ))}
                  </div>
                  <p className="plan-advice">
                    {plan.savedMinutes > 0
                      ? `Toma el expreso B75: ahorras ${plan.savedMinutes} min frente al corriente.`
                      : plan.expressAvailable
                        ? 'El corriente es igual de rápido en este tramo.'
                        : 'El expreso no para en alguna de estas estaciones: toma el corriente C15.'}{' '}
                    Sentido {plan.direction}.
                  </p>
                  <div className="legs" aria-label="Estaciones del recorrido">
                    {plan.legs.map((leg, i) => (
                      <span key={leg.station.id} className={`leg ${leg.skipped ? 'skipped' : ''} ${i === 0 || i === plan.legs.length - 1 ? 'end' : ''}`}>
                        {leg.station.name}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 18 }}>
                    {enough ? (
                      <Button size="lg" block onClick={() => setConfirming(true)}>
                        <Ticket size={18} /> Pagar {formatPrice(plan.fare)}
                      </Button>
                    ) : (
                      <Link to="/app/tullave">
                        <Button variant="glass" size="lg" block>
                          Saldo insuficiente · recargar TuLlave
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Glass>
        </div>

        <div className="stack">
          {frequent.length > 0 && (
            <Glass variants={revealItem}>
              <div className="card-head">
                <h3 className="title-md">Tus tramos frecuentes</h3>
              </div>
              <div className="frequent">
                {frequent.map((t) => (
                  <button key={`${t.fromStationId}-${t.toStationId}`} type="button" className="frequent-item" onClick={() => choose(t.fromStationId, t.toStationId)}>
                    <span className={`svc ${t.service === 'Expreso' ? 'express' : ''}`}>{svcCode(t.service)}</span>
                    <span className="frequent-text">
                      <b>
                        {t.fromName} → {t.toName}
                      </b>
                      <small>
                        {t.count} {t.count === 1 ? 'viaje' : 'viajes'}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </Glass>
          )}

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">
                <History size={17} /> Historial
              </h3>
              <span className="chip">{history.length}</span>
            </div>
            {trips.loading ? (
              <Skeleton h={120} />
            ) : history.length ? (
              <ul className="list">
                <AnimatePresence initial={false}>
                  {history.map((t) => (
                    <motion.li key={t.id} className="list-item" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <span className={`svc ${t.service === 'Expreso' ? 'express' : ''}`}>{svcCode(t.service)}</span>
                      <span className="list-text">
                        <b>
                          {t.fromName} → {t.toName}
                        </b>
                        <small>
                          {formatDateTime(t.startedAt)} · {formatPrice(t.fare)}
                        </small>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon
                        onClick={() => choose(t.fromStationId, t.toStationId)}
                        aria-label={`Repetir viaje ${t.fromName} a ${t.toName}`}
                        title="Repetir viaje"
                      >
                        <RotateCcw size={15} />
                      </Button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="empty">Cuando pagues tu primer viaje aparecerá aquí.</p>
            )}
          </Glass>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Confirmar pago"
        subtitle="Se descontará de tu tarjeta TuLlave."
        rows={
          valid
            ? [
                { label: 'Tramo', value: `${stationName(fromId)} → ${stationName(toId)}` },
                { label: 'Servicio', value: `${plan.bestService} · ~${plan.bestMinutes} min` },
                { label: 'Saldo actual', value: formatPrice(balance) },
                { label: 'Pasaje', value: `− ${formatPrice(plan.fare)}` },
                { label: 'Saldo después', value: formatPrice(balance - plan.fare), strong: true },
              ]
            : []
        }
        note={activeTrip ? `Tu viaje actual a ${activeTrip.toName} se dará por terminado.` : null}
        confirmLabel={valid ? `Pagar ${formatPrice(plan.fare)}` : 'Pagar'}
        onConfirm={pay}
      />
    </Reveal>
  )
}

export default Trips
