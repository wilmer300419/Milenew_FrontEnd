function OccupancyCars({ cars }) {
  if (!cars || !cars.length) {
    return <p className="empty">Esperando datos en vivo del vehículo…</p>
  }

  return (
    <div className="cars">
      {cars.map((car) => {
        const color = car.pct > 80 ? 'var(--red)' : car.pct > 50 ? 'var(--amber)' : 'var(--green)'
        const label = car.pct > 80 ? 'lleno' : car.pct > 50 ? 'medio' : 'libre'
        return (
          <div className="carrow" key={car.n}>
            <div className="lbl">VAGÓN {car.n}</div>
            <div className="track">
              <i style={{ width: `${car.pct}%`, background: color }} />
            </div>
            <div className="pct">
              {car.pct}% {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OccupancyCars
