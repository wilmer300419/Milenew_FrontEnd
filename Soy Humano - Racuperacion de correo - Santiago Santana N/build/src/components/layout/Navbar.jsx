import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav>
      <Link to="/">Inicio</Link>
      <Link to="/products">Productos</Link>
      {user ? (
        <>
          <Link to="/perfil">Perfil</Link>
          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  )
}

export default Navbar
