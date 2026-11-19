import { Suspense, lazy, useState } from 'react'
import { AlertTriangle, Bus, Info, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { LIVE_INTERVAL, useFavorites, useRoutes, useSelectedRoute, useStations, useVehicles } from '../../hooks/useTransit.js'
import { haptic } from '../../utils/human.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Segmented from '../../components/ui/Segmented.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import Freshness from '../../components/ui/Freshness.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'
import RouteLine from '../../components/transit-ui/RouteLine.jsx'
import StationList from '../../components/transit-ui/StationList.jsx'
import Arrivals from '../../components/transit-ui/Arrivals.jsx'
import BusCard from '../../components/transit-ui/BusCard.jsx'
import IncidentModal from '../../components/transit-ui/IncidentModal.jsx'
import RouteSwitcher from '../../components/transit-ui/RouteSwitcher.jsx'

// El mapa (Leaflet) solo se descarga si el usuario lo abre
const TransitMap = lazy(() => import('../../components/transit-ui/TransitMap.jsx'))

const VIEWS = [
  { value: 'map', label: 'Mapa' },
  { value: 'line', label: 'Línea' },
]

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'Expreso', label: 'Expreso' },
  { value: 'Corriente', label: 'Corriente' },
]

/** Buses y recorrido: estaciones, próximas llegadas y próximas paradas de cada bus. */
function Live() {
  const { isPassenger } = useAuth()
  const toast = useToast()
  const [route, setRoute] = useSelectedRoute()
  const { routes } = useRoutes()
  const routeInfo = routes.find((r) => r.code === route)
  const { stations, loading: loadingStations, error } = useStations(route)
  const { vehicles, fetchedAt } = useVehicles(route)
  const [view, setView] = useState('map')
  const favorites = useFavorites(() => toast.error('No se pudo actualizar la favorita'))
  const [selectedId, setSelectedId] = useState(null)
  const [busId, setBusId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [incidentOpen, setIncidentOpen] = useState(false)

  const selected = stations.find((s) => s.id === selectedId) ?? stations[0]

  const changeRoute = (code) => {
    setRoute(code)
    setSelectedId(null)
    setBusId(null)
  }
  const shown = vehicles.filter((v) => filter === 'all' || v.service === filter)

  const toggleFavorite = async (station) => {
    const added = await favorites.toggle(station.id)
    haptic(10)
    toast.success(added ? `${station.name} ahora es tu favorita.` : `${station.name} ya no es favorita.`)
  }

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">{routeInfo?.name ?? 'Troncal'}</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            Buses y recorrido
          </h1>
          <p>Elige una estación para ver cuándo llega el próximo bus.</p>
        </div>
        <div className="row wrap">
          <RouteSwitcher value={route} onChange={changeRoute} />
          {isPassenger && (
            <Button variant="glass" onClick={() => setIncidentOpen(true)}>
              <AlertTriangle size={16} /> Reportar incidencia
            </Button>
          )}
        </div>
      </Reveal.Item>

      {error && (
        <div className="alert" style={{ marginBottom: 16 }}>
          No se pudo cargar la troncal: {error.message}
        </div>
      )}

      <Glass variants={revealItem} style={{ marginBottom: 20 }}>
        <div className="live-status">
          <span className="row" style={{ gap: 8 }}>
            <span className="live-dot" /> <b>En vivo</b>
            <Freshness at={fetchedAt} />
          </span>
          <span className="row wrap" style={{ gap: 10 }}>
            <span className="chip" title="Aún no hay GPS: la posición de los buses se calcula a partir del horario.">
              <Info size={12} /> Ubicación simulada
            </span>
            <Segmented size="sm" options={FILTERS} value={filter} onChange={setFilter} />
            <Segmented size="sm" options={VIEWS} value={view} onChange={setView} />
          </span>
        </div>
        {loadingStations ? (
          <Skeleton h={70} r={14} />
        ) : view === 'map' ? (
          <Suspense fallback={<Skeleton h={360} r={16} />}>
            <TransitMap
              stations={stations}
              vehicles={shown}
              color={routeInfo?.color}
              selectedId={selected?.id}
              onSelect={(s) => setSelectedId(s.id)}
              favorites={favorites.set}
              focusVehicle={busId}
            />
          </Suspense>
        ) : (
          <RouteLine
            stations={stations}
            vehicles={shown}
            selectedId={selected?.id}
            onSelect={(s) => setSelectedId(s.id)}
            favorites={favorites.set}
            focusVehicle={busId}
            tween={LIVE_INTERVAL / 1000}
            compact
          />
        )}
      </Glass>

      <div className="grid grid-main">
        <Glass variants={revealItem}>
          <div className="card-head">
            <h3 className="title-md">
              <MapPin size={18} /> Estaciones
            </h3>
            <span className="chip">{stations.length} paradas</span>
          </div>
          {loadingStations ? (
            <Skeleton h={400} r={16} />
          ) : (
            <StationList
              stations={stations}
              vehicles={shown}
              selectedId={selected?.id}
              onSelect={(s) => setSelectedId(s.id)}
              favorites={favorites.set}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </Glass>

        <div className="stack live-side">
          <Glass variants={revealItem} strong>
            <div className="card-head">
              <h3 className="title-md">Próximas llegadas</h3>
              {selected && <span className="chip">{selected.name}</span>}
            </div>
            {selected ? <Arrivals stationId={selected.id} route={route} /> : <Skeleton h={100} />}
          </Glass>

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">
                <Bus size={18} /> Buses en ruta
              </h3>
              <span className="chip">{shown.length}</span>
            </div>
            <p className="muted" style={{ margin: '-8px 0 12px', fontSize: 12.5 }}>
              Toca un bus para ver sus próximas paradas y seguirlo en el mapa.
            </p>
            <div className="bus-list">
              {shown.map((v) => (
                <BusCard
                  key={v.vehicleId}
                  vehicle={v}
                  fetchedAt={fetchedAt}
                  active={v.vehicleId === busId}
                  onClick={() => setBusId((id) => (id === v.vehicleId ? null : v.vehicleId))}
                />
              ))}
            </div>
          </Glass>
        </div>
      </div>

      <IncidentModal open={incidentOpen} onClose={() => setIncidentOpen(false)} route={route} />
    </Reveal>
  )
}

export default Live
