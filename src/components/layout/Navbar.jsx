import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/troncal', label: 'Troncal Caracas' },
  { to: '/products', label: 'Productos' },
]

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="topbar-wrap">
      <div className="topbar shell">
        <div className="brand">
          <div className="mk">
            <i />
          </div>
          <div>
            <b>Milenew</b>
            <span>Troncal Caracas · demo</span>
          </div>
        </div>
        <nav className="navlinks">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => (isActive ? 'on' : '')}
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/perfil" className={({ isActive }) => (isActive ? 'on' : '')}>
                Mi perfil
              </NavLink>
              <button type="button" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'on' : '')}>
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
