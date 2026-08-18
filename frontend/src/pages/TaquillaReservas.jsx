import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function TaquillaReservas() {
  const { usuario } = useAuth()

  const [reservas, setReservas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarReservas = async () => {
      try {
        const response = await api.get('/reservas')
        const data = response.data.data ?? response.data

        setReservas(
          Array.isArray(data)
            ? data
            : [],
        )
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No fue posible cargar las reservas.',
        )
      } finally {
        setCargando(false)
      }
    }

    cargarReservas()
  }, [])

  const reservasFiltradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toUpperCase()

    if (!termino) {
      return reservas
    }

    return reservas.filter((reserva) => {
      const codigo = String(
        reserva.codigo ?? '',
      ).toUpperCase()

      const nombreCliente = [
        reserva.usuario?.nombres,
        reserva.usuario?.apellidos,
      ]
        .filter(Boolean)
        .join(' ')
        .toUpperCase()

      return (
        codigo.includes(termino) ||
        nombreCliente.includes(termino)
      )
    })
  }, [reservas, busqueda])

  const obtenerAsientos = (reserva) => {
    if (!Array.isArray(reserva.detalles)) {
      return 'No disponibles'
    }

    const asientos = reserva.detalles
      .map((detalle) => {
        const asiento =
          detalle.funcion_asiento?.asiento ??
          detalle.funcionAsiento?.asiento

        if (!asiento) {
          return null
        }

        return `${asiento.fila}${asiento.numero}`
      })
      .filter(Boolean)

    return asientos.length > 0
      ? asientos.join(', ')
      : 'No disponibles'
  }

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return 'No disponible'
    }

    return new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(fecha))
  }

  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente de pago'

      case 'VENCIDA':
        return 'Vencida'

      case 'CANCELADA':
        return 'Cancelada'

      case 'CONVERTIDA':
        return 'Confirmada'

      default:
        return estado
    }
  }

  if (cargando) {
    return (
      <main className="taquilla-reservas">
        <p>Cargando reservas...</p>
      </main>
    )
  }

  return (
    <main className="taquilla-reservas">
      <Link to="/">
        ← Volver a cartelera
      </Link>

      <h1>Atlantic Cinema</h1>

      <section className="encabezado-taquilla">
        <p className="taquilla-etiqueta">
          TAQUILLA
        </p>

        <h2>Reservas</h2>

        <p>
          Usuario:{' '}
          <strong>
            {usuario?.nombres}{' '}
            {usuario?.apellidos}
          </strong>
        </p>

        <p>
          Rol:{' '}
          <strong>
            {usuario?.rol?.nombre}
          </strong>
        </p>
      </section>

      <section className="buscador-reservas">
        <label htmlFor="buscar-reserva">
          Buscar reserva
        </label>

        <input
          id="buscar-reserva"
          type="text"
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
          placeholder="Código o nombre del cliente"
        />
      </section>

      {error && (
        <p className="mensaje-error">
          {error}
        </p>
      )}

      {!error &&
        reservasFiltradas.length === 0 && (
          <p>
            No se encontraron reservas.
          </p>
        )}

      <section className="lista-reservas-taquilla">
        {reservasFiltradas.map((reserva) => (
          <article
            key={reserva.id}
            className="tarjeta-reserva-taquilla"
          >
            <div>
              <h3>{reserva.codigo}</h3>

              <p>
                <strong>Estado:</strong>{' '}
                {obtenerTextoEstado(
                  reserva.estado,
                )}
              </p>
            </div>

            <p>
              <strong>Cliente:</strong>{' '}
              {reserva.usuario?.nombres}{' '}
              {reserva.usuario?.apellidos}
            </p>

            <p>
              <strong>Película:</strong>{' '}
              {reserva.funcion?.pelicula
                ?.titulo ?? 'No disponible'}
            </p>

            <p>
              <strong>Sala:</strong>{' '}
              {reserva.funcion?.sala
                ?.nombre ?? 'No disponible'}
            </p>

            <p>
              <strong>Formato:</strong>{' '}
              {reserva.funcion?.formato
                ?.nombre ?? 'No disponible'}
            </p>

            <p>
              <strong>Función:</strong>{' '}
              {formatearFecha(
                reserva.funcion?.inicia_en,
              )}
            </p>

            <p>
              <strong>Asientos:</strong>{' '}
              {obtenerAsientos(reserva)}
            </p>

            <p>
              <strong>Total:</strong>{' '}
              Q{Number(reserva.total).toFixed(2)}
            </p>

            <p>
              <strong>Vence:</strong>{' '}
              {formatearFecha(
                reserva.expira_en,
              )}
            </p>

            <Link
            to={`/taquilla/reservas/${reserva.id}`}
            >
            Atender reserva
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}

export default TaquillaReservas