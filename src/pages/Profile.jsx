import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProfile, updateProfile, changePassword } from '../services/userService'
import Button from '../components/common/Button.jsx'
import Card from '../components/common/Card.jsx'
import Input from '../components/common/Input.jsx'

function Profile() {
  const { user, setUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileError, setProfileError] = useState(null)
  const [profileInfo, setProfileInfo] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordInfo, setPasswordInfo] = useState(null)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    let active = true

    getProfile()
      .then((res) => {
        if (!active) return
        const profile = res?.data ?? user
        setName(profile?.name ?? '')
        setEmail(profile?.email ?? '')
      })
      .catch(() => {
        // Si falla la carga, seguimos mostrando lo que ya había en el
        // contexto (por ejemplo, lo recibido al iniciar sesión).
        if (active && user) {
          setName(user.name ?? '')
          setEmail(user.email ?? '')
        }
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError(null)
    setProfileInfo(null)

    try {
      const res = await updateProfile({ name, email })
      setUser(res?.data ?? { ...user, name, email })
      setProfileInfo('Tus datos se actualizaron correctamente.')
    } catch (err) {
      setProfileError(
        !err.status
          ? 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'
          : err.message || 'No se pudo actualizar tu perfil. Inténtalo de nuevo.',
      )
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setSavingPassword(true)
    setPasswordError(null)
    setPasswordInfo(null)

    try {
      await changePassword({ currentPassword, newPassword })
      setPasswordInfo('Tu contraseña se actualizó correctamente.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(
        !err.status
          ? 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'
          : err.message || 'No se pudo actualizar tu contraseña. Verifica tu contraseña actual.',
      )
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="page">
      <div className="eyebrow">
        <span className="sq" />
        Mi cuenta
      </div>
      <h1 className="htitle" style={{ fontSize: 'clamp(26px,4vw,34px)', marginBottom: 6 }}>
        Mi perfil
      </h1>

      <div className="g2">
        <Card>
          <div className="sec">
            <h3>Datos básicos</h3>
          </div>
          {profileInfo && <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 10 }}>{profileInfo}</p>}
          {profileError && (
            <div className="alert" style={{ marginBottom: 12 }}>
              {profileError}
            </div>
          )}
          <form className="form" style={{ maxWidth: 'none' }} onSubmit={handleProfileSubmit}>
            <Input id="profile-name" label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              id="profile-email"
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" variant="fill" disabled={savingProfile}>
              {savingProfile ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="sec">
            <h3>Cambiar contraseña</h3>
          </div>
          {passwordInfo && <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 10 }}>{passwordInfo}</p>}
          {passwordError && (
            <div className="alert" style={{ marginBottom: 12 }}>
              {passwordError}
            </div>
          )}
          <form className="form" style={{ maxWidth: 'none' }} onSubmit={handlePasswordSubmit}>
            <Input
              id="current-password"
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              id="new-password-profile"
              label="Contraseña nueva"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              id="confirm-password-profile"
              label="Confirmar contraseña nueva"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="fill"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {savingPassword ? 'Guardando…' : 'Actualizar contraseña'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Profile
