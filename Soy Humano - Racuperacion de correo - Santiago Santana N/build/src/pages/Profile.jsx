import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProfile, updateProfile, changePassword } from '../services/userService'
import Button from '../components/common/Button.jsx'

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
      .then((response) => {
        if (!active) return
        const profile = response?.data ?? user
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
      const response = await updateProfile({ name, email })
      setUser(response?.data ?? { ...user, name, email })
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
      <h1>Mi perfil</h1>

      <h2>Datos básicos</h2>
      {profileInfo && <p>{profileInfo}</p>}
      {profileError && <p className="error">{profileError}</p>}
      <div className="form">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={handleProfileSubmit} disabled={savingProfile}>
          {savingProfile ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <h2>Cambiar contraseña</h2>
      {passwordInfo && <p>{passwordInfo}</p>}
      {passwordError && <p className="error">{passwordError}</p>}
      <div className="form">
        <input
          type="password"
          placeholder="Contraseña actual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
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
          onClick={handlePasswordSubmit}
          disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
        >
          {savingPassword ? 'Guardando...' : 'Actualizar contraseña'}
        </Button>
      </div>
    </div>
  )
}

export default Profile
