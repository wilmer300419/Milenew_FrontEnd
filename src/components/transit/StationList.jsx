function StationList({ stations, currentIndex, favorites, onToggleFavorite, onSelectStation, loading }) {
  if (loading) return <p className="empty">Cargando estaciones…</p>
  if (!stations.length) return <p className="empty">No hay estaciones disponibles todavía.</p>

  const rowHeight = 100 / stations.length
  const fillHeight = currentIndex != null ? `${rowHeight * (currentIndex + 0.5)}%` : '0%'

  return (
    <div className="vlist" style={{ maxHeight: 320, overflowY: 'auto' }}>
      <div className="rail" />
      <div className="fill" style={{ height: fillHeight }} />
      {stations.map((station, i) => (
        <div
          key={station.id}
          className={['vrow', i < currentIndex ? 'past' : '', i === currentIndex ? 'now' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelectStation(station)}
        >
          <div className="nd" />
          <div>
            <div className="nm">{station.name}</div>
            <div className="sb">
              {i === 0 ? 'Terminal norte' : i === stations.length - 1 ? 'Portal · terminal sur' : 'Estación sencilla'}
              {station.isExpressStop ? ' · para el expreso' : ''}
            </div>
          </div>
          <button
            type="button"
            className={`star ${favorites.has(station.id) ? 'on' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(station.id)
            }}
            aria-label="Marcar favorita"
          >
            <svg viewBox="0 0 24 24">
              <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export default StationList
