import { useEffect, useState } from 'react'
import { Bell, Lock, Mail, Moon, Navigation, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { changePassword, updateProfile } from '../services/userService'
import Glass from '../components/ui/Glass.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import Switch from '../components/ui/Switch.jsx'
import Segmented from '../components/ui/Segmented.jsx'
import Reveal, { revealItem } from '../components/ui/Reveal.jsx'

const THEMES = [
  { value: 'dark', label: 'Oscuro', icon: <Moon size={14} /> },
  { value: 'light', label: 'Claro', icon: <Sun size={14} /> },
]

function PreferenceRow({ icon: Icon, title, text, checked, onChange }) {
  return (
    <div className="pref-row">
      <span className="list-ico" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span className="list-text">
        <b>{title}</b>
        <small>{text}</small>
      </span>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}

function Profile() {
  const { user, setUser, isOperator } = useAuth()
  const { prefs, update } = usePreferences()
  const toast = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [pErrors, setPErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user])

  const dirty = name.trim() !== (user?.name ?? '') || email.trim() !== (user?.email ?? '')

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setPErrors({})
    try {
      const res = await updateProfile({ name: name.trim(), email: email.trim() })
      setUser(res.data)
      toast.success(res.message)
    } catch (err) {
      setPErrors(err.errors ?? {})
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) {
      setPwErrors({ confirm: 'Las contraseñas no coinciden' })
      return
    }
    setSavingPw(true)
    setPwErrors({})
    try {
      const res = await changePassword({ currentPassword: pw.current, newPassword: pw.next })
      toast.success(res.message)
      setPw({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwErrors(err.errors ?? {})
      toast.error(err.message)
    } finally {
      setSavingPw(false)
    }
  }

  const savePref = (patch, message) =>
    update(patch)
      .then(() => toast.success(message))
      .catch(() => toast.error('No se pudo guardar la preferencia'))

  return (
    <Reveal>
      <Reveal.Item className="page-head">
        <div>
          <span className="eyebrow">Mi cuenta</span>
          <h1 className="title-lg" style={{ marginTop: 10 }}>
            {user?.name}
          </h1>
          <p className="row" style={{ gap: 8 }}>
            <span className="chip">
              <ShieldCheck size={13} /> {isOperator ? 'Operador' : 'Pasajero'}
            </span>
            <span className="muted">{user?.email}</span>
          </p>
        </div>
      </Reveal.Item>

      <div className="grid grid-2">
        <Glass as="form" variants={revealItem} onSubmit={saveProfile}>
          <div className="card-head">
            <h3 className="title-md">Datos básicos</h3>
          </div>
          <div className="form">
            <Field label="Nombre" icon={UserRound} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={pErrors.name} />
            <Field label="Correo" type="email" icon={Mail} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={pErrors.email} />
            <Button type="submit" loading={saving} disabled={!dirty}>
              Guardar cambios
            </Button>
          </div>
        </Glass>

        <Glass variants={revealItem}>
          <div className="card-head">
            <h3 className="title-md">Preferencias</h3>
          </div>
          <div className="pref-row">
            <span className="list-ico" aria-hidden="true">
              {prefs.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <span className="list-text">
              <b>Apariencia</b>
              <small>Se guarda en tu cuenta.</small>
            </span>
            <Segmented
              size="sm"
              options={THEMES}
              value={prefs.theme}
              onChange={(theme) => savePref({ theme }, theme === 'dark' ? 'Tema oscuro activado' : 'Tema claro activado')}
            />
          </div>
          {!isOperator && (
            <PreferenceRow
              icon={Navigation}
              title="Aviso de llegada"
              text="Te avisamos un minuto antes de llegar a tu destino."
              checked={prefs.notifyArrivals}
              onChange={(v) => savePref({ notifyArrivals: v }, v ? 'Aviso de llegada activado' : 'Aviso de llegada desactivado')}
            />
          )}
          <PreferenceRow
            icon={Bell}
            title="Novedades del servicio"
            text="Obras, cierres y avisos generales de la troncal."
            checked={prefs.notifyNews}
            onChange={(v) => savePref({ notifyNews: v }, v ? 'Novedades activadas' : 'Novedades desactivadas')}
          />
        </Glass>

        <Glass as="form" variants={revealItem} onSubmit={savePassword}>
          <div className="card-head">
            <h3 className="title-md">Cambiar contraseña</h3>
          </div>
          <div className="form">
            <Field label="Contraseña actual" type="password" icon={Lock} autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={pwErrors.currentPassword} />
            <Field label="Contraseña nueva (mín. 8 caracteres)" type="password" icon={Lock} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={pwErrors.newPassword} />
            <Field label="Confirmar contraseña nueva" type="password" icon={Lock} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErrors.confirm} />
            <Button type="submit" loading={savingPw} disabled={!pw.current || !pw.next || !pw.confirm}>
              Actualizar contraseña
            </Button>
          </div>
        </Glass>
      </div>
    </Reveal>
  )
}

export default Profile
