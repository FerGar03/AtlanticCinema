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
import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function ReservaDetalle() {
  const { id } = useParams()

  const [reserva, setReserva] =
    useState(null)

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')

  const [
    codigoCopiado,
    setCodigoCopiado,
  ] = useState(false)

  useEffect(() => {
    const cargarReserva =
      async () => {
        try {
          const response =
            await api.get(
              `/reservas/${id}`
            )

          const data =
            response.data.data
            ?? response.data

          setReserva(data)
        } catch (err) {
          setError(
            err.response?.data?.message
            || 'No fue posible cargar la reserva.'
          )
        } finally {
          setCargando(false)
        }
      }

    cargarReserva()
  }, [id])

  const asientos =
    useMemo(() => {
      if (!reserva?.detalles) {
        return []
      }

      return reserva.detalles
        .map((detalle) => {
          const asiento =
            detalle.funcion_asiento
              ?.asiento
            ?? detalle.funcionAsiento
              ?.asiento

          if (!asiento) {
            return null
          }

          return `${asiento.fila}${asiento.numero}`
        })
        .filter(Boolean)
    }, [reserva])

  const formatearFecha = (
    fecha
  ) => {
    if (!fecha) {
      return 'No disponible'
    }

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        timeZone:
          'America/Guatemala',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    ).format(
      new Date(fecha)
    )
  }

  const obtenerTextoEstado = (
    estado
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente'

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

  const obtenerClaseEstado = (
    estado
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'reserva-estado reserva-estado-pendiente'

      case 'CONVERTIDA':
        return 'reserva-estado reserva-estado-confirmada'

      case 'VENCIDA':
        return 'reserva-estado reserva-estado-vencida'

      case 'CANCELADA':
        return 'reserva-estado reserva-estado-cancelada'

      default:
        return 'reserva-estado'
    }
  }

  const copiarCodigo =
    async () => {
      if (!reserva?.codigo) {
        return
      }

      try {
        await navigator.clipboard.writeText(
          reserva.codigo
        )

        setCodigoCopiado(true)

        window.setTimeout(
          () => {
            setCodigoCopiado(false)
          },
          2200
        )
      } catch {
        setCodigoCopiado(false)
      }
    }

  if (cargando) {
    return (
      <main className="reserva-cargando">
        <div className="cartelera-spinner" />

        <p>
          Cargando tu reserva...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="reserva-error-pagina">
        <section className="reserva-error-card">
          <div className="reserva-error-icono">
            !
          </div>

          <span className="reserva-etiqueta-superior">
            RESERVA
          </span>

          <h1>
            No pudimos cargar tu reserva
          </h1>

          <p>
            {error}
          </p>

          <Link
            to="/"
            className="reserva-boton-principal"
          >
            Volver a la cartelera
          </Link>
        </section>
      </main>
    )
  }

  if (!reserva) {
    return null
  }

  const pendiente =
    reserva.estado === 'PENDIENTE'

  const vencida =
    reserva.estado === 'VENCIDA'

  const cancelada =
    reserva.estado === 'CANCELADA'

  const confirmada =
    reserva.estado === 'CONVERTIDA'

  const imagenPelicula =
    reserva.funcion?.pelicula
      ?.imagen_url

  return (
    <main className="reserva-pagina">
      <header className="reserva-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="reserva-logo-contenedor">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="reserva-logo-imagen"
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

        <Link
          to="/"
          className="reserva-volver"
        >
          ← Volver a cartelera
        </Link>
      </header>

      <section className="reserva-contenido">
        <div className="reserva-cabecera">
          <div>
            <span className="reserva-etiqueta-superior">
              TU RESERVA
            </span>

            <h1>
              {confirmada
                ? 'Reserva confirmada'
                : pendiente
                  ? '¡Reserva realizada!'
                  : vencida
                    ? 'Reserva vencida'
                    : cancelada
                      ? 'Reserva cancelada'
                      : 'Detalle de reserva'}
            </h1>

            <p>
              {pendiente
                ? 'Presenta tu código en taquilla antes de que venza la reserva.'
                : confirmada
                  ? 'La reserva ya fue convertida en una venta.'
                  : vencida
                    ? 'El tiempo disponible para completar esta reserva finalizó.'
                    : cancelada
                      ? 'Esta reserva ya no se encuentra activa.'
                      : 'Consulta los datos asociados a tu reserva.'}
            </p>
          </div>

          <span
            className={
              obtenerClaseEstado(
                reserva.estado
              )
            }
          >
            {obtenerTextoEstado(
              reserva.estado
            )}
          </span>
        </div>

        <div className="reserva-layout">
          <section className="reserva-card-principal">
            <div className="reserva-codigo-bloque reserva-codigo-final">
              <div>
                <span>
                  CÓDIGO DE RESERVA
                </span>

                <strong>
                  {reserva.codigo}
                </strong>

                {pendiente && (
                  <small>
                    Presenta este código
                    en la taquilla de
                    Atlantic Cinema.
                  </small>
                )}
              </div>

              <div className="reserva-codigo-acciones">
                <button
                  type="button"
                  className="reserva-copiar-codigo"
                  onClick={
                    copiarCodigo
                  }
                >
                  {codigoCopiado
                    ? '✓ Código copiado'
                    : 'Copiar código'}
                </button>
              </div>
            </div>

            <div
              className={`reserva-pelicula reserva-pelicula-final ${
                imagenPelicula
                  ? 'con-imagen'
                  : ''
              }`}
            >
              {imagenPelicula && (
                <>
                  <img
                    src={
                      imagenPelicula
                    }
                    alt=""
                    className="reserva-pelicula-fondo"
                  />

                  <div className="reserva-pelicula-overlay" />
                </>
              )}

              <div className="reserva-pelicula-contenido">
                <span>
                  PELÍCULA
                </span>

                <h2>
                  {reserva.funcion?.pelicula
                    ?.titulo
                    ?? 'Película'}
                </h2>
              </div>
            </div>

            <div className="reserva-datos-grid">
              <div>
                <span>
                  Sala
                </span>

                <strong>
                  {reserva.funcion?.sala
                    ?.nombre
                    ?? 'No disponible'}
                </strong>
              </div>

              <div>
                <span>
                  Formato
                </span>

                <strong>
                  {reserva.funcion
                    ?.formato
                    ?.nombre
                    ?? 'No disponible'}
                </strong>
              </div>

              <div>
                <span>
                  Función
                </span>

                <strong>
                  {formatearFecha(
                    reserva.funcion
                      ?.inicia_en
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Entradas
                </span>

                <strong>
                  {reserva.cantidad_entradas}
                </strong>
              </div>
            </div>

            <div className="reserva-asientos-seccion">
              <div className="reserva-seccion-titulo">
                <span>
                  Asientos
                </span>

                <strong>
                  {asientos.length}
                </strong>
              </div>

              {asientos.length > 0 ? (
                <div className="reserva-asientos-lista">
                  {asientos.map(
                    (asiento) => (
                      <span
                        key={asiento}
                      >
                        {asiento}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No hay información de
                  asientos disponible.
                </p>
              )}
            </div>

            <div className="reserva-fechas reserva-fechas-final">
              <div>
                <span>
                  Reservada
                </span>

                <strong>
                  {formatearFecha(
                    reserva.reservada_en
                  )}
                </strong>
              </div>

              <div
                className={
                  pendiente
                    ? 'reserva-fecha-vencimiento'
                    : ''
                }
              >
                <span>
                  Vence
                </span>

                <strong>
                  {formatearFecha(
                    reserva.expira_en
                  )}
                </strong>
              </div>
            </div>
          </section>

          <aside className="reserva-resumen">
            <span className="reserva-etiqueta-superior">
              RESUMEN
            </span>

            <h2>
              Total de la reserva
            </h2>

            <div className="reserva-precios">
              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  Q
                  {Number(
                    reserva.subtotal
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Descuento
                </span>

                <strong>
                  Q
                  {Number(
                    reserva.descuento
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="reserva-total">
              <span>
                Total
              </span>

              <strong>
                Q
                {Number(
                  reserva.total
                ).toFixed(2)}
              </strong>
            </div>

            {pendiente && (
              <div className="reserva-aviso reserva-aviso-pendiente">
                <strong>
                  Pago en taquilla
                </strong>

                <p>
                  Presenta el código de
                  reserva antes de la fecha
                  y hora de vencimiento.
                </p>

                <p>
                  La reserva se confirmará
                  cuando el personal registre
                  el pago.
                </p>

                <p>
                  Si vence antes de ser
                  confirmada, los asientos
                  serán liberados
                  automáticamente.
                </p>
              </div>
            )}

            {confirmada && (
              <div className="reserva-aviso reserva-aviso-confirmada">
                <strong>
                  Reserva confirmada
                </strong>

                <p>
                  Esta reserva ya fue
                  convertida en una venta.
                </p>
              </div>
            )}

            {vencida && (
              <div className="reserva-aviso reserva-aviso-vencida">
                <strong>
                  Reserva vencida
                </strong>

                <p>
                  Los asientos asociados ya
                  fueron liberados y pueden
                  ser seleccionados
                  nuevamente.
                </p>
              </div>
            )}

            {cancelada && (
              <div className="reserva-aviso reserva-aviso-cancelada">
                <strong>
                  Reserva cancelada
                </strong>

                <p>
                  Esta reserva ya no se
                  encuentra disponible para
                  continuar el proceso.
                </p>
              </div>
            )}

            {(vencida || cancelada) && (
              <Link
                to="/"
                className="reserva-boton-principal"
              >
                Seleccionar otra función
              </Link>
            )}

            {pendiente && (
              <Link
                to="/"
                className="reserva-boton-secundario"
              >
                Volver a la cartelera
              </Link>
            )}

            <small className="reserva-nota">
              Conserva tu código de reserva
              hasta completar el proceso en
              taquilla.
            </small>
          </aside>
        </div>
      </section>

      <footer className="cartelera-footer">
        <div className="cartelera-footer-marca">
          <div className="reserva-logo-contenedor reserva-logo-footer">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="reserva-logo-imagen"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <span>
              Tu cine, tu experiencia.
            </span>
          </div>
        </div>

        <small>
          © 2026 Atlantic Cinema
        </small>
      </footer>
    </main>
  )
}

export default ReservaDetalle