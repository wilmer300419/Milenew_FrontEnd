import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'

function Home() {
  return (
    <div className="page">
      <div className="eyebrow">
        <span className="sq" />
        Milenew · proyecto académico
      </div>
      <h1 className="htitle" style={{ margin: '14px 0 6px' }}>
        Emulando el <em>sistema TransMilenio</em> en la web.
      </h1>
      <p style={{ color: 'var(--dim)', maxWidth: 560, fontSize: '14px' }}>
        Consulta estaciones, planea tu viaje y sigue el servicio en vivo de la Troncal Caracas,
        o gestiona la operación desde el panel de conductor.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/troncal">
          <Button variant="fill">Abrir Troncal Caracas</Button>
        </Link>
        <Link to="/products">
          <Button variant="out">Ver productos</Button>
        </Link>
      </div>
    </div>
  )
}

export default Home
