/** Minúsculas y sin tildes: "Avenida Jiménez" → "avenida jimenez". */
export function normalize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Hora corta: "7:42 a. m." */
export function formatTime(date) {
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(new Date(date))
}

/** "hace 5 min", "hace 2 h", "ayer"… */
export function timeAgo(date, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000))
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  const d = Math.floor(s / 86400)
  return d === 1 ? 'ayer' : `hace ${d} días`
}
