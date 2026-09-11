import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../services/authService'
import Button from '../components/common/Button.jsx'

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

  if (step === 'done') {
    return (
      <div className="page">
        <h1>Recuperación de cuenta</h1>
        {info && <p>{info}</p>}
        <Link to="/login">Ir a iniciar sesión</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Recuperación de cuenta</h1>
      {info && <p>{info}</p>}
      {error && <p className="error">{error}</p>}

      {step === 'request' && (
        <div className="form">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleRequestSubmit} disabled={submitting || !email}>
            {submitting ? 'Enviando...' : 'Enviar código'}
          </Button>
        </div>
      )}

      {step === 'reset' && (
        <div className="form">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Código recibido por correo"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña nueva"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirmar contraseña nueva"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            onClick={handleResetSubmit}
            disabled={submitting || !code || !newPassword || !confirmPassword}
          >
            {submitting ? 'Guardando...' : 'Guardar nueva contraseña'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default RecoverAccount
