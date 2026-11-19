import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { usePolling } from '../../hooks/usePolling.js'
import { getTransactions, getWallet, rechargeWallet } from '../../services/walletService.js'
import { formatDateTime, formatPrice } from '../../utils/formatters.js'
import { haptic } from '../../utils/human.js'
import Glass from '../../components/ui/Glass.jsx'
import Button from '../../components/ui/Button.jsx'
import Ticker from '../../components/ui/Ticker.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import Segmented from '../../components/ui/Segmented.jsx'
import Reveal, { revealItem } from '../../components/ui/Reveal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'

const AMOUNTS = [5000, 10000, 20000, 50000]
const FILTERS = [
  { value: 'all', label: 'Todo' },
  { value: 'recharge', label: 'Recargas' },
  { value: 'fare', label: 'Pasajes' },
]

function TuLlaveCard({ balance, name, userId }) {
  return (
    <motion.div
      className="tcard"
      initial={{ opacity: 0, rotateY: -25, y: 20 }}
      animate={{ opacity: 1, rotateY: 0, y: 0 }}
      whileHover={{ rotateX: 4, rotateY: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      style={{ transformPerspective: 900 }}
    >
      <span className="shine" />
      <div className="tcard-top">
        <b style={{ letterSpacing: '-0.02em', fontSize: 18 }}>TuLlave</b>
        <span className="tcard-chip" />
      </div>
      <div className="tcard-balance">
        <small>Saldo disponible</small>
        <b>
          <Ticker value={balance} format={(n) => formatPrice(n)} />
        </b>
      </div>
      <div className="tcard-foot">
        <span>{name}</span>
        <span>•••• {String(userId ?? 0).padStart(4, '0')}</span>
      </div>
    </motion.div>
  )
}

function Wallet() {
  const { user } = useAuth()
  const toast = useToast()
  const wallet = usePolling(getWallet, 0)
  const tx = usePolling(getTransactions, 0)
  const [amount, setAmount] = useState(10000)
  const [custom, setCustom] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirming, setConfirming] = useState(false)

  const value = custom ? Number(custom.replace(/\D/g, '')) : amount
  const valid = value >= 1000 && value <= 500000

  const balance = wallet.data?.balance ?? 0

  const recharge = async () => {
    try {
      const res = await rechargeWallet(value)
      haptic(18)
      toast.success(`Recargaste ${formatPrice(value)}. Nuevo saldo ${formatPrice(res.data.balance)}`)
      setCustom('')
      wallet.refresh()
      tx.refresh()
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  const items = (tx.data ?? []).filter((t) => filter === 'all' || t.type === filter)
  const totals = useMemo(() => {
    const all = tx.data ?? []
    return {
      recharged: all.filter((t) => t.type === 'recharge').reduce((s, t) => s + t.amount, 0),
      spent: all.filter((t) => t.type === 'fare').reduce((s, t) => s + t.amount, 0),
      trips: all.filter((t) => t.type === 'fare').length,
    }
  }, [tx.data])

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">Tarjeta TuLlave</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            Saldo y recargas
          </h1>
        </div>
      </Reveal.Item>

      <div className="grid grid-main">
        <div className="stack">
          <Glass variants={revealItem} strong>
            <div className="grid grid-2" style={{ alignItems: 'center' }}>
              <TuLlaveCard balance={wallet.data?.balance ?? 0} name={user?.name} userId={user?.id} />
              <div className="stack" style={{ gap: 16 }}>
                <div className="stat">
                  <small>Recargado</small>
                  <b>
                    <Ticker value={totals.recharged} format={(n) => formatPrice(n)} />
                  </b>
                </div>
                <div className="stat">
                  <small>Gastado en pasajes</small>
                  <b>
                    <Ticker value={totals.spent} format={(n) => formatPrice(n)} />
                  </b>
                </div>
                <div className="stat">
                  <small>Viajes pagados</small>
                  <b>
                    <Ticker value={totals.trips} />
                  </b>
                </div>
              </div>
            </div>
          </Glass>

          <Glass variants={revealItem}>
            <div className="card-head">
              <h3 className="title-md">
                <Plus size={18} /> Recargar
              </h3>
            </div>
            <div className="amounts">
              {AMOUNTS.map((a) => {
                const on = !custom && amount === a
                return (
                  <button key={a} type="button" className={`amount ${on ? 'on' : ''}`} onClick={() => { setAmount(a); setCustom('') }}>
                    {on && <motion.span layoutId="amount-lens" className="amount-lens" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                    <span>{formatPrice(a)}</span>
                  </button>
                )
              })}
            </div>
            <div className="field" style={{ margin: '12px 0 14px' }}>
              <input
                id="custom-amount"
                inputMode="numeric"
                placeholder=" "
                value={custom ? Number(custom).toLocaleString('es-CO') : ''}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <label htmlFor="custom-amount">Otro monto (entre $1.000 y $500.000)</label>
            </div>
            <Button size="lg" block onClick={() => setConfirming(true)} disabled={!valid}>
              Recargar {valid ? formatPrice(value) : ''}
            </Button>
          </Glass>
        </div>

        <Glass variants={revealItem}>
          <div className="card-head">
            <h3 className="title-md">Movimientos</h3>
            <Segmented size="sm" options={FILTERS} value={filter} onChange={setFilter} />
          </div>
          {tx.loading ? (
            <Skeleton h={160} />
          ) : items.length ? (
            <ul className="list">
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((t) => {
                  const inbound = t.type === 'recharge'
                  return (
                    <motion.li
                      key={t.id}
                      layout
                      className="list-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <span className={`list-ico ${inbound ? 'in' : 'out'}`}>
                        {inbound ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                      </span>
                      <span className="list-text">
                        <b>{t.description}</b>
                        <small>
                          {formatDateTime(t.createdAt)} · saldo {formatPrice(t.balanceAfter)}
                        </small>
                      </span>
                      <span className={`list-amount ${inbound ? 'in' : ''}`}>
                        {inbound ? '+' : '−'}
                        {formatPrice(t.amount)}
                      </span>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="empty">Sin movimientos todavía.</p>
          )}
        </Glass>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Confirmar recarga"
        subtitle="El saldo queda disponible de inmediato."
        rows={[
          { label: 'Monto', value: formatPrice(value) },
          { label: 'Medio de pago', value: 'PSE · simulado' },
          { label: 'Saldo actual', value: formatPrice(balance) },
          { label: 'Saldo después', value: formatPrice(balance + value), strong: true },
        ]}
        confirmLabel={`Recargar ${formatPrice(value)}`}
        onConfirm={recharge}
      />
    </Reveal>
  )
}

export default Wallet
