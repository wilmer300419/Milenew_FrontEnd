const CIRC = 264

function arcOffset(pct) {
  return CIRC - (CIRC * Math.min(100, Math.max(0, pct))) / 100
}

function Gauge({ label, value, unit, color }) {
  const known = value != null
  const pct = known ? Math.min(100, (value / 60) * 100) : 0
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 100">
        <circle className="bgc" cx="50" cy="50" r="42" />
        <circle
          className="fgc"
          cx="50"
          cy="50"
          r="42"
          stroke={color}
          strokeDasharray={CIRC}
          strokeDashoffset={arcOffset(pct)}
        />
      </svg>
      <div className="ctr">
        <b>{known ? value : '—'}</b>
        <span>{unit ?? label}</span>
      </div>
    </div>
  )
}

function Gauges({ telemetry }) {
  return (
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
      <Gauge label="velocidad" value={telemetry?.speed} unit="km/h" color="var(--amber)" />
      <Gauge label="aforo" value={telemetry?.occupancyPct} unit="aforo" color="var(--red)" />
    </div>
  )
}

export default Gauges
