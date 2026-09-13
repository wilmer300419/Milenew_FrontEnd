import { useState } from 'react'
import '../styles/transit.css'
import { useAuth } from '../context/AuthContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { useEventLog } from '../hooks/useEventLog.js'
import { getStations, getRouteStatus, getWallet, getNotifications } from '../services/transitService.js'
import BackgroundField from '../components/transit/BackgroundField.jsx'
import RouteMap from '../components/transit/RouteMap.jsx'
import StationList from '../components/transit/StationList.jsx'
import TripPlanner from '../components/transit/TripPlanner.jsx'
import WalletCard from '../components/transit/WalletCard.jsx'
import NotificationsPanel from '../components/transit/NotificationsPanel.jsx'
import OccupancyCars from '../components/transit/OccupancyCars.jsx'
import StationModal from '../components/transit/StationModal.jsx'
import IncidentModal from '../components/transit/IncidentModal.jsx'
import TerminalLog from '../components/transit/TerminalLog.jsx'
import DriverPanel from '../components/transit/DriverPanel/DriverPanel.jsx'
import Card from '../components/common/Card.jsx'
import Button from '../components/common/Button.jsx'

const ROUTE_ID = 'caracas-b75'
const VEHICLE_ID = 'vagon-02'

function Troncal() {
  const { user } = useAuth()
  const role = user?.role === 'driver' ? 'driver' : 'user'

  const stationsQ = useFetch(getStations, [])
  const routeQ = useFetch(() => getRouteStatus(ROUTE_ID), [])
  const walletQ = useFetch(getWallet, [])
  const notifsQ = useFetch(getNotifications, [])
  const { entries, log } = useEventLog()

  const stations = stationsQ.data?.data ?? []
  const currentIndex = routeQ.data?.data?.currentIndex ?? null

  const [favorites, setFavorites] = useState(() => new Set())
  const [selectedStation, setSelectedStation] = useState(null)
  const [incidentOpen, setIncidentOpen] = useState(false)

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      const wasFav = next.has(id)
      wasFav ? next.delete(id) : next.add(id)
      const station = stations.find((s) => s.id === id)
      log(wasFav ? 'ok' : 'new', `favorita · ${station?.name ?? id} ${wasFav ? 'retirada' : 'añadida'}`)
      return next
    })
  }

  return (
    <div className="troncal">
      <BackgroundField />
      <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero">
          <div>
            <div className="eyebrow">
              <span className="sq" />
              Troncal Caracas · {role === 'driver' ? 'Operación · vagón 02' : 'En vivo'}
            </div>
            <h1 className="htitle" style={{ margin: '12px 0 6px' }}>
              {role === 'driver' ? 'Panel de conductor' : 'Sigue tu bus'}
            </h1>
            <p style={{ color: 'var(--dim)', fontSize: 13.5 }}>Calle 76 ↔ Portal Tunal</p>
          </div>
          {role === 'user' && (
            <Button variant="fill" onClick={() => setIncidentOpen(true)}>
              Reportar incidencia
            </Button>
          )}
        </div>

        {stationsQ.error && <p className="error">No se pudo cargar la lista de estaciones.</p>}

        <Card style={{ marginBottom: 20 }}>
          <div className="sec">
            <h3>Mapa de la troncal</h3>
            <span className="act">{stationsQ.loading ? 'cargando…' : `${stations.length} estaciones`}</span>
          </div>
          <RouteMap
            stations={stations}
            currentIndex={currentIndex}
            favorites={favorites}
            onSelectStation={setSelectedStation}
            loading={stationsQ.loading}
          />
        </Card>

        <div className="g2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <div className="sec">
                <h3>Estaciones</h3>
                <span className="act">{stationsQ.loading ? 'cargando…' : `${stations.length} paradas`}</span>
              </div>
              <StationList
                stations={stations}
                currentIndex={currentIndex}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onSelectStation={setSelectedStation}
                loading={stationsQ.loading}
              />
            </Card>
            <Card>
              <div className="sec">
                <h3>Planear viaje</h3>
              </div>
              <TripPlanner stations={stations} />
            </Card>
            <TerminalLog title="transmi-caracas ~ b75.log" entries={entries} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {role === 'user' ? (
              <>
                <WalletCard walletQuery={walletQ} onRecharge={() => log('end', 'recarga aplicada · +$10.000')} />
                <Card>
                  <div className="sec">
                    <h3>Ocupación por vagón</h3>
                  </div>
                  <OccupancyCars cars={routeQ.data?.data?.telemetry?.cars} />
                </Card>
                <Card>
                  <div className="sec">
                    <h3>Notificaciones</h3>
                  </div>
                  <NotificationsPanel notifsQuery={notifsQ} />
                </Card>
              </>
            ) : (
              <DriverPanel vehicleId={VEHICLE_ID} />
            )}
          </div>
        </div>
      </div>

      <StationModal
        station={selectedStation}
        isFavorite={selectedStation ? favorites.has(selectedStation.id) : false}
        onToggleFavorite={() => selectedStation && toggleFavorite(selectedStation.id)}
        onClose={() => setSelectedStation(null)}
      />
      {incidentOpen && (
        <IncidentModal
          onClose={() => setIncidentOpen(false)}
          onSent={(category) => log('new', `incidencia enviada · ${category}`)}
        />
      )}
    </div>
  )
}

export default Troncal
