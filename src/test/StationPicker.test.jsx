import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StationPicker from '../components/transit-ui/StationPicker.jsx'
import { STATIONS } from './render.jsx'

function setup(props = {}) {
  const onChange = vi.fn()
  render(<StationPicker label="Origen" stations={STATIONS} value="" onChange={onChange} favorites={new Set()} {...props} />)
  return { onChange, input: screen.getByRole('combobox', { name: 'Origen' }) }
}

describe('StationPicker', () => {
  it('filtra sin importar tildes y elige con el teclado', async () => {
    const { onChange, input } = setup()
    await userEvent.type(input, 'jimenez')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveTextContent('Avenida Jiménez')
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('4')
  })

  it('muestra favoritas y recientes primero', async () => {
    const { input } = setup({ favorites: new Set([3]), recents: [2] })
    await userEvent.click(input)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Calle 26')
    expect(options[1]).toHaveTextContent('Flores')
    expect(screen.getByText('Favoritas')).toBeInTheDocument()
    expect(screen.getByText('Recientes')).toBeInTheDocument()
  })

  it('avisa cuando no hay resultados y Escape cierra la lista', async () => {
    const { input } = setup()
    await userEvent.type(input, 'zzz')
    expect(screen.getByText(/Ninguna estación/)).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })
})
