import {
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../context/AuthContext'

import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function Registro() {
  const navigate = useNavigate()

  const {
    registro,
  } = useAuth()

  const [
    formulario,
    setFormulario,
  ] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    password: '',
    password_confirmation: '',
    telefono: '',
    nit: '',
    direccion: '',
    nombre_dispositivo:
      'Atlantic Cinema Web',
  })

  const [error, setError] =
    useState('')

  const [enviando, setEnviando] =
    useState(false)

  const manejarCambio = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    )
  }

  const manejarSubmit =
    async (event) => {
      event.preventDefault()

      setError('')
      setEnviando(true)

      try {
        await registro(
          formulario
        )

        navigate('/')
      } catch (err) {
        const errores =
          err.response?.data
            ?.errors

        if (errores) {
          const mensajes =
            Object.values(
              errores
            ).flat()

          setError(
            mensajes.join(' ')
          )
        } else {
          setError(
            err.response?.data
              ?.message
            || 'No fue posible completar el registro.'
          )
        }
      } finally {
        setEnviando(false)
      }
    }

  return (
    <main className="registro-pagina">
      <section className="registro-card">
        <Link
          to="/"
          className="registro-marca"
        >
          <div className="registro-logo-contenedor">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="registro-logo-imagen"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <small>
              Vive la experiencia
            </small>
          </div>
        </Link>

        <div className="registro-encabezado">
          <span className="registro-etiqueta">
            NUEVA CUENTA
          </span>

          <h1>
            Crea tu cuenta
          </h1>

          <p>
            Regístrate para reservar
            asientos, comprar entradas
            y gestionar tus compras.
          </p>
        </div>

        {error && (
          <div className="registro-error">
            <strong>
              No pudimos completar
              el registro
            </strong>

            <p>
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={
            manejarSubmit
          }
          className="registro-formulario"
        >
          <div className="registro-grid">
            <div className="registro-campo">
              <label htmlFor="nombres">
                Nombres
              </label>

              <input
                id="nombres"
                name="nombres"
                type="text"
                value={
                  formulario.nombres
                }
                onChange={
                  manejarCambio
                }
                placeholder="Tus nombres"
                autoComplete="given-name"
                required
              />
            </div>

            <div className="registro-campo">
              <label htmlFor="apellidos">
                Apellidos
              </label>

              <input
                id="apellidos"
                name="apellidos"
                type="text"
                value={
                  formulario.apellidos
                }
                onChange={
                  manejarCambio
                }
                placeholder="Tus apellidos"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="registro-campo">
            <label htmlFor="correo">
              Correo electrónico
            </label>

            <input
              id="correo"
              name="correo"
              type="email"
              value={
                formulario.correo
              }
              onChange={
                manejarCambio
              }
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="registro-grid">
            <div className="registro-campo">
              <label htmlFor="password">
                Contraseña
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={
                  formulario.password
                }
                onChange={
                  manejarCambio
                }
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />

              <small className="registro-ayuda-password">
                Mínimo 8 caracteres,
                una mayúscula, una
                minúscula y un número.
              </small>
            </div>

            <div className="registro-campo">
              <label htmlFor="password_confirmation">
                Confirmar contraseña
              </label>

              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                value={
                  formulario
                    .password_confirmation
                }
                onChange={
                  manejarCambio
                }
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="registro-opcionales">
            <div className="registro-opcionales-cabecera">
              <span>
                Datos opcionales
              </span>

              <p>
                Puedes completar esta
                información ahora o
                actualizarla más adelante
                desde tu perfil.
              </p>
            </div>

            <div className="registro-grid">
              <div className="registro-campo">
                <label htmlFor="telefono">
                  Teléfono
                </label>

                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={
                    formulario.telefono
                  }
                  onChange={
                    manejarCambio
                  }
                  placeholder="Ej. 5555 5555"
                  autoComplete="tel"
                />
              </div>

              <div className="registro-campo">
                <label htmlFor="nit">
                  NIT
                </label>

                <input
                  id="nit"
                  name="nit"
                  type="text"
                  value={
                    formulario.nit
                  }
                  onChange={
                    manejarCambio
                  }
                  placeholder="Ej. 1234567-8"
                />
              </div>
            </div>

            <div className="registro-campo">
              <label htmlFor="direccion">
                Dirección
              </label>

              <input
                id="direccion"
                name="direccion"
                type="text"
                value={
                  formulario.direccion
                }
                onChange={
                  manejarCambio
                }
                placeholder="Dirección de residencia"
                autoComplete="street-address"
              />
            </div>
          </div>

          <button
            type="submit"
            className="registro-boton"
            disabled={
              enviando
            }
          >
            {enviando
              ? 'Creando cuenta...'
              : 'Crear cuenta'}
          </button>
        </form>

        <div className="registro-login">
          <span>
            ¿Ya tienes una cuenta?
          </span>

          <Link to="/login">
            Iniciar sesión
          </Link>
        </div>

        <Link
          to="/"
          className="registro-volver"
        >
          ← Volver a la cartelera
        </Link>
      </section>
    </main>
  )
}

export default Registro