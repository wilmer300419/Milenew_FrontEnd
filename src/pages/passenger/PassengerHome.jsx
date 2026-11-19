import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CreditCard, Route as RouteIcon, Star } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useActiveTrip } from '../../context/TripContext.jsx'
import { useNotifications } from '../../context/NotificationsContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { shortRouteName, useAllStations, useFavorites, useRoutes, useSelectedRoute, useStations, useVehicles } from '../../hooks/useTransit.js'
import { getWallet } from '../../services/walletService.js'
import { getTrips } from '../../services/tripService.js'
import { firstName, formatDateTime, formatPrice, greeting, serviceCode } from '../../utils/formatters.js'
import { daySubline, haptic } from '../../utils/human.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Ticker from '../../components/ui/Ticker.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import Segmented from '../../components/ui/Segmented.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'
import RouteLine from '../../components/transit-ui/RouteLine.jsx'
import Arrivals from '../../components/transit-ui/Arrivals.jsx'
import ActiveTripCard from '../../components/transit-ui/ActiveTripCard.jsx'

// Estación con más movimiento: se sugiere mientras el usuario no tenga favoritas
const SUGGESTED_CODE = 'calle-26'

function PassengerHome() {
  const { user } = useAuth()
  const toast = useToast()
  const { trip } = useActiveTrip()
  const notifications = useNotifications()
  const [route] = useSelectedRoute()
  const { routes } = useRoutes()
  const { stations } = useStations(route)
  const allStations = useAllStations()
  const { vehicles } = useVehicles(route)
  const favorites = useFavorites(() => toast.error('No se pudo actualizar la favorita'))
  const wallet = usePolling(getWallet, 30000)
  const trips = usePolling(getTrips, 0)
  const [favIndex, setFavIndex] = useState(0)

  const favStations = allStations.filter((s) => favorites.set.has(s.id))
  const suggested = allStations.find((s) => s.code === SUGGESTED_CODE) ?? allStations[0]
  const current = favStations.length ? favStations[Math.min(favIndex, favStations.length - 1)] : suggested

  const markSuggested = async () => {
    await favorites.toggle(suggested.id)
    haptic(10)
    toast.success(`${suggested.name} ahora es tu favorita.`)
  }

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">
            {new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            {greeting()}, {firstName(user?.name)}.
          </h1>
          <p>{daySubline()}</p>
        </div>
        <Link to="/app/viajes">
          <Button>
            <RouteIcon size={17} /> Planear viaje
          </Button>
        </Link>
      </Reveal.Item>

      <div className="grid grid-main">
        <div className="stack">
          {trip && <ActiveTripCard />}

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">
                <Star size={18} /> Próximas llegadas
              </h3>
              {favStations.length > 1 && (
                <Segmented
                  size="sm"
                  options={favStations.map((s, i) => ({ value: i, label: s.name }))}
                  value={Math.min(favIndex, favStations.length - 1)}
                  onChange={setFavIndex}
                />
              )}
            </div>
            {!favorites.loaded || !current ? (
              <Skeleton h={120} r={16} />
            ) : (
              <>
                <div className="row between wrap" style={{ margin: '-6px 0 12px' }}>
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    Estación <b style={{ color: 'var(--text)' }}>{current.name}</b>
                    {!favStations.length && ' · sugerida'}
                  </p>
                  {!favStations.length && (
                    <Button variant="glass" size="sm" onClick={markSuggested}>
                      <Star size={14} /> Marcar como favorita
                    </Button>
                  )}
                </div>
                <Arrivals stationId={current.id} route={current.routeCode} />
              </>
            )}
          </Glass>

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">
                <span className="live-dot" /> Troncal {shortRouteName(routes.find((r) => r.code === route)) || 'Caracas'}
              </h3>
              <Link to="/app/en-vivo" className="link" style={{ fontSize: 13 }}>
                Ver en vivo
              </Link>
            </div>
            <RouteLine stations={stations} vehicles={vehicles} favorites={favorites.set} compact />
          </Glass>
        </div>

        <div className="stack">
          <Glass variants={revealItem} dark tilt>
            <div className="card-head">
              <h3 className="title-md">
                <CreditCard size={18} /> TuLlave
              </h3>
              <span className="chip">Saldo</span>
            </div>
            <div className="big-money">
              {wallet.data ? <Ticker value={wallet.data.balance} format={(n) => formatPrice(n)} /> : '—'}
            </div>
            <Link to="/app/tullave">
              <Button block>Recargar tarjeta</Button>
            </Link>
          </Glass>

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">
                <RouteIcon size={18} /> Últimos viajes
              </h3>
              <Link to="/app/viajes" className="link" style={{ fontSize: 13 }}>
                Historial
              </Link>
            </div>
            {trips.loading ? (
              <Skeleton h={60} />
            ) : trips.data?.length ? (
              <ul className="list">
                {trips.data.slice(0, 3).map((t) => (
                  <li key={t.id} className="list-item">
                    <span className={`svc ${t.service === 'Expreso' ? 'express' : ''}`}>{serviceCode(t)}</span>
                    <span className="list-text">
                      <b>
                        {t.fromName} → {t.toName}
                      </b>
                      <small>{formatDateTime(t.startedAt)}</small>
                    </span>
                    <span className="list-amount">{formatPrice(t.fare)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <p style={{ margin: '0 0 12px' }}>Aún no has hecho viajes.</p>
                <Link to="/app/viajes">
                  <Button variant="glass" size="sm">
                    Planear el primero <ArrowRight size={15} />
                  </Button>
                </Link>
              </div>
            )}
          </Glass>

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">
                <Bell size={18} /> Avisos
              </h3>
              {notifications.unread > 0 && <span className="chip yellow">{notifications.unread} nuevos</span>}
            </div>
            {notifications.items.length ? (
              <ul className="list">
                {notifications.items.slice(0, 3).map((n) => (
                  <li key={n.id} className="list-item">
                    <span className={`notif-dot ${n.unread ? 'on' : ''}`} aria-hidden="true" />
                    <span className="list-text">
                      <b>{n.title}</b>
                      <small>{n.description}</small>
                    </span>
                    <small className="muted" style={{ whiteSpace: 'nowrap', fontSize: 11.5 }}>
                      {n.relativeTime}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">Sin avisos por ahora.</p>
            )}
          </Glass>
        </div>
      </div>
    </Reveal>
  )
}

export default PassengerHome
