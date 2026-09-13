import { useState } from 'react'
import { useFetch } from '../../../hooks/useFetch.js'
import { getChatMessages, postChatMessage } from '../../../services/transitService.js'

const QUICK_REPLIES = ['Todo en orden', 'Retraso leve', 'Solicito apoyo']

function OperationsChat() {
  const { data, error, refetch } = useFetch(getChatMessages, [])
  const [sending, setSending] = useState(false)
  const messages = data?.data ?? []

  const send = async (message) => {
    setSending(true)
    try {
      await postChatMessage(message)
      refetch()
    } catch {
      // el mensaje se puede reintentar desde los mismos chips
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="chat">
        {error && <p className="empty">Central sin conexión.</p>}
        {!error && messages.length === 0 && <p className="empty">Sin mensajes todavía.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`bub ${m.from === 'central' ? 'in' : ''}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="chips">
        {QUICK_REPLIES.map((label) => (
          <button key={label} type="button" onClick={() => send(label)} disabled={sending}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default OperationsChat
