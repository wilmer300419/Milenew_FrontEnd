import { useCallback, useState } from 'react'

export function useEventLog(limit = 40) {
  const [entries, setEntries] = useState([])

  const log = useCallback(
    (tag, message) => {
      setEntries((prev) => {
        const next = [...prev, { id: `${Date.now()}-${Math.random()}`, tag, message, time: new Date() }]
        return next.length > limit ? next.slice(next.length - limit) : next
      })
    },
    [limit],
  )

  return { entries, log }
}
