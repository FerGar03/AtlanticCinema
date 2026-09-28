import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

function GoogleCallback() {
  const navigate =
    useNavigate()

  const {
    guardarSesion,
  } = useAuth()

  const [
    error,
    setError,
  ] = useState('')

  /*
   * Evita procesar dos veces el callback.
   *
   * Es especialmente útil durante desarrollo,
   * donde React puede ejecutar determinados
   * efectos más de una vez.
   */
  const procesadoRef =
    useRef(false)

  useEffect(() => {
    if (
      procesadoRef.current
    ) {
      return
    }

    procesadoRef.current =
      true

    const completarAutenticacion =
      async () => {
        try {
          /*
           * Laravel redirige hacia:
           *
           * /auth/google/callback#token=...
           *
           * El fragmento permanece únicamente
           * en el navegador y no se vuelve a
           * enviar al servidor.
           */
          const parametros =
            new URLSearchParams(
              window.location.hash
                .substring(1)
            )

          const token =
            parametros.get(
              'token'
            )

          const errorGoogle =
            parametros.get(
              'error'
            )

          if (errorGoogle) {
            throw new Error(
              errorGoogle
            )
          }

          if (!token) {
            throw new Error(
              'No se recibió el token de autenticación de Google.'
            )
          }

          /*
           * Guarda el token Sanctum y
           * recupera inmediatamente el usuario
           * autenticado desde Laravel.
           */
          await guardarSesion(
            token
          )

          /*
           * Solo limpiamos el fragmento
           * después de haber guardado y
           * validado correctamente el token.
           */
          window.history.replaceState(
            {},
            document.title,
            '/auth/google/callback'
          )

          navigate(
            '/',
            {
              replace: true,
            }
          )
        } catch (err) {
          localStorage.removeItem(
            'token'
          )

          setError(
            err.message
            || 'No fue posible completar el inicio de sesión con Google.'
          )
        }
      }

    completarAutenticacion()
  }, [
    guardarSesion,
    navigate,
  ])

  return (
    <main className="auth-pagina">
      <section className="auth-tarjeta auth-callback">
        {!error ? (
          <>
            <div className="auth-cargando-icono">
              AC
            </div>

            <h1>
              Atlantic Cinema
            </h1>

            <h2>
              Iniciando sesión
            </h2>

            <p>
              Estamos completando
              tu acceso con Google.
            </p>

            <div className="auth-spinner" />
          </>
        ) : (
          <>
            <div className="auth-logo">
              AC
            </div>

            <h1>
              Atlantic Cinema
            </h1>

            <h2>
              No fue posible
              iniciar sesión
            </h2>

            <p className="auth-error">
              {error}
            </p>

            <Link
              to="/login"
              className="auth-boton auth-boton-principal"
            >
              Volver al inicio
              de sesión
            </Link>
          </>
        )}
      </section>
    </main>
  )
}

export default GoogleCallback