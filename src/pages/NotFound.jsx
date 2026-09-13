import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'

function NotFound() {
  return (
    <div className="page" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="eyebrow">
        <span className="sq" />
        Error 404
      </div>
      <h1 className="htitle">Página no encontrada.</h1>
      <Link to="/">
        <Button variant="out">Volver al inicio</Button>
      </Link>
    </div>
  )
}

export default NotFound
