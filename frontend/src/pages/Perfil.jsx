import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  useAuth,
} from '../context/AuthContext'

import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function Perfil() {
  const {
    usuario,
    actualizarPerfil,
    actualizarAvatar,
    cambiarPassword,
  } = useAuth()

  const inputAvatarRef =
    useRef(null)

  const [
    formulario,
    setFormulario,
  ] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    nit: '',
    direccion: '',
  })

  const [
    passwordFormulario,
    setPasswordFormulario,
  ] = useState({
    password_actual: '',
    password: '',
    password_confirmation: '',
  })

  const [
    guardando,
    setGuardando,
  ] = useState(false)

  const [
    cambiandoPassword,
    setCambiandoPassword,
  ] = useState(false)

  const [
    subiendoAvatar,
    setSubiendoAvatar,
  ] = useState(false)

  const [
    avatarError,
    setAvatarError,
  ] = useState(false)

  const [
    mensaje,
    setMensaje,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    errorPassword,
    setErrorPassword,
  ] = useState('')

  const [
    mensajePassword,
    setMensajePassword,
  ] = useState('')

  useEffect(() => {
    if (!usuario) {
      return
    }

    setFormulario({
      nombres:
        usuario.nombres
        ?? '',

      apellidos:
        usuario.apellidos
        ?? '',

      telefono:
        usuario.telefono
        ?? '',

      nit:
        usuario.nit
        ?? '',

      direccion:
        usuario.direccion
        ?? '',
    })

    setAvatarError(false)
  }, [usuario])

  const obtenerMensajeError =
    (err) => {
      const errores =
        err.response?.data
          ?.errors

      if (errores) {
        const primerError =
          Object.values(
            errores
          )[0]

        if (
          Array.isArray(
            primerError
          )
        ) {
          return primerError[0]
        }
      }

      return (
        err.response?.data
          ?.message
        ?? 'Ocurrió un error inesperado.'
      )
    }

  const obtenerAvatarUrl =
    () => {
      const avatar =
        usuario?.avatar_url

      if (!avatar) {
        return null
      }

      if (
        avatar.startsWith(
          'http://'
        )
        || avatar.startsWith(
          'https://'
        )
      ) {
        return avatar
      }

      const apiUrl =
        import.meta.env
          .VITE_API_URL
        ?? 'http://127.0.0.1:8000/api'

      const backendUrl =
        apiUrl.replace(
          /\/api\/?$/,
          ''
        )

      return `${backendUrl}/storage/${avatar}`
    }

  const manejarCambio =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setFormulario(
        (actual) => ({
          ...actual,
          [name]: value,
        })
      )
    }

  const manejarCambioPassword =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setPasswordFormulario(
        (actual) => ({
          ...actual,
          [name]: value,
        })
      )
    }

  const guardarPerfil =
    async (event) => {
      event.preventDefault()

      try {
        setGuardando(true)
        setError('')
        setMensaje('')

        await actualizarPerfil(
          formulario
        )

        setMensaje(
          'Tus datos se actualizaron correctamente.'
        )
      } catch (err) {
        setError(
          obtenerMensajeError(
            err
          )
        )
      } finally {
        setGuardando(false)
      }
    }

  const seleccionarAvatar =
    () => {
      inputAvatarRef
        .current
        ?.click()
    }

  const cambiarAvatar =
    async (event) => {
      const archivo =
        event.target.files?.[0]

      if (!archivo) {
        return
      }

      try {
        setSubiendoAvatar(true)
        setError('')
        setMensaje('')

        await actualizarAvatar(
          archivo
        )

        setAvatarError(false)

        setMensaje(
          'Tu foto de perfil se actualizó correctamente.'
        )
      } catch (err) {
        setError(
          obtenerMensajeError(
            err
          )
        )
      } finally {
        setSubiendoAvatar(false)

        event.target.value = ''
      }
    }

  const guardarPassword =
    async (event) => {
      event.preventDefault()

      try {
        setCambiandoPassword(
          true
        )

        setErrorPassword('')
        setMensajePassword('')

        await cambiarPassword(
          passwordFormulario
        )

        setPasswordFormulario({
          password_actual: '',
          password: '',
          password_confirmation: '',
        })

        setMensajePassword(
          'Tu contraseña se actualizó correctamente.'
        )
      } catch (err) {
        setErrorPassword(
          obtenerMensajeError(
            err
          )
        )
      } finally {
        setCambiandoPassword(
          false
        )
      }
    }

  const usaGoogle =
    Boolean(
      usuario?.google_id
    )

  const iniciales =
    `${usuario?.nombres?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`
      .toUpperCase()

  const avatarUrl =
    obtenerAvatarUrl()

  const mostrarImagen =
    avatarUrl
    && !avatarError

  const estadoUsuario =
    usuario?.estado
    ?? '-'

  return (
    <div className="perfil-pagina">
      <nav className="perfil-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="perfil-logo-contenedor">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="perfil-logo-imagen"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <small>
              Experiencia cinematográfica
            </small>
          </div>
        </Link>

        <Link
          to="/"
          className="perfil-volver"
        >
          ← Volver a cartelera
        </Link>
      </nav>

      <main className="perfil-contenido">
        <header className="perfil-cabecera">
          <div>
            <p className="perfil-etiqueta">
              MI CUENTA
            </p>

            <h1>
              Perfil
            </h1>

            <p>
              Consulta y actualiza la
              información asociada a tu
              cuenta de Atlantic Cinema.
            </p>
          </div>
        </header>

        <div className="perfil-layout">
          <aside className="perfil-resumen">
            <button
              type="button"
              className="perfil-avatar perfil-avatar-boton"
              onClick={
                seleccionarAvatar
              }
              disabled={
                subiendoAvatar
              }
              title="Cambiar foto de perfil"
            >
              {mostrarImagen ? (
                <img
                  src={avatarUrl}
                  alt=""
                  onError={() =>
                    setAvatarError(
                      true
                    )
                  }
                />
              ) : (
                <span>
                  {iniciales || 'AC'}
                </span>
              )}

              <span className="perfil-avatar-overlay">
                {subiendoAvatar
                  ? '...'
                  : 'Cambiar'}
              </span>
            </button>

            <input
              ref={inputAvatarRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                cambiarAvatar
              }
              hidden
            />

            <span className="perfil-avatar-ayuda">
              JPG, PNG o WEBP · máximo 2 MB
            </span>

            <h2>
              {usuario?.nombres}{' '}
              {usuario?.apellidos}
            </h2>

            <p>
              {usuario?.correo}
            </p>

            <div className="perfil-resumen-datos">
              <div>
                <span>
                  Rol
                </span>

                <strong>
                  {
                    usuario?.rol
                      ?.nombre
                    ?? 'Sin rol'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Acceso
                </span>

                <strong>
                  {
                    usaGoogle
                      ? 'Google'
                      : 'Correo y contraseña'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Estado
                </span>

                <strong
                  className={`perfil-estado perfil-estado-${estadoUsuario.toLowerCase()}`}
                >
                  {estadoUsuario}
                </strong>
              </div>
            </div>
          </aside>

          <div className="perfil-secciones">
            <section className="perfil-card">
              <div className="perfil-card-cabecera">
                <div>
                  <p className="perfil-etiqueta">
                    INFORMACIÓN PERSONAL
                  </p>

                  <h2>
                    Tus datos
                  </h2>

                  <p>
                    El correo de acceso no
                    puede modificarse desde
                    esta sección.
                  </p>
                </div>
              </div>

              {mensaje && (
                <div className="perfil-mensaje perfil-mensaje-exito">
                  {mensaje}
                </div>
              )}

              {error && (
                <div className="perfil-mensaje perfil-mensaje-error">
                  {error}
                </div>
              )}

              <form
                className="perfil-formulario"
                onSubmit={
                  guardarPerfil
                }
              >
                <div className="perfil-grid">
                  <label>
                    <span>
                      Nombres
                    </span>

                    <input
                      type="text"
                      name="nombres"
                      value={
                        formulario.nombres
                      }
                      onChange={
                        manejarCambio
                      }
                      required
                      maxLength={100}
                    />
                  </label>

                  <label>
                    <span>
                      Apellidos
                    </span>

                    <input
                      type="text"
                      name="apellidos"
                      value={
                        formulario.apellidos
                      }
                      onChange={
                        manejarCambio
                      }
                      required
                      maxLength={100}
                    />
                  </label>

                  <label>
                    <span>
                      Correo electrónico
                    </span>

                    <input
                      type="email"
                      value={
                        usuario?.correo
                        ?? ''
                      }
                      disabled
                    />

                    <small>
                      El correo se utiliza
                      como identificador de
                      acceso.
                    </small>
                  </label>

                  <label>
                    <span>
                      Teléfono
                    </span>

                    <input
                      type="text"
                      name="telefono"
                      value={
                        formulario.telefono
                      }
                      onChange={
                        manejarCambio
                      }
                      maxLength={30}
                      placeholder="Opcional"
                    />
                  </label>

                  <label>
                    <span>
                      NIT
                    </span>

                    <input
                      type="text"
                      name="nit"
                      value={
                        formulario.nit
                      }
                      onChange={
                        manejarCambio
                      }
                      maxLength={30}
                      placeholder="CF o NIT"
                    />
                  </label>

                  <label className="perfil-campo-completo">
                    <span>
                      Dirección
                    </span>

                    <input
                      type="text"
                      name="direccion"
                      value={
                        formulario.direccion
                      }
                      onChange={
                        manejarCambio
                      }
                      maxLength={255}
                      placeholder="Dirección de facturación o residencia"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="perfil-boton-principal"
                  disabled={
                    guardando
                  }
                >
                  {guardando
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>
              </form>
            </section>

            <section className="perfil-card">
              <div className="perfil-card-cabecera">
                <div>
                  <p className="perfil-etiqueta">
                    SEGURIDAD
                  </p>

                  <h2>
                    Contraseña
                  </h2>

                  <p>
                    Administra las
                    credenciales de acceso
                    de tu cuenta.
                  </p>
                </div>
              </div>

              {usaGoogle ? (
                <div className="perfil-google-aviso">
                  <strong>
                    Cuenta vinculada con Google
                  </strong>

                  <p>
                    Esta cuenta utiliza Google
                    para iniciar sesión. La
                    contraseña se administra
                    desde tu cuenta de Google.
                  </p>
                </div>
              ) : (
                <>
                  {mensajePassword && (
                    <div className="perfil-mensaje perfil-mensaje-exito">
                      {mensajePassword}
                    </div>
                  )}

                  {errorPassword && (
                    <div className="perfil-mensaje perfil-mensaje-error">
                      {errorPassword}
                    </div>
                  )}

                  <form
                    className="perfil-formulario"
                    onSubmit={
                      guardarPassword
                    }
                  >
                    <label>
                      <span>
                        Contraseña actual
                      </span>

                      <input
                        type="password"
                        name="password_actual"
                        value={
                          passwordFormulario
                            .password_actual
                        }
                        onChange={
                          manejarCambioPassword
                        }
                        autoComplete="current-password"
                        required
                      />
                    </label>

                    <div className="perfil-grid">
                      <label>
                        <span>
                          Nueva contraseña
                        </span>

                        <input
                          type="password"
                          name="password"
                          value={
                            passwordFormulario
                              .password
                          }
                          onChange={
                            manejarCambioPassword
                          }
                          autoComplete="new-password"
                          minLength={8}
                          required
                        />

                        <small className="perfil-password-ayuda">
                          Mínimo 8 caracteres,
                          una mayúscula, una
                          minúscula y un número.
                        </small>
                      </label>

                      <label>
                        <span>
                          Confirmar contraseña
                        </span>

                        <input
                          type="password"
                          name="password_confirmation"
                          value={
                            passwordFormulario
                              .password_confirmation
                          }
                          onChange={
                            manejarCambioPassword
                          }
                          autoComplete="new-password"
                          minLength={8}
                          required
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="perfil-boton-secundario"
                      disabled={
                        cambiandoPassword
                      }
                    >
                      {cambiandoPassword
                        ? 'Actualizando...'
                        : 'Cambiar contraseña'}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Perfil