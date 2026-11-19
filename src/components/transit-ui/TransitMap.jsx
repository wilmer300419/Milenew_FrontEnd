import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Mapa geográfico real (OpenStreetMap) de una troncal: recorrido, estaciones y buses en vivo.
 * Las coordenadas son aproximadas. Se carga bajo demanda (React.lazy) para no pesar en el resto de la app.
 */
function lerp(a, b, t) {
  return a + (b - a) * t
}

/** Posición geográfica de un bus a partir de su posición continua entre estaciones. */
function busLatLng(stations, position) {
  const i = Math.max(0, Math.min(stations.length - 1, Math.floor(position)))
  const j = Math.min(stations.length - 1, i + 1)
  const t = position - i
  return [lerp(Number(stations[i].lat), Number(stations[j].lat), t), lerp(Number(stations[i].lng), Number(stations[j].lng), t)]
}

function busIcon(v, focus) {
  return L.divIcon({
    className: `map-bus ${v.service === 'Expreso' ? 'express' : ''} ${focus ? 'focus' : ''} ${v.direction}`,
    html: `<span class="rl-bus-body"><i></i></span><span class="map-bus-tag">${v.label.split(' · ')[0]}</span>`,
    iconSize: [34, 30],
    iconAnchor: [17, 15],
  })
}

function TransitMap({ stations, vehicles = [], color = '#b43c3a', selectedId, onSelect, favorites, focusVehicle }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({ route: null, stations: new Map(), buses: new Map() })
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Crear el mapa una vez
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    map.setView([4.65, -74.07], 12)
    mapRef.current = map
    // Rueda del mouse solo después de hacer clic (no "atrapa" el scroll de la página)
    map.on('click', () => map.scrollWheelZoom.enable())
    map.on('mouseout', () => map.scrollWheelZoom.disable())
    return () => {
      map.remove()
      mapRef.current = null
      layersRef.current = { route: null, stations: new Map(), buses: new Map() }
    }
  }, [])

  // Recorrido y estaciones (cuando cambia la troncal)
  useEffect(() => {
    const map = mapRef.current
    const geo = stations.filter((s) => s.lat != null && s.lng != null)
    if (!map || !geo.length) return
    const layers = layersRef.current
    layers.route?.remove()
    layers.stations.forEach((m) => m.remove())
    layers.stations.clear()
    layers.buses.forEach((m) => m.remove())
    layers.buses.clear()

    const latlngs = geo.map((s) => [Number(s.lat), Number(s.lng)])
    layers.route = L.layerGroup([
      L.polyline(latlngs, { color: '#000', weight: 9, opacity: 0.35 }),
      L.polyline(latlngs, { color, weight: 5, opacity: 0.95 }),
    ]).addTo(map)
    geo.forEach((s) => {
      const marker = L.circleMarker([Number(s.lat), Number(s.lng)], {
        radius: 6,
        weight: 2.5,
        color: '#111',
        fillColor: s.isExpressStop ? '#c6a346' : '#f1efea',
        fillOpacity: 1,
      })
        .bindTooltip(s.name, { direction: 'top', offset: [0, -6] })
        .on('click', () => onSelectRef.current?.(s))
        .addTo(map)
      layers.stations.set(s.id, marker)
    })
    map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] })
  }, [stations, color])

  // Estación elegida y favoritas
  useEffect(() => {
    layersRef.current.stations.forEach((marker, id) => {
      const selected = id === selectedId
      marker.setStyle({ radius: selected ? 9 : 6, color: selected ? '#c6a346' : favorites?.has(id) ? '#c6a346' : '#111' })
      if (selected) marker.bringToFront()
    })
  }, [selectedId, favorites, stations])

  // Buses en vivo (se deslizan con transición CSS entre consultas)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !stations.length || stations.some((s) => s.lat == null)) return
    const buses = layersRef.current.buses
    const seen = new Set()
    vehicles.forEach((v) => {
      seen.add(v.vehicleId)
      const pos = busLatLng(stations, v.position)
      const focus = v.vehicleId === focusVehicle
      let marker = buses.get(v.vehicleId)
      if (!marker) {
        marker = L.marker(pos, { icon: busIcon(v, focus), keyboard: false, zIndexOffset: 500 }).addTo(map)
        marker.bindTooltip(v.label, { direction: 'top', offset: [0, -14] })
        buses.set(v.vehicleId, marker)
      } else {
        marker.setLatLng(pos)
        marker.setIcon(busIcon(v, focus))
      }
    })
    buses.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove()
        buses.delete(id)
      }
    })
  }, [vehicles, stations, focusVehicle])

  return (
    <div className="transit-map-wrap">
      <div ref={elRef} className="transit-map" role="region" aria-label="Mapa de la troncal" />
      <p className="map-note">Coordenadas aproximadas · mapa © OpenStreetMap</p>
    </div>
  )
}

export default TransitMap
