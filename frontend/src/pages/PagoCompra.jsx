import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useParams,
} from 'react-router-dom'
import api from '../services/api'

function PagoCompra() {
  const { ventaId } = useParams()

  const [venta, setVenta] = useState(null)
  const [pago, setPago] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [iniciandoPago, setIniciandoPago] = useState(false)
  const [confirmandoPago, setConfirmandoPago] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    const cargarVenta = async () => {
      try {
        const response = await api.get(
          `/ventas/${ventaId}`,
        )

        const data =
          response.data.data ??
          response.data

        setVenta(data)
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No fue posible cargar la compra.',
        )
      } finally {
        setCargando(false)
      }
    }

    cargarVenta()
  }, [ventaId])

  const asientos = useMemo(() => {
    if (!venta?.entradas) {
      return []
    }

    return venta.entradas
      .map((entrada) => {
        const asiento =
          entrada.funcion_asiento?.asiento ??
          entrada.funcionAsiento?.asiento

        if (!asiento) {
          return null
        }

        return `${asiento.fila}${asiento.numero}`
      })
      .filter(Boolean)
  }, [venta])

  const obtenerMensajeError = (
    err,
    mensajePredeterminado,
  ) => {
    const errores =
      err.response?.data?.errors

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

  const iniciarPago = async () => {
    setError('')
    setIniciandoPago(true)

    try {
      const response = await api.post(
        '/pagos',
        {
          venta_id: Number(ventaId),
          metodo_pago_id: 2,
          descripcion:
            'Pago con tarjeta iniciado desde compra web.',
        },
      )

      const data =
        response.data.data ??
        response.data

      setPago(data)
    } catch (err) {
      setError(
        obtenerMensajeError(
          err,
          'No fue posible iniciar el pago con tarjeta.',
        ),
      )
    } finally {
      setIniciandoPago(false)
    }
  }

  const confirmarPago = async (
    resultado,
  ) => {
    if (!pago) {
      return
    }

    setError('')
    setConfirmandoPago(true)

    try {
      const response = await api.post(
        `/pagos/${pago.id}/confirmar-simulacion`,
        {
          resultado,
        },
      )

      const data =
        response.data.data ??
        response.data

      setPago(data)

      if (resultado === 'APROBADO') {
        setVenta((actual) => ({
          ...actual,
          estado: 'PAGADA',
          pagada_en:
            data.venta?.pagada_en ??
            new Date().toISOString(),
        }))
      } else {
        setVenta((actual) => ({
          ...actual,
          estado: 'FALLIDA',
        }))
      }
    } catch (err) {
      setError(
        obtenerMensajeError(
          err,
          'No fue posible confirmar el pago.',
        ),
      )
    } finally {
      setConfirmandoPago(false)
    }
  }

  if (cargando) {
    return (
      <main className="pago-compra">
        <p>Cargando compra...</p>
      </main>
    )
  }

  if (error && !venta) {
    return (
      <main className="pago-compra">
        <h1>Atlantic Cinema</h1>

        <p className="mensaje-error">
          {error}
        </p>

        <Link to="/">
          Volver a cartelera
        </Link>
      </main>
    )
  }

  if (!venta) {
    return null
  }

  return (
    <main className="pago-compra">
      <Link to="/">
        ← Volver a cartelera
      </Link>

      <h1>Atlantic Cinema</h1>

      <section className="tarjeta-pago-compra">
        <p className="compra-etiqueta">
          COMPRA WEB
        </p>

        <h2>
          {venta.funcion?.pelicula?.titulo ??
            'Película'}
        </h2>

        <p>
          <strong>Venta:</strong>{' '}
          {venta.numero_venta}
        </p>

        <p>
          <strong>Estado:</strong>{' '}
          {venta.estado}
        </p>

        <hr />

        <p>
          <strong>Sala:</strong>{' '}
          {venta.funcion?.sala?.nombre ??
            'No disponible'}
        </p>

        <p>
          <strong>Formato:</strong>{' '}
          {venta.funcion?.formato?.nombre ??
            'No disponible'}
        </p>

        <p>
          <strong>Asientos:</strong>{' '}
          {asientos.length > 0
            ? asientos.join(', ')
            : 'No disponibles'}
        </p>

        <p>
          <strong>Entradas:</strong>{' '}
          {venta.entradas?.length ?? 0}
        </p>

        <hr />

        <p>
          <strong>Subtotal:</strong>{' '}
          Q
          {Number(
            venta.subtotal,
          ).toFixed(2)}
        </p>

        <p>
          <strong>Descuento:</strong>{' '}
          Q
          {Number(
            venta.descuento,
          ).toFixed(2)}
        </p>

        <p className="total-compra">
          <strong>Total:</strong>{' '}
          Q
          {Number(
            venta.total,
          ).toFixed(2)}
        </p>

        {error && (
          <p className="mensaje-error">
            {error}
          </p>
        )}

        {venta.estado === 'PENDIENTE' &&
          !pago && (
            <section className="seccion-pago-tarjeta">
              <h3>Pago con tarjeta</h3>

              <p>
                Los asientos permanecerán
                bloqueados mientras completas
                el pago.
              </p>

              <p>
                Para esta etapa del proyecto
                utilizaremos el proveedor de
                pago simulado.
              </p>

              <button
                type="button"
                onClick={iniciarPago}
                disabled={iniciandoPago}
              >
                {iniciandoPago
                  ? 'Iniciando pago...'
                  : 'Pagar con tarjeta'}
              </button>
            </section>
          )}

        {pago?.estado === 'PENDIENTE' && (
          <section className="simulador-pago">
            <h3>
              Simulador de tarjeta
            </h3>

            <p>
              Pago #{pago.id}
            </p>

            <p>
              <strong>Monto:</strong>{' '}
              Q
              {Number(
                pago.monto,
              ).toFixed(2)}
            </p>

            <p>
              Selecciona el resultado para
              simular la respuesta de la
              pasarela.
            </p>

            <div className="acciones-simulador">
              <button
                type="button"
                onClick={() =>
                  confirmarPago(
                    'APROBADO',
                  )
                }
                disabled={
                  confirmandoPago
                }
              >
                Aprobar pago
              </button>

              <button
                type="button"
                onClick={() =>
                  confirmarPago(
                    'RECHAZADO',
                  )
                }
                disabled={
                  confirmandoPago
                }
              >
                Rechazar pago
              </button>
            </div>
          </section>
        )}

        {pago?.estado === 'APROBADO' && (
          <section className="pago-exitoso">
            <h3>
              ¡Pago aprobado!
            </h3>

            <p>
              La compra fue realizada
              correctamente.
            </p>

            <p>
              <strong>Venta:</strong>{' '}
              {venta.numero_venta}
            </p>

            <p>
              <strong>Total pagado:</strong>{' '}
              Q
              {Number(
                venta.total,
              ).toFixed(2)}
            </p>

            <p>
              Tus entradas ya se encuentran
              válidas.
            </p>

            <Link to="/">
              Volver a cartelera
            </Link>
          </section>
        )}

        {pago?.estado === 'RECHAZADO' && (
          <section className="pago-rechazado">
            <h3>
              Pago rechazado
            </h3>

            <p>
              La compra no pudo completarse.
            </p>

            <p>
              Los asientos seleccionados
              fueron liberados.
            </p>

            <Link to="/">
              Volver a cartelera
            </Link>
          </section>
        )}

        {venta.estado === 'CANCELADA' && (
          <section className="pago-rechazado">
            <h3>
              Compra vencida
            </h3>

            <p>
              El tiempo disponible para
              completar el pago finalizó.
            </p>

            <p>
              Los asientos fueron liberados
              automáticamente.
            </p>

            <Link to="/">
              Realizar una nueva compra
            </Link>
          </section>
        )}
      </section>
    </main>
  )
}

export default PagoCompra