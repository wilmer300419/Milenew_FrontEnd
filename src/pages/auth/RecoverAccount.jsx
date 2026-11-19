import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, KeyRound, Lock, Mail } from 'lucide-react'
import { requestPasswordReset, resetPassword } from '../../services/authService'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'

const STEPS = ['request', 'reset', 'done']

function RecoverAccount() {
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const run = async (fn) => {
    setSubmitting(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err.status ? err.message : 'No se pudo conectar con el servidor.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequest = (e) => {
    e.preventDefault()
    run(async () => {
      const res = await requestPasswordReset({ email: email.trim() })
      setInfo(res.message)
      setStep('reset')
    })
  }

  const handleReset = (e) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    run(async () => {
      const res = await resetPassword({ email: email.trim(), code: code.trim(), newPassword })
      setInfo(res.message)
      setStep('done')
    })
  }

  const index = STEPS.indexOf(step)

  return (
    <AuthLayout
      eyebrow="Recuperación de cuenta"
      title={step === 'done' ? 'Listo' : 'Recupera tu cuenta'}
      lead={step === 'request' ? 'Te enviaremos un código de un solo uso a tu correo.' : null}
      side={
        <h2 className="title-xl">
          Sin estrés.
          <br />
          <em>Vuelve a bordo.</em>
        </h2>
      }
    >
      <div className="steps">
        {STEPS.map((s, i) => (
          <i key={s} className={i <= index ? 'on' : ''} />
        ))}
      </div>
      {info && step !== 'request' && (
        <div className="alert info" style={{ marginBottom: 14 }}>
          {info}
        </div>
      )}
      {error && (
        <div className="alert" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {step === 'request' && (
          <motion.form key="req" className="form" onSubmit={handleRequest} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <Field label="Correo" type="email" icon={Mail} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" size="lg" block loading={submitting} disabled={!email}>
              Enviar código
            </Button>
          </motion.form>
        )}
        {step === 'reset' && (
          <motion.form key="reset" className="form" onSubmit={handleReset} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <Field label="Código recibido" icon={KeyRound} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            <Field label="Contraseña nueva" type="password" icon={Lock} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Field label="Confirmar contraseña" type="password" icon={Lock} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" size="lg" block loading={submitting} disabled={code.length !== 6 || !newPassword || !confirm}>
              Guardar contraseña
            </Button>
          </motion.form>
        )}
        {step === 'done' && (
          <motion.div key="done" className="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }} style={{ color: 'var(--yellow)', display: 'grid', placeItems: 'center' }}>
              <CheckCircle2 size={56} strokeWidth={1.6} />
            </motion.div>
            <Link to="/login">
              <Button size="lg" block>
                Ir a iniciar sesión
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="form-foot">
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </AuthLayout>
  )
}

export default RecoverAccount
