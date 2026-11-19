import { describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { usePolling } from '../hooks/usePolling.js'

function deferred() {
  let resolve
  const promise = new Promise((r) => (resolve = r))
  return { promise, resolve }
}

describe('usePolling', () => {
  it('descarta la respuesta vieja si cambian los parámetros mientras estaba en camino', async () => {
    const slow = deferred()
    const fast = deferred()
    const calls = { a: slow.promise, b: fast.promise }
    const { result, rerender } = renderHook(({ id }) => usePolling(() => calls[id], 0, [id]), {
      initialProps: { id: 'a' },
    })

    rerender({ id: 'b' }) // el usuario cambió de estación
    await act(async () => fast.resolve({ data: 'llegadas de B' }))
    await act(async () => slow.resolve({ data: 'llegadas de A (vieja)' }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('llegadas de B')
  })
})
