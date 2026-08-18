import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function Cartelera() {
  const {
    autenticado,
    usuario,
    logout,
  } = useAuth()

  const [funciones, setFunciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarFunciones = async () => {
      try {
        const response = await api.get('/funciones')

        const data = response.data.data ?? response.data

        setFunciones(
          Array.isArray(data)
            ? data
            : [],
        )
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No fue posible cargar la cartelera.',
        )
      } finally {
        setCargando(false)
      }
    }

    cargarFunciones()
  }, [])

  const cerrarSesion = async () => {
    await logout()
  }

  const rol = usuario?.rol?.nombre

  const esPersonal = [
    'Administrador',
    'Empleado',
  ].includes(rol)

  if (cargando) {
    return (
      <main>
        <p>Cargando cartelera...</p>
      </main>
    )
  }

  return (
    <main>
      <h1>Atlantic Cinema</h1>

      <nav>
        {autenticado ? (
          <>
            <span>
              Bienvenido, {usuario?.nombres}{' '}
              {usuario?.apellidos}
            </span>

            {' '}

            {esPersonal && (
              <>
                <Link to="/taquilla/reservas">
                  Ir a taquilla
                </Link>

                {' '}
              </>
            )}

            <button
              type="button"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              Iniciar sesión
            </Link>

            {' '}

            <Link to="/registro">
              Crear cuenta
            </Link>
          </>
        )}
      </nav>

      <h2>Cartelera</h2>

      {error && (
        <p>{error}</p>
      )}

      {!error &&
        funciones.length === 0 && (
          <p>
            No hay funciones disponibles actualmente.
          </p>
        )}

      {funciones.map((funcion) => (
        <article key={funcion.id}>
          <h3>
            {funcion.pelicula?.titulo ||
              'Película sin título'}
          </h3>

          <p>
            Sala:{' '}
            {funcion.sala?.nombre ||
              'No disponible'}
          </p>

          <p>
            Formato:{' '}
            {funcion.formato?.nombre ||
              'No disponible'}
          </p>

          <p>
            Inicio: {funcion.inicia_en}
          </p>

          <p>
            Precio: Q{funcion.precio_base}
          </p>

          <p>
            Estado: {funcion.estado}
          </p>

          <Link
            to={`/funciones/${funcion.id}`}
          >
            Ver función
          </Link>

          <hr />
        </article>
      ))}
    </main>
  )
}

export default Cartelera