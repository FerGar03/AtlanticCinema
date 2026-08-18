import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formulario, setFormulario] = useState({
    correo: '',
    password: '',
    nombre_dispositivo: 'Atlantic Cinema Web',
  })

  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const manejarCambio = (event) => {
    const { name, value } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }))
  }

  const manejarSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setEnviando(true)

    try {
      await login(formulario)
      navigate('/')
    } catch (err) {
      const mensaje =
        err.response?.data?.message ||
        'No fue posible iniciar sesión. Intenta nuevamente.'

      setError(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
  <main>
    <h1>Atlantic Cinema</h1>
    <h2>Iniciar sesión</h2>

    {error && <p>{error}</p>}

    <form onSubmit={manejarSubmit}>
      <div>
        <label htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          name="correo"
          type="email"
          value={formulario.correo}
          onChange={manejarCambio}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formulario.password}
          onChange={manejarCambio}
          required
        />
      </div>

      <button type="submit" disabled={enviando}>
        {enviando ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>

    <p>
      ¿No tienes una cuenta? <Link to="/registro">Crear cuenta</Link>
    </p>
  </main>
)
}

export default Login