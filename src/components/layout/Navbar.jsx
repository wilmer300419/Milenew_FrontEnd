import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav>
      <Link to="/">Inicio</Link>
      <Link to="/products">Productos</Link>
      <Link to="/login">Login</Link>
    </nav>
  )
}

export default Navbar
