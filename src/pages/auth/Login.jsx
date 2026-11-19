import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyRound, Lock, Mail } from 'lucide-react'
import { login, verifyLoginCode } from '../../services/authService'
import { homeFor, useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Recaptcha from '../../components/auth/Recaptcha.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'

const NETWORK_ERROR = 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'

function Side() {
  return (
    <div>
      <h2 className="title-xl">
        Tu viaje,
        <br />
        <em>en tiempo real.</em>
      </h2>
      <p style={{ marginTop: 18 }}>Sigue los buses de la Troncal Caracas, planea tu ruta y paga con tu tarjeta TuLlave.</p>
    </div>
  )
}

function Login() {
  const [step, setStep] = useState('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const recaptchaRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { loginUser } = useAuth()
  const toast = useToast()
  const { theme } = useTheme()

  const finish = (data) => {
    loginUser(data.user)
    toast.success(`Hola, ${data.user.name.split(' ')[0]}`)
    navigate(location.state?.from?.pathname || homeFor(data.user), { replace: true })
  }

  const handleCredentials = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!email.trim()) errs.email = 'Escribe tu correo'
    if (!password) errs.password = 'Escribe tu contraseña'
    setFieldErrors(errs)
    if (Object.keys(errs).length) return
    if (!captchaToken) {
      setError('Completa la verificación "No soy un robot" para continuar.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      // El token de reCAPTCHA viaja con las credenciales; el BackEnd lo valida con Google.
      const res = await login({ email: email.trim(), password, captchaToken, rememberMe })
      if (res?.data?.requiresTwoFactor) {
        setStep('2fa')
        toast.info(res.message)
      } else {
        finish(res.data)
      }
    } catch (err) {
      setError(err.status ? err.message : NETWORK_ERROR)
      setFieldErrors(err.errors ?? {})
      // El token de reCAPTCHA es de un solo uso
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCode = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await verifyLoginCode({ email: email.trim(), code: code.trim(), rememberMe })
      finish(res.data)
    } catch (err) {
      setError(err.status ? err.message : NETWORK_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={step === '2fa' ? 'Verificación en dos pasos' : 'Acceso'}
      title={step === '2fa' ? 'Revisa tu correo' : 'Iniciar sesión'}
      lead={step === '2fa' ? `Enviamos un código de 6 dígitos a ${email}.` : 'Entra con tu cuenta de Milenew.'}
      side={<Side />}
    >
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key={error}
            className="alert"
            style={{ marginBottom: 14 }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {step === 'credentials' ? (
          <motion.form
            key="cred"
            className="form"
            onSubmit={handleCredentials}
            noValidate
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <Field
              label="Correo"
              type="email"
              icon={Mail}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
            />
            <Field
              label="Contraseña"
              type="password"
              icon={Lock}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
            />
            <div className="row between wrap">
              <label className="check">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Recordar mis datos
              </label>
              <Link to="/recuperar-cuenta" className="link" style={{ fontSize: 13 }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div>
              <Recaptcha
                key={theme}
                theme={theme}
                ref={recaptchaRef}
                onVerify={(t) => {
                  setCaptchaToken(t)
                  setError(null)
                }}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>
            <Button type="submit" size="lg" block loading={submitting} disabled={!captchaToken}>
              Entrar
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="2fa"
            className="form"
            onSubmit={handleCode}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
          >
            <Field
              label="Código de verificación"
              icon={KeyRound}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <Button type="submit" size="lg" block loading={submitting} disabled={code.length !== 6}>
              Confirmar código
            </Button>
            <Button variant="ghost" onClick={() => setStep('credentials')}>
              Volver
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="form-foot">
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </AuthLayout>
  )
}

export default Login
