import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, verifyLoginCode } from '../services/authService'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'
import Card from '../components/common/Card.jsx'
import Input from '../components/common/Input.jsx'
import Recaptcha from '../components/common/Recaptcha.jsx'

function Login() {
  const [step, setStep] = useState('credentials') // 'credentials' | '2fa'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const recaptchaRef = useRef(null)
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
    setError(null)
  }

  const handleCaptchaExpire = () => setCaptchaToken(null)

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
      const res = await login({ email, password, captchaToken })

      if (res?.data?.requiresTwoFactor) {
        // El BackEnd ya envió el código por correo; pasamos al segundo paso.
        setStep('2fa')
      } else {
        loginUser(res?.data?.user, res?.data?.token, rememberMe)
        navigate('/')
      }
    } catch (err) {
      setError(
        !err.status
          ? 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'
          : err.message || 'No se pudo verificar que eres humano. Inténtalo de nuevo.',
      )
      // El token de reCAPTCHA es de un solo uso: si algo falló, reiniciamos
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
      const res = await verifyLoginCode({ email, code })
      loginUser(res?.data?.user, res?.data?.token, rememberMe)
      navigate('/')
    } catch (err) {
      setError(
        !err.status
          ? 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'
          : err.message || 'El código no es válido o expiró. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (step === '2fa') {
    return (
      <div className="page" style={{ alignItems: 'center' }}>
        <Card style={{ width: '100%', maxWidth: 380 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            <span className="sq" />
            Verificación en dos pasos
          </div>
          <h1 className="htitle" style={{ fontSize: 'clamp(20px,4vw,24px)', marginBottom: 10 }}>
            Revisa tu correo
          </h1>
          <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 18 }}>
            Enviamos un código a <b style={{ color: 'var(--ink)' }}>{email}</b>. Ingrésalo para
            completar el inicio de sesión.
          </p>

          {error && (
            <div className="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form className="form" style={{ maxWidth: 'none' }} onSubmit={handleCodeSubmit}>
            <Input
              id="code"
              label="Código de verificación"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Button type="submit" variant="fill" disabled={submitting || !code}>
              {submitting ? 'Verificando…' : 'Confirmar código'}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="page" style={{ alignItems: 'center' }}>
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          <span className="sq" />
          Acceso
        </div>
        <h1 className="htitle" style={{ fontSize: 'clamp(22px,4vw,28px)', marginBottom: 18 }}>
          Iniciar sesión
        </h1>

        {error && (
          <div className="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form className="form" style={{ maxWidth: 'none' }} onSubmit={handleCredentialsSubmit}>
          <Input
            id="email"
            label="Correo"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--dim)' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Recordar mis datos
          </label>

          <Recaptcha ref={recaptchaRef} onVerify={handleCaptchaVerify} onExpire={handleCaptchaExpire} />

          <Button type="submit" variant="fill" disabled={submitting || !captchaToken}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>

          <Link to="/recuperar-cuenta" style={{ fontSize: 12.5, color: 'var(--dim)', textAlign: 'center' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </form>
      </Card>
    </div>
  )
}

export default Login
