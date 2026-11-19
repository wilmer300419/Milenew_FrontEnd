import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Mail, UserRound } from 'lucide-react'
import { register } from '../../services/authService'
import { homeFor, useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Recaptcha from '../../components/auth/Recaptcha.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++
  return s
}

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const recaptchaRef = useRef(null)
  const { loginUser } = useAuth()
  const toast = useToast()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const score = useMemo(() => strength(form.password), [form.password])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Escribe tu nombre'
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Correo electrónico inválido'
    if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (form.confirm !== form.password) errs.confirm = 'Las contraseñas no coinciden'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (!captchaToken) {
      setError('Completa la verificación "No soy un robot".')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        captchaToken,
      })
      loginUser(res.data.user, res.data.token, true)
      toast.success('¡Cuenta creada! Bienvenido a Milenew')
      navigate(homeFor(res.data.user), { replace: true })
    } catch (err) {
      setError(err.status ? err.message : 'No se pudo conectar con el servidor.')
      setErrors(err.errors ?? {})
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Registro"
      title="Crea tu cuenta"
      lead="Gratis. Recibes una tarjeta TuLlave virtual para recargar y pagar tus viajes."
      side={
        <div>
          <h2 className="title-xl">
            Bogotá se mueve.
            <br />
            <em>Tú también.</em>
          </h2>
          <p style={{ marginTop: 18 }}>Favoritas, llegadas en vivo, historial de viajes y recargas en un solo lugar.</p>
        </div>
      }
    >
      <AnimatePresence>
        {error && (
          <motion.div className="alert" style={{ marginBottom: 14 }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Field label="Nombre completo" icon={UserRound} autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="Correo" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field
          label="Contraseña"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <div className="steps" aria-label={`Seguridad de la contraseña: ${score} de 4`}>
          {[1, 2, 3, 4].map((n) => (
            <i key={n} className={score >= n ? 'on' : ''} />
          ))}
        </div>
        <Field
          label="Confirmar contraseña"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <div>
          <Recaptcha key={theme} theme={theme} ref={recaptchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
        </div>
        <Button type="submit" size="lg" block loading={submitting} disabled={!captchaToken}>
          Crear cuenta
        </Button>
      </form>
      <p className="form-foot">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  )
}

export default Register
