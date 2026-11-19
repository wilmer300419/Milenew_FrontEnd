/*
 * Lenguaje humano: traducir datos (segundos, porcentajes, horas) a frases
 * que una persona diría en el paradero.
 */

/** Qué hacer según cuánto falta para que llegue el bus. */
export function humanEta(seconds) {
  if (seconds == null) return { hint: '', tone: 'calm' }
  if (seconds <= 20) return { hint: '¡Ya llega!', tone: 'now' }
  if (seconds <= 90) return { hint: 'Alístate', tone: 'soon' }
  if (seconds <= 300) return { hint: 'Con calma', tone: 'calm' }
  return { hint: 'Alcanzas un tinto', tone: 'relax' }
}

/** Cómo va el bus por dentro. */
export function occupancyMood(pct) {
  if (pct == null) return ''
  if (pct > 85) return 'Va lleno: si puedes, espera el siguiente'
  if (pct > 60) return 'Va concurrido'
  if (pct > 30) return 'Va cómodo'
  return 'Va casi vacío'
}

/** Momento del día: lo usan el saludo y la luz del fondo. */
export function dayPart(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'evening'
  return 'night'
}

const SUBLINES = {
  morning: 'Arranquemos el día. Bogotá ya se está moviendo.',
  day: 'Que la ciudad te rinda. Aquí tienes todo a mano.',
  evening: 'Hora de volver. Te contamos cuándo pasa tu bus.',
  night: 'Viaja tranquilo. Te acompañamos hasta tu parada.',
}

export const daySubline = (date) => SUBLINES[dayPart(date)]

/** Pequeña vibración de confirmación en el celular (si el equipo lo permite). */
export function haptic(pattern = 12) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // sin vibración disponible
  }
}
