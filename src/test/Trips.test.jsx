import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Trips from '../pages/passenger/Trips.jsx'
import { startTrip } from '../services/tripService.js'
import { renderApp, STATIONS } from './render.jsx'

vi.mock('../services/transitService.js', () => ({
  getStations: vi.fn(() => Promise.resolve({ data: STATIONS })),
  getRouteVehicles: vi.fn(() => Promise.resolve({ data: { vehicles: [] } })),
  getStationArrivals: vi.fn(() => Promise.resolve({ data: { arrivals: [] } })),
  planTrip: vi.fn(() =>
    Promise.resolve({
      data: {
        sameStation: false, stops: 2, direction: 'sur', fare: 3200, bestService: 'Expreso', bestMinutes: 7,
        savedMinutes: 2, expressAvailable: true,
        legs: [{ station: STATIONS[0], skipped: false }, { station: STATIONS[1], skipped: true }, { station: STATIONS[2], skipped: false }],
      },
    }),
  ),
}))
vi.mock('../services/tripService.js', () => ({
  getTrips: vi.fn(() => Promise.resolve({ data: [] })),
  getActiveTrip: vi.fn(() => Promise.resolve({ data: null })),
  finishTrip: vi.fn(),
  startTrip: vi.fn(() =>
    Promise.resolve({
      data: { id: 9, fromName: 'Calle 76', toName: 'Calle 26', fromStationId: 1, toStationId: 3, service: 'Expreso',
        fare: 3200, balance: 6800, estimatedMinutes: 7, startedAt: new Date().toISOString(),
        arrivesAt: new Date(Date.now() + 7 * 60000).toISOString() },
    }),
  ),
}))
vi.mock('../services/walletService.js', () => ({ getWallet: vi.fn(() => Promise.resolve({ data: { balance: 10000 } })) }))
vi.mock('../services/userService.js', () => ({
  getFavorites: vi.fn(() => Promise.resolve({ data: [] })),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getProfile: vi.fn(() => Promise.reject({ status: 401 })),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
}))

async function pick(label, text) {
  await userEvent.type(screen.getByRole('combobox', { name: label }), text)
  await userEvent.keyboard('{Enter}')
}

describe('Pagar un viaje', () => {
  it('calcula la ruta, muestra el resumen y cobra solo al confirmar', async () => {
    renderApp(<Trips />)
    await pick('Origen', 'calle 76')
    await pick('Destino', 'calle 26')

    await userEvent.click(await screen.findByRole('button', { name: /Pagar/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Confirmar pago' })
    expect(within(dialog).getByText('Calle 76 → Calle 26')).toBeInTheDocument()
    expect(within(dialog).getByText('Saldo después').nextSibling).toHaveTextContent(/6\.800/)
    expect(startTrip).not.toHaveBeenCalled()

    await userEvent.click(within(dialog).getByRole('button', { name: /Pagar/ }))
    expect(startTrip).toHaveBeenCalledWith(1, 3)
    expect(await screen.findByText('Viaje en curso')).toBeInTheDocument()
  })
})
