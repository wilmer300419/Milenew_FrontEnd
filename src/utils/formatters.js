const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })

export const formatPrice = (value) => cop.format(Number(value) || 0)

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(date),
  )

/** "Llegando", "45 s", "3 min" */
export function formatEta(seconds) {
  if (seconds == null) return '—'
  if (seconds <= 10) return 'Llegando'
  if (seconds < 60) return `${Math.round(seconds)} s`
  return `${Math.round(seconds / 60)} min`
}

/** Duración legible: "45 s", "12 min", "2 h 05 min" */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds ?? 0))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`
}

/** Reloj "1:05:09" para cronómetros */
export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds ?? 0))
  const pad = (n) => String(n).padStart(2, '0')
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

/** Código visible del servicio de un viaje: B75, C15, B13… */
export const serviceCode = (t) => t.serviceCode ?? (t.service === 'Expreso' ? 'B75' : 'C15')

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || ''
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
