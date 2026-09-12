import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button.jsx'

function Login() {
  const { loginUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false) 
  const [loading, setLoading] = useState(false) 
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault() 
    setError(null)
    setLoading(true)

    try {
      await loginUser({ email, password }, rememberMe)
      window.location.href = '/'
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>Iniciar sesión</h1>
      {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
      
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe">Recordar mis datos</label>
        </div>

        {}
        <Button type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}

export default Login