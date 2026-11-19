const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })

export const formatPrice = (value) => cop.format(Number(value) || 0)

export const formatDate = (date) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))

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

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || ''
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
