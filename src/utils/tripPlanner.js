const DEFAULT_MIN_PER_STOP = 2.1

// Cálculo determinístico (no depende del backend): dado el mismo origen/destino
// y la misma lista de estaciones, siempre da el mismo resultado.
export function computeTripPlan({ stations, fromIndex, toIndex, fare, minPerStop = DEFAULT_MIN_PER_STOP }) {
  if (fromIndex === toIndex) {
    return { sameStation: true }
  }

  const lo = Math.min(fromIndex, toIndex)
  const hi = Math.max(fromIndex, toIndex)
  const stops = hi - lo
  const direction = toIndex > fromIndex ? 'sur' : 'norte'

  const corridorMinutes = Math.round(stops * minPerStop + 3)

  const expressStops = []
  for (let i = lo; i <= hi; i++) {
    if (stations[i]?.isExpressStop) expressStops.push(i)
  }
  const expressAvailable =
    Boolean(stations[fromIndex]?.isExpressStop) &&
    Boolean(stations[toIndex]?.isExpressStop) &&
    expressStops.length >= 2
  const expressMinutes = expressAvailable
    ? Math.round((expressStops.length - 1) * minPerStop + stops * 0.35 + 3)
    : null

  const useExpress = expressAvailable && expressMinutes < corridorMinutes
  const bestMinutes = useExpress ? expressMinutes : corridorMinutes
  const savedMinutes = expressAvailable ? corridorMinutes - expressMinutes : 0

  const legs = []
  for (let i = lo; i <= hi; i++) {
    legs.push({
      station: stations[i],
      skipped: useExpress && !stations[i]?.isExpressStop && i !== lo && i !== hi,
    })
  }

  return {
    sameStation: false,
    stops,
    direction,
    fare,
    bestService: useExpress ? 'Expreso' : 'Corriente',
    bestMinutes,
    savedMinutes,
    expressAvailable,
    legs,
  }
}
