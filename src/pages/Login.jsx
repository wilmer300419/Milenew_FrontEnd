import { useState } from 'react'
import { login } from '../services/authService'
import Button from '../components/common/Button.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login({ email, password })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <h1>Iniciar sesión</h1>
      {error && <p className="error">{error}</p>}
      <div className="form">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={handleSubmit}>Entrar</Button>
      </div>
    </div>
  )
}

export default Login
