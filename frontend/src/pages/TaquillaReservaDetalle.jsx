import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

function TaquillaReservaDetalle() {
  const { id } = useParams()

  const [reserva, setReserva] = useState(null)
  const [venta, setVenta] = useState(null)
  const [pago, setPago] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [procesandoVenta, setProcesandoVenta] = useState(false)
  const [procesandoPago, setProcesandoPago] = useState(false)
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

  const obtenerErrores = (err, mensajePredeterminado) => {
    const errores = err.response?.data?.errors

    if (errores) {
      return Object.values(errores)
        .flat()
        .join(' ')
    }

    return (
      err.response?.data?.message ||
      mensajePredeterminado
    )
  }

  const convertirEnVenta = async () => {
    setError('')
    setProcesandoVenta(true)

    try {
      const response = await api.post(
        '/ventas/desde-reserva',
        {
          reserva_id: reserva.id,
        },
      )

      const data = response.data.data ?? response.data

      setVenta(data)

      setReserva((actual) => ({
        ...actual,
        estado: 'CONVERTIDA',
      }))
    } catch (err) {
      setError(
        obtenerErrores(
          err,
          'No fue posible convertir la reserva en venta.',
        ),
      )
    } finally {
      setProcesandoVenta(false)
    }
  }

  const registrarPagoEfectivo = async () => {
    if (!venta) {
      setError(
        'Primero debe convertir la reserva en una venta.',
      )
      return
    }

    setError('')
    setProcesandoPago(true)

    try {
      const response = await api.post('/pagos', {
        venta_id: venta.id,
        metodo_pago_id: 1,
        descripcion:
          'Pago en efectivo registrado desde taquilla.',
      })

      const data = response.data.data ?? response.data

      setPago(data)

      setVenta((actual) => ({
        ...actual,
        estado: 'PAGADA',
      }))
    } catch (err) {
      setError(
        obtenerErrores(
          err,
          'No fue posible registrar el pago en efectivo.',
        ),
      )
    } finally {
      setProcesandoPago(false)
    }
  }

  if (cargando) {
    return (
      <main className="taquilla-reserva-detalle">
        <p>Cargando reserva...</p>
      </main>
    )
  }

  if (error && !reserva) {
    return (
      <main className="taquilla-reserva-detalle">
        <h1>Atlantic Cinema</h1>

        <p>{error}</p>

        <Link to="/taquilla/reservas">
          Volver a taquilla
        </Link>
      </main>
    )
  }

  if (!reserva) {
    return null
  }

  return (
    <main className="taquilla-reserva-detalle">
      <Link to="/taquilla/reservas">
        ← Volver a reservas de taquilla
      </Link>

      <h1>Atlantic Cinema</h1>

      <section className="tarjeta-cobro-taquilla">
        <p className="taquilla-etiqueta">
          TAQUILLA
        </p>

        <h2>{reserva.codigo}</h2>

        <p>
          <strong>Estado de reserva:</strong>{' '}
          {reserva.estado}
        </p>

        <hr />

        <p>
          <strong>Cliente:</strong>{' '}
          {reserva.usuario?.nombres}{' '}
          {reserva.usuario?.apellidos}
        </p>

        <p>
          <strong>Película:</strong>{' '}
          {reserva.funcion?.pelicula?.titulo}
        </p>

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
          {asientos.join(', ')}
        </p>

        <p>
          <strong>Vence:</strong>{' '}
          {formatearFecha(reserva.expira_en)}
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
          <strong>Total a cobrar:</strong>{' '}
          Q{Number(reserva.total).toFixed(2)}
        </p>

        {error && (
          <p className="mensaje-error">
            {error}
          </p>
        )}

        {reserva.estado === 'PENDIENTE' && !venta && (
          <button
            type="button"
            className="boton-taquilla"
            onClick={convertirEnVenta}
            disabled={procesandoVenta}
          >
            {procesandoVenta
              ? 'Creando venta...'
              : 'Convertir reserva en venta'}
          </button>
        )}

        {venta && (
          <section className="resultado-venta-taquilla">
            <h3>Venta creada</h3>

            <p>
              <strong>Número:</strong>{' '}
              {venta.numero_venta}
            </p>

            <p>
              <strong>Estado:</strong>{' '}
              {venta.estado}
            </p>

            <p>
              <strong>Total:</strong>{' '}
              Q{Number(venta.total).toFixed(2)}
            </p>

            {venta.estado === 'PENDIENTE' && (
              <button
                type="button"
                className="boton-taquilla"
                onClick={registrarPagoEfectivo}
                disabled={procesandoPago}
              >
                {procesandoPago
                  ? 'Registrando pago...'
                  : 'Registrar pago en efectivo'}
              </button>
            )}
          </section>
        )}

        {pago && (
          <section className="pago-taquilla-exitoso">
            <h3>Pago registrado correctamente</h3>

            <p>
              <strong>Estado:</strong>{' '}
              {pago.estado}
            </p>

            <p>
              <strong>Monto:</strong>{' '}
              Q{Number(pago.monto).toFixed(2)}
            </p>

            <p>
              La venta quedó pagada y las entradas
              se encuentran válidas.
            </p>
          </section>
        )}

        {reserva.estado === 'VENCIDA' && (
          <p>
            Esta reserva ya venció y no puede
            convertirse en venta.
          </p>
        )}

        {reserva.estado === 'CANCELADA' && (
          <p>
            Esta reserva se encuentra cancelada.
          </p>
        )}
      </section>
    </main>
  )
}

export default TaquillaReservaDetalle