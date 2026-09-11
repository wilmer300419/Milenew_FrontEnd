import { useRef, useState } from 'react'
import { login } from '../services/authService'
import Button from '../components/common/Button.jsx'
import Recaptcha from '../components/common/Recaptcha.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const recaptchaRef = useRef(null)

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
    setError(null)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!captchaToken) {
      setError('Debes completar la verificación "No soy un robot" antes de continuar.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // El token de reCAPTCHA viaja junto con las credenciales; el BackEnd
      // debe validarlo contra Google ANTES de comprobar email/contraseña.
      await login({ email, password, captchaToken })
    } catch (err) {
      if (!err.status) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.')
      } else if (err.status === 401 || err.status === 403) {
        setError(err.message || 'No se pudo verificar que eres humano. Inténtalo de nuevo.')
      } else {
        setError(err.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.')
      }

      // El token de reCAPTCHA es de un solo uso: si algo falló, se reinicia
      // el widget para forzar una nueva verificación.
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1>Iniciar sesión</h1>
      {error && <p className="error">{error}</p>}
      <div className="form">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Recaptcha
          ref={recaptchaRef}
          onVerify={handleCaptchaVerify}
          onExpire={handleCaptchaExpire}
        />
        <Button onClick={handleSubmit} disabled={submitting || !captchaToken}>
          {submitting ? 'Verificando...' : 'Entrar'}
        </Button>
      </div>
    </div>
  )
}

export default Login
