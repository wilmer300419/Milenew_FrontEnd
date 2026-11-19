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
