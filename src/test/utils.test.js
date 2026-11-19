import { describe, expect, it } from 'vitest'
import { normalize } from '../utils/text.js'
import { formatEta } from '../utils/formatters.js'
import { humanEta, occupancyMood } from '../utils/human.js'
import { tripProgress } from '../components/transit-ui/ActiveTripCard.jsx'

describe('utilidades', () => {
  it('normaliza sin tildes ni mayúsculas', () => {
    expect(normalize('  Avenida JIMÉNEZ ')).toBe('avenida jimenez')
  })

  it('formatea tiempos de llegada', () => {
    expect(formatEta(5)).toBe('Llegando')
    expect(formatEta(45)).toBe('45 s')
    expect(formatEta(185)).toBe('3 min')
    expect(formatEta(null)).toBe('—')
  })

  it('traduce la espera a lenguaje humano', () => {
    expect(humanEta(10).hint).toBe('¡Ya llega!')
    expect(humanEta(60).tone).toBe('soon')
    expect(humanEta(600).hint).toBe('Alcanzas un tinto')
    expect(occupancyMood(90)).toMatch(/lleno/)
  })

  it('calcula el avance del viaje', () => {
    const start = new Date('2026-01-01T10:00:00Z')
    const trip = { startedAt: start.toISOString(), arrivesAt: new Date(start.getTime() + 10 * 60000).toISOString() }
    expect(tripProgress(trip, start.getTime() + 5 * 60000)).toEqual({ pct: 0.5, left: 5, arrived: false })
    expect(tripProgress(trip, start.getTime() + 11 * 60000).arrived).toBe(true)
  })
})
