import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, verifyLoginCode } from '../services/authService'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'
import Recaptcha from '../components/common/Recaptcha.jsx'

function Login() {
  const [step, setStep] = useState('credentials') // 'credentials' | '2fa'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const recaptchaRef = useRef(null)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
    setError(null)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken(null)
  }

  const handleCredentialsSubmit = async (e) => {
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
      const response = await login({ email, password, captchaToken })

      if (response?.requires2FA) {
        // El BackEnd ya envió el código por correo; pasamos al segundo paso.
        setStep('2fa')
      } else if (response?.data?.user) {
        setUser(response.data.user)
        navigate('/')
      }
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

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await verifyLoginCode({ email, code })
      setUser(response?.data?.user ?? null)
      navigate('/')
    } catch (err) {
      if (!err.status) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.')
      } else {
        setError(err.message || 'El código no es válido o expiró. Inténtalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (step === '2fa') {
    return (
      <div className="page">
        <h1>Verificación en dos pasos</h1>
        <p>Enviamos un código a {email}. Ingrésalo para completar el inicio de sesión.</p>
        {error && <p className="error">{error}</p>}
        <div className="form">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Código de verificación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button onClick={handleCodeSubmit} disabled={submitting || !code}>
            {submitting ? 'Verificando...' : 'Confirmar código'}
          </Button>
        </div>
      </div>
    )
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
        <Button onClick={handleCredentialsSubmit} disabled={submitting || !captchaToken}>
          {submitting ? 'Verificando...' : 'Entrar'}
        </Button>
        <Link to="/recuperar-cuenta">¿Olvidaste tu contraseña?</Link>
      </div>
    </div>
  )
}

export default Login
