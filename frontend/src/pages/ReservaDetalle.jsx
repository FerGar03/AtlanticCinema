import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

function ReservaDetalle() {
  const { id } = useParams()

  const [reserva, setReserva] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarReserva = async () => {
      try {
        const response = await api.get(`/reservas/${id}`)
        const data = response.data.data ?? response.data

        setReserva(data)
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No fue posible cargar la reserva.',
        )
      } finally {
        setCargando(false)
      }
    }

    cargarReserva()
  }, [id])

  const asientos = useMemo(() => {
    if (!reserva?.detalles) {
      return []
    }

    return reserva.detalles
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
  }, [reserva])

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
        return 'Pendiente de pago en taquilla'

      case 'VENCIDA':
        return 'Reserva vencida'

      case 'CANCELADA':
        return 'Reserva cancelada'

      case 'CONVERTIDA':
        return 'Reserva confirmada'

      default:
        return estado
    }
  }

  if (cargando) {
    return (
      <main className="reserva-detalle">
        <p>Cargando reserva...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="reserva-detalle">
        <h1>Atlantic Cinema</h1>

        <p>{error}</p>

        <Link to="/">
          Volver a cartelera
        </Link>
      </main>
    )
  }

  if (!reserva) {
    return null
  }

  return (
    <main className="reserva-detalle">
      <Link to="/">
        ← Volver a cartelera
      </Link>

      <h1>Atlantic Cinema</h1>

      <section className="tarjeta-reserva">
        <p className="reserva-etiqueta">
          RESERVA
        </p>

        <h2>
          {reserva.funcion?.pelicula?.titulo ??
            'Película'}
        </h2>

        <p>
          <strong>Código:</strong>{' '}
          {reserva.codigo}
        </p>

        <p>
          <strong>Estado:</strong>{' '}
          {obtenerTextoEstado(reserva.estado)}
        </p>

        <hr />

        <p>
          <strong>Sala:</strong>{' '}
          {reserva.funcion?.sala?.nombre}
        </p>

        <p>
          <strong>Formato:</strong>{' '}
          {reserva.funcion?.formato?.nombre}
        </p>

        <p>
          <strong>Función:</strong>{' '}
          {formatearFecha(
            reserva.funcion?.inicia_en,
          )}
        </p>

        <p>
          <strong>Asientos:</strong>{' '}
          {asientos.length > 0
            ? asientos.join(', ')
            : 'No disponibles'}
        </p>

        <p>
          <strong>Entradas:</strong>{' '}
          {reserva.cantidad_entradas}
        </p>

        <hr />

        <p>
          <strong>Subtotal:</strong>{' '}
          Q{Number(reserva.subtotal).toFixed(2)}
        </p>

        <p>
          <strong>Descuento:</strong>{' '}
          Q{Number(reserva.descuento).toFixed(2)}
        </p>

        <p className="total-reserva">
          <strong>Total:</strong>{' '}
          Q{Number(reserva.total).toFixed(2)}
        </p>

        <p>
          <strong>Reservada:</strong>{' '}
          {formatearFecha(reserva.reservada_en)}
        </p>

        <p>
          <strong>Vence:</strong>{' '}
          {formatearFecha(reserva.expira_en)}
        </p>

        {reserva.estado === 'PENDIENTE' && (
          <section className="instrucciones-taquilla">
            <h3>Pago en taquilla</h3>

            <p>
              Presenta el código de esta reserva en la
              taquilla de Atlantic Cinema antes de la
              fecha y hora de vencimiento.
            </p>

            <p>
              La reserva se confirmará cuando el personal
              registre el pago en taquilla.
            </p>

            <p>
              Si la reserva vence antes de ser confirmada,
              los asientos serán liberados automáticamente.
            </p>
          </section>
        )}

        {reserva.estado === 'VENCIDA' && (
          <section className="reserva-vencida">
            <h3>Esta reserva ha vencido</h3>

            <p>
              Los asientos asociados a esta reserva ya
              fueron liberados y pueden ser seleccionados
              nuevamente.
            </p>

            <Link to="/">
              Realizar una nueva reserva
            </Link>
          </section>
        )}

        {reserva.estado === 'CONVERTIDA' && (
          <section className="reserva-confirmada">
            <h3>Reserva confirmada</h3>

            <p>
              Esta reserva ya fue convertida en una venta.
            </p>
          </section>
        )}
      </section>
    </main>
  )
}

export default ReservaDetalle