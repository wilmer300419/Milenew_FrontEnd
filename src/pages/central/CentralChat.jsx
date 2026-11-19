import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MessageSquare, Send } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { getConversation, getConversations, replyToDriver } from '../../services/adminService.js'
import { timeAgo } from '../../utils/text.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'

const QUICK = ['Recibido', 'Apoyo en camino', 'Avisaremos a las estaciones', 'Retoma la ruta normal']

function Thread({ driver, onSent }) {
  const toast = useToast()
  const thread = usePolling(() => getConversation(driver.driverId), 4000, [driver.driverId])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  const messages = thread.data ?? []

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  const send = async (message) => {
    if (!message.trim()) return
    setSending(true)
    try {
      await replyToDriver(driver.driverId, message.trim())
      setText('')
      await thread.refresh()
      onSent()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="chat chat-tall" aria-live="polite">
        {thread.loading && !thread.data && <Skeleton h={120} />}
        {!thread.loading && !messages.length && <p className="empty">Sin mensajes con {driver.driverName} todavía.</p>}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={`bubble ${m.from === 'central' ? 'driver' : 'central'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              title={new Date(m.createdAt).toLocaleString('es-CO')}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        <span ref={endRef} />
      </div>
      <div className="chips">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => send(q)} disabled={sending}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Responder a ${driver.driverName}…`} maxLength={500} aria-label="Mensaje" />
        <Button type="submit" icon disabled={sending || !text.trim()} aria-label="Enviar">
          <Send size={16} />
        </Button>
      </form>
    </>
  )
}

function CentralChat() {
  const convs = usePolling(getConversations, 5000)
  const [selectedId, setSelectedId] = useState(null)
  const list = convs.data ?? []
  const selected = list.find((c) => c.driverId === selectedId)

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">Central de operaciones</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            Mensajes con operadores
          </h1>
          <p>Las respuestas llegan al panel del operador en segundos.</p>
        </div>
      </Reveal.Item>

      <div className={`chat-layout ${selected ? 'has-thread' : ''}`}>
        <Glass variants={revealItem} className="chat-list-card">
          <div className="card-head">
            <h3 className="title-md">
              <MessageSquare size={18} /> Operadores
            </h3>
          </div>
          {convs.loading && !convs.data ? (
            <Skeleton h={160} />
          ) : list.length ? (
            <ul className="conv-list">
              {list.map((c) => (
                <li key={c.driverId}>
                  <button type="button" className={`conv ${c.driverId === selectedId ? 'on' : ''}`} onClick={() => setSelectedId(c.driverId)}>
                    <span className="avatar sm" aria-hidden="true">
                      {c.driverName.slice(0, 1)}
                    </span>
                    <span className="conv-text">
                      <b>{c.driverName}</b>
                      <small>
                        {c.vehicleLabel ?? 'Sin bus asignado'}
                        {c.lastText ? ` · ${c.lastSender === 'central' ? 'Tú: ' : ''}${c.lastText}` : ''}
                      </small>
                    </span>
                    <span className="conv-meta">
                      {c.lastAt && <time>{timeAgo(c.lastAt)}</time>}
                      {c.unread > 0 && <span className="notif-badge static">{c.unread}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Aún no hay operadores registrados.</p>
          )}
        </Glass>

        <Glass variants={revealItem} className="chat-thread-card">
          {selected ? (
            <>
              <div className="card-head">
                <h3 className="title-md">
                  <button type="button" className="btn ghost icon sm mobile-only" onClick={() => setSelectedId(null)} aria-label="Volver a la lista">
                    <ArrowLeft size={16} />
                  </button>
                  {selected.driverName}
                </h3>
                <span className="chip">{selected.vehicleLabel ?? 'Sin bus'}</span>
              </div>
              <Thread driver={selected} onSent={convs.refresh} />
            </>
          ) : (
            <p className="empty">Elige un operador para ver la conversación.</p>
          )}
        </Glass>
      </div>
    </Reveal>
  )
}

export default CentralChat
