import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../services/authService'
import Button from '../components/common/Button.jsx'
import Card from '../components/common/Card.jsx'
import Input from '../components/common/Input.jsx'

function RecoverAccount() {
  const [step, setStep] = useState('request') // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await requestPasswordReset({ email })
      // Mensaje genérico a propósito: no confirmamos si el correo existe.
      setInfo('Si el correo existe en nuestro sistema, te enviamos un código de un solo uso.')
      setStep('reset')
    } catch (err) {
      setError(
        !err.status
          ? 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'
          : err.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await resetPassword({ email, code, newPassword })
      setInfo('Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.')
      setStep('done')
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

  return (
    <div className="page" style={{ alignItems: 'center' }}>
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          <span className="sq" />
          Recuperación de cuenta
        </div>
        <h1 className="htitle" style={{ fontSize: 'clamp(20px,4vw,24px)', marginBottom: 18 }}>
          {step === 'done' ? 'Contraseña actualizada' : 'Recupera tu cuenta'}
        </h1>

        {info && (
          <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 14 }}>{info}</p>
        )}
        {error && (
          <div className="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {step === 'done' && (
          <Link to="/login">
            <Button variant="fill" style={{ width: '100%' }}>
              Ir a iniciar sesión
            </Button>
          </Link>
        )}

        {step === 'request' && (
          <form className="form" style={{ maxWidth: 'none' }} onSubmit={handleRequestSubmit}>
            <Input
              id="recover-email"
              label="Correo"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="fill" disabled={submitting || !email}>
              {submitting ? 'Enviando…' : 'Enviar código'}
            </Button>
          </form>
        )}

        {step === 'reset' && (
          <form className="form" style={{ maxWidth: 'none' }} onSubmit={handleResetSubmit}>
            <Input
              id="recover-code"
              label="Código recibido por correo"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Input
              id="new-password"
              label="Contraseña nueva"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              id="confirm-password"
              label="Confirmar contraseña nueva"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="fill"
              disabled={submitting || !code || !newPassword || !confirmPassword}
            >
              {submitting ? 'Guardando…' : 'Guardar nueva contraseña'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}

export default RecoverAccount
