import { useState } from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function Login() {
  const navigate = useNavigate()

  const {
    login,
  } = useAuth()

  const [formulario, setFormulario] =
    useState({
      correo: '',
      password: '',
      nombre_dispositivo:
        'Atlantic Cinema Web',
    })

  const [error, setError] =
    useState('')

  const [enviando, setEnviando] =
    useState(false)

  const manejarCambio = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }))
  }

  const manejarSubmit =
    async (event) => {
      event.preventDefault()

      setError('')
      setEnviando(true)

      try {
        await login(formulario)

        navigate('/')
      } catch (err) {
        const mensaje =
          err.response?.data?.message
          || 'No fue posible iniciar sesión. Verifica tus datos e intenta nuevamente.'

        setError(mensaje)
      } finally {
        setEnviando(false)
      }
    }

  const iniciarConGoogle = () => {
    const apiUrl =
      import.meta.env.VITE_API_URL

    if (! apiUrl) {
      setError(
        'La URL de la API no está configurada.'
      )

      return
    }

    window.location.href =
      `${apiUrl}/auth/google`
  }

  return (
    <main className="auth-pagina">
      <section className="auth-tarjeta">
        <header className="auth-encabezado">
          <div className="auth-logo-imagen-contenedor">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="auth-logo-imagen"
            />
          </div>

          <h1>
            Atlantic Cinema
          </h1>

          <p>
            Vive la experiencia del cine
          </p>
        </header>

        <div className="auth-contenido">
          <div className="auth-titulo">
            <span className="auth-etiqueta">
              BIENVENIDO
            </span>

            <h2>
              Iniciar sesión
            </h2>

            <p>
              Ingresa a tu cuenta para
              reservar y comprar tus entradas.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="button"
            className="auth-boton auth-boton-google"
            onClick={iniciarConGoogle}
          >
            <span className="google-icono">
              G
            </span>

            Continuar con Google
          </button>

          <div className="auth-separador">
            <span>
              o continúa con correo
            </span>
          </div>

          <form
            className="auth-formulario"
            onSubmit={manejarSubmit}
          >
            <label>
              <span>
                Correo electrónico
              </span>

              <input
                name="correo"
                type="email"
                placeholder="correo@ejemplo.com"
                value={
                  formulario.correo
                }
                onChange={
                  manejarCambio
                }
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>
                Contraseña
              </span>

              <input
                name="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={
                  formulario.password
                }
                onChange={
                  manejarCambio
                }
                autoComplete="current-password"
                required
              />
            </label>

            <button
              className="auth-boton auth-boton-principal"
              type="submit"
              disabled={enviando}
            >
              {enviando
                ? 'Iniciando sesión...'
                : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-registro">
            ¿No tienes una cuenta?

            {' '}

            <Link to="/registro">
              Crear cuenta
            </Link>
          </p>

          <Link
            to="/"
            className="auth-volver"
          >
            ← Volver a la cartelera
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Login