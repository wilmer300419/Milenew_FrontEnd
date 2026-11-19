import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Wallet from '../pages/passenger/Wallet.jsx'
import { rechargeWallet } from '../services/walletService.js'
import { renderApp } from './render.jsx'

vi.mock('../services/walletService.js', () => ({
  getWallet: vi.fn(() => Promise.resolve({ data: { balance: 5000, currency: 'COP' } })),
  getTransactions: vi.fn(() => Promise.resolve({ data: [] })),
  rechargeWallet: vi.fn(() => Promise.resolve({ data: { balance: 15000 } })),
}))

const money = (n) => new RegExp(`^\\$\\s?${n.toLocaleString('es-CO').replace('.', '\\.')}$`)

describe('Recarga TuLlave', () => {
  it('pide confirmación con el resumen antes de cobrar', async () => {
    renderApp(<Wallet />)
    await userEvent.click(await screen.findByRole('button', { name: money(10000) }))
    await userEvent.click(screen.getByRole('button', { name: /^Recargar/ }))

    const dialog = await screen.findByRole('dialog', { name: 'Confirmar recarga' })
    expect(rechargeWallet).not.toHaveBeenCalled()
    expect(within(dialog).getByText('Saldo después').nextSibling).toHaveTextContent(money(15000))

    await userEvent.click(within(dialog).getByRole('button', { name: /^Recargar/ }))
    expect(rechargeWallet).toHaveBeenCalledWith(10000)
  })

  it('cancelar no cobra', async () => {
    renderApp(<Wallet />)
    await userEvent.click(await screen.findByRole('button', { name: /^Recargar/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Confirmar recarga' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(rechargeWallet).not.toHaveBeenCalled()
  })
})
