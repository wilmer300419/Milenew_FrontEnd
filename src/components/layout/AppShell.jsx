import { Suspense } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bus, CreditCard, Gauge, Home, LayoutDashboard, LogOut, Map, MessageSquare, Route, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { TripProvider } from '../../context/TripContext.jsx'
import { NotificationsProvider } from '../../context/NotificationsContext.jsx'
import { firstName } from '../../utils/formatters.js'
import Brand from './Brand.jsx'
import Splash from './Splash.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import NotificationsMenu from './NotificationsMenu.jsx'
import ActiveTripBar from './ActiveTripBar.jsx'

const PASSENGER_TABS = [
  { to: '/app', label: 'Inicio', icon: Home, end: true },
  { to: '/app/en-vivo', label: 'En vivo', icon: Map },
  { to: '/app/viajes', label: 'Viajes', icon: Route },
  { to: '/app/tullave', label: 'TuLlave', icon: CreditCard },
  { to: '/app/perfil', label: 'Perfil', icon: UserRound },
]

const CENTRAL_TABS = [
  { to: '/central', label: 'Central', icon: LayoutDashboard, end: true },
  { to: '/central/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/central/flota', label: 'Flota', icon: Bus },
  { to: '/app/en-vivo', label: 'En vivo', icon: Map },
  { to: '/app/perfil', label: 'Perfil', icon: UserRound },
]

const OPERATOR_TABS = [
  { to: '/operador', label: 'Operación', icon: Gauge, end: true },
  { to: '/app/en-vivo', label: 'En vivo', icon: Map },
  { to: '/app/perfil', label: 'Perfil', icon: UserRound },
]

function TabLinks({ tabs, layoutId }) {
  return tabs.map(({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}>
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span layoutId={layoutId} className="tab-lens" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          )}
          <span className="tab-inner">
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{label}</span>
          </span>
        </>
      )}
    </NavLink>
  ))
}

/** Estructura de la app con sesión: barra superior (escritorio) e inferior (celular). */
function AppShell() {
  const { user, logout, isOperator, isAdmin, roleLabel } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const tabs = isAdmin ? CENTRAL_TABS : isOperator ? OPERATOR_TABS : PASSENGER_TABS
  const home = isAdmin ? '/central' : isOperator ? '/operador' : '/app'

  const handleLogout = async () => {
    await logout()
    toast.info('Cerraste sesión. ¡Hasta pronto!')
    navigate('/login')
  }

  return (
    <NotificationsProvider>
      <TripProvider>
        <div className="shell">
          <a href="#main" className="skip-link">
            Saltar al contenido
          </a>
          <header className="topbar" data-no-sand="">
            <div className="topbar-inner glass strong">
              <Brand to={home} />
              <nav className="tabs desktop-only" aria-label="Principal">
                <TabLinks tabs={tabs} layoutId="tab-lens-top" />
              </nav>
              <div className="topbar-user">
                <NotificationsMenu />
                <ThemeToggle />
                <span className="avatar" aria-hidden="true">
                  {firstName(user?.name).slice(0, 1).toUpperCase()}
                </span>
                <span className="topbar-name desktop-only">
                  <b>{firstName(user?.name)}</b>
                  <small>{roleLabel}</small>
                </span>
                <button type="button" className="btn glass-btn icon sm" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
            <ActiveTripBar />
          </header>

          <main className="page" id="main" tabIndex={-1}>
            {/* Solo animación de entrada: una salida bloqueante + carga diferida dejaba la página invisible */}
            <Suspense fallback={<Splash />}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </main>

          <nav className="tabbar mobile-only glass strong" aria-label="Principal" data-no-sand="">
            <TabLinks tabs={tabs} layoutId="tab-lens-bottom" />
          </nav>
        </div>
      </TripProvider>
    </NotificationsProvider>
  )
}

export default AppShell
