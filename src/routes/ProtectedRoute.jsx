import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, homeFor } from '../context/AuthContext.jsx'
import Splash from '../components/layout/Splash.jsx'

/** Exige sesión. Con `roles`, además exige uno de esos roles. */
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />
  return children
}

/** Para login/registro: si ya hay sesión, manda al inicio de su rol. */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (user) return <Navigate to={homeFor(user)} replace />
  return children
}

export default ProtectedRoute
