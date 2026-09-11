import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import Products from '../pages/Products.jsx'
import NotFound from '../pages/NotFound.jsx'
import RecoverAccount from '../pages/RecoverAccount.jsx'
import Profile from '../pages/Profile.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

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
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
