const GAP = 104
const PAD = 60
const Y = 60
const H = 116

function RouteMap({ stations, currentIndex, favorites, onSelectStation, loading }) {
  if (loading) return <p className="empty">Cargando mapa de la troncal…</p>
  if (!stations.length) return <p className="empty">No hay estaciones para mostrar en el mapa.</p>

  const width = PAD * 2 + GAP * (stations.length - 1)
  const travelled = currentIndex != null ? GAP * currentIndex : 0
  const hasBus = currentIndex != null

  return (
    <div className="mapwrap">
      <svg className="routemap" viewBox={`0 0 ${width} ${H}`} width={width} height={H}>
        <text className="zone" x={PAD - 16} y={Y + 40}>
          NORTE ←
        </text>
        <text className="zone" x={width - PAD - 40} y={Y + 40}>
          → SUR
        </text>
        <line className="casing" x1={PAD} y1={Y} x2={width - PAD} y2={Y} />
        <line className="rail" x1={PAD} y1={Y} x2={width - PAD} y2={Y} />
        <line
          className="rail-done"
          x1={PAD}
          y1={Y}
          x2={width - PAD}
          y2={Y}
          strokeDasharray={width}
          strokeDashoffset={width - travelled}
        />

        {stations.map((station, i) => {
          const x = PAD + i * GAP
          const isTerminal = i === 0 || i === stations.length - 1
          const isNow = i === currentIndex
          const isFav = favorites.has(station.id)
          return (
            <g
              key={station.id}
              className={['st', isTerminal ? 'term' : '', isNow ? 'now' : '', isFav ? 'fav' : '']
                .filter(Boolean)
                .join(' ')}
              transform={`translate(${x},0)`}
              onClick={() => onSelectStation(station)}
            >
              <circle className="node" cx="0" cy={Y} r={isTerminal ? 8 : 6} />
              <path
                className="fav"
                d="M0,-5 1.5,-1.5 5,-1.5 2.2,.8 3.2,4.3 0,2.2 -3.2,4.3 -2.2,.8 -5,-1.5 -1.5,-1.5Z"
                transform={`translate(0,${Y + 22})`}
              />
              <text transform={`translate(4,${Y - 16}) rotate(-42)`} textAnchor="start">
                {station.name}
              </text>
            </g>
          )
        })}

        {hasBus && (
          <g className="busg" transform={`translate(${PAD + travelled},${Y})`}>
            <circle className="halo" r="10" fill="var(--red)" opacity="0.16" />
            <rect className="car" x="-14" y="-11" width="28" height="22" rx="5" />
            <rect className="stripe" x="-14" y="2" width="28" height="3" />
            <rect className="glass" x="-10" y="-7" width="20" height="6" rx="2" />
          </g>
        )}
      </svg>
    </div>
  )
}

export default RouteMap
