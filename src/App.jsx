import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import AppRoutes from './routes/AppRoutes.jsx'
import GlassBackground from './components/background/GlassBackground.jsx'
import ConnectionBanner from './components/layout/ConnectionBanner.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <PreferencesProvider>
            <ToastProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <GlassBackground />
                <ConnectionBanner />
                <AppRoutes />
              </BrowserRouter>
            </ToastProvider>
          </PreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  )
}

export default App
