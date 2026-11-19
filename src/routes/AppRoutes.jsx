import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute, { GuestRoute } from './ProtectedRoute.jsx'
import AppShell from '../components/layout/AppShell.jsx'
import Splash from '../components/layout/Splash.jsx'
import Landing from '../pages/Landing.jsx'
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'
import RecoverAccount from '../pages/auth/RecoverAccount.jsx'
import NotFound from '../pages/NotFound.jsx'

// Páginas con sesión: se cargan bajo demanda para que el login sea liviano
const PassengerHome = lazy(() => import('../pages/passenger/PassengerHome.jsx'))
const Live = lazy(() => import('../pages/passenger/Live.jsx'))
const Trips = lazy(() => import('../pages/passenger/Trips.jsx'))
const Wallet = lazy(() => import('../pages/passenger/Wallet.jsx'))
const Profile = lazy(() => import('../pages/Profile.jsx'))
const Operator = lazy(() => import('../pages/operator/Operator.jsx'))

const PASSENGER = ['user', 'admin']
const OPERATOR = ['driver', 'admin']

function AppRoutes() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
          <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/registro" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/recuperar-cuenta" element={<RecoverAccount />} />

          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/app" element={<ProtectedRoute roles={PASSENGER}><PassengerHome /></ProtectedRoute>} />
            <Route path="/app/en-vivo" element={<Live />} />
            <Route path="/app/viajes" element={<ProtectedRoute roles={PASSENGER}><Trips /></ProtectedRoute>} />
            <Route path="/app/tullave" element={<ProtectedRoute roles={PASSENGER}><Wallet /></ProtectedRoute>} />
            <Route path="/app/perfil" element={<Profile />} />
            <Route path="/operador" element={<ProtectedRoute roles={OPERATOR}><Operator /></ProtectedRoute>} />
          </Route>

          <Route path="/troncal" element={<Navigate to="/app/en-vivo" replace />} />
          <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
