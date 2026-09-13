import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import RecoverAccount from '../pages/RecoverAccount.jsx'
import Profile from '../pages/Profile.jsx'
import Products from '../pages/Products.jsx'
import NotFound from '../pages/NotFound.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

// El panel de la Troncal carga canvas + SVG pesados: se separa del bundle
// principal para no penalizar a Home/Login/Products (MIL-44 · optimización).
const Troncal = lazy(() => import('../pages/Troncal.jsx'))

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-cuenta" element={<RecoverAccount />} />
      <Route path="/products" element={<Products />} />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/troncal"
        element={
          <Suspense fallback={<p className="empty">Cargando panel…</p>}>
            <Troncal />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
