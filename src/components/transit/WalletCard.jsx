import { useState } from 'react'
import { rechargeWallet } from '../../services/transitService.js'
import { formatPrice } from '../../utils/formatters.js'
import Button from '../common/Button.jsx'
import Card from '../common/Card.jsx'

function WalletCard({ walletQuery, onRecharge }) {
  const { data, loading, error, refetch } = walletQuery
  const [recharging, setRecharging] = useState(false)
  const balance = data?.data?.balance

  const handleRecharge = async () => {
    setRecharging(true)
    try {
      await rechargeWallet(10000)
      refetch()
      onRecharge?.()
    } catch {
      // el estado de error ya se refleja al recargar la consulta
    } finally {
      setRecharging(false)
    }
  }

  return (
    <Card className="wallet" style={{ borderLeft: '2px solid var(--red)' }}>
      <div className="eyebrow">Tarjeta TuLlave</div>
      <div style={{ fontSize: 28, fontWeight: 600, margin: '6px 0 16px' }}>
        {loading ? '—' : error ? 'Sin datos' : formatPrice(balance ?? 0)}
      </div>
      <Button variant="fill" style={{ width: '100%' }} onClick={handleRecharge} disabled={recharging}>
        {recharging ? 'Recargando…' : '+ Recargar $10.000'}
      </Button>
    </Card>
  )
}

export default WalletCard
