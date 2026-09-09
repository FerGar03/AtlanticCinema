import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [ventas, setVentas] = useState([])

  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false)

  const [ticketSeleccionado, setTicketSeleccionado] =
    useState(null)

  const [ventaId, setVentaId] = useState('')
  const [tokenValidacion, setTokenValidacion] =
    useState('')

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] =
    useState('TODOS')

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')

      const [
        ticketsRespuesta,
        ventasRespuesta,
      ] = await Promise.all([
        api.get('/tickets'),
        api.get('/ventas'),
      ])

      setTickets(
        ticketsRespuesta.data.data ?? [],
      )

      setVentas(
        ventasRespuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar los tickets.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const obtenerPrimerError = (err) => {
    const errores =
      err.response?.data?.errors

    if (errores) {
      const primerError =
        Object.values(errores)?.[0]?.[0]

      if (primerError) {
        return primerError
      }
    }

    return (
      err.response?.data?.message
      ?? 'Ocurrió un error al procesar la solicitud.'
    )
  }

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
  }

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return '-'
    }

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    ).format(
      new Date(fecha),
    )
  }

  const obtenerCliente = (ticket) => {
    const cliente =
      ticket.entrada?.venta?.cliente

    if (!cliente) {
      return '-'
    }

    return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim()
  }

  const ventasDisponibles = useMemo(() => {
    return ventas.filter(
      (venta) =>
        venta.estado === 'PAGADA'
        && (venta.entradas?.length ?? 0) > 0,
    )
  }, [ventas])

  const ticketsFiltrados = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase()

    return tickets.filter((ticket) => {
      if (
        estadoFiltro !== 'TODOS'
        && ticket.estado !== estadoFiltro
      ) {
        return false
      }

      if (!termino) {
        return true
      }

      const codigo =
        (ticket.codigo ?? '')
          .toLowerCase()

      const cliente =
        obtenerCliente(ticket)
          .toLowerCase()

      const venta =
        (ticket.entrada?.venta?.numero_venta ?? '')
          .toLowerCase()

      const pelicula =
        (
          ticket.entrada?.funcion_asiento
            ?.funcion?.pelicula?.titulo
          ?? ''
        ).toLowerCase()

      return (
        codigo.includes(termino)
        || cliente.includes(termino)
        || venta.includes(termino)
        || pelicula.includes(termino)
      )
    })
  }, [
    tickets,
    busqueda,
    estadoFiltro,
  ])

  const generarTickets = async (event) => {
    event.preventDefault()

    try {
      setProcesando(true)
      limpiarMensajes()

      await api.post('/tickets', {
        venta_id: Number(ventaId),
      })

      setMensaje(
        'Tickets generados correctamente.',
      )

      setVentaId('')

      await cargarDatos()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(
        obtenerPrimerError(err),
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setProcesando(false)
    }
  }

  const validarTicket = async (event) => {
    event.preventDefault()

    if (!tokenValidacion.trim()) {
      return
    }

    const confirmar =
      window.confirm(
        '¿Confirmas la utilización de este ticket? La entrada quedará marcada como UTILIZADA.',
      )

    if (!confirmar) {
      return
    }

    try {
      setProcesando(true)
      limpiarMensajes()

      const respuesta =
        await api.post(
          '/tickets/validar',
          {
            token_validacion:
              tokenValidacion.trim(),
          },
        )

      setMensaje(
        'Ticket validado correctamente.',
      )

      setTicketSeleccionado(
        respuesta.data.data,
      )

      setTokenValidacion('')

      await cargarDatos()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(
        obtenerPrimerError(err),
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setProcesando(false)
    }
  }

  const verDetalle = async (ticket) => {
    try {
      setCargandoDetalle(true)
      setError('')

      const respuesta =
        await api.get(
          `/tickets/${ticket.id}`,
        )

      setTicketSeleccionado(
        respuesta.data.data,
      )

      setTimeout(() => {
        document
          .getElementById(
            'admin-detalle-ticket',
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 0)
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar el detalle del ticket.',
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'ACTIVO':
        return 'admin-estado-activo'

      case 'UTILIZADO':
        return 'admin-estado-utilizado'

      case 'CANCELADO':
        return 'admin-estado-cancelado'

      case 'INVALIDADO':
        return 'admin-estado-invalidado'

      default:
        return ''
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando tickets...</p>
      </div>
    )
  }

  return (
    <div className="admin-pagina">
      <div className="admin-pagina-encabezado">
        <div>
          <p className="admin-etiqueta">
            ADMINISTRACIÓN
          </p>

          <h1>Tickets</h1>

          <p>
            Genera, consulta y valida los
            tickets electrónicos de Atlantic Cinema.
          </p>
        </div>

        <Link
          to="/admin"
          className="admin-volver"
        >
          ← Volver al panel
        </Link>
      </div>

      {mensaje && (
        <div
          className="
            admin-mensaje
            admin-mensaje-exito
          "
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          className="
            admin-mensaje
            admin-mensaje-error
          "
        >
          {error}
        </div>
      )}

      <section className="admin-seccion">
        <h2>Generar tickets</h2>

        <form
          className="admin-formulario"
          onSubmit={generarTickets}
        >
          <div className="admin-form-grid">
            <label>
              Venta pagada
              <select
                value={ventaId}
                onChange={(event) =>
                  setVentaId(
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Seleccionar
                </option>

                {ventasDisponibles.map(
                  (venta) => (
                    <option
                      key={venta.id}
                      value={venta.id}
                    >
                      {venta.numero_venta}
                      {' · '}
                      {
                        venta.entradas?.length
                        ?? 0
                      }
                      {' entrada(s)'}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <p className="admin-ayuda">
            Si una entrada ya posee un ticket
            ACTIVO, el backend reutilizará ese
            ticket en lugar de duplicarlo.
          </p>

          <div className="admin-form-acciones">
            <button
              type="submit"
              disabled={procesando}
            >
              {procesando
                ? 'Procesando...'
                : 'Generar tickets'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-seccion">
        <h2>Validar ticket</h2>

        <form
          className="admin-formulario"
          onSubmit={validarTicket}
        >
          <label>
            Token de validación
            <input
              type="text"
              value={tokenValidacion}
              onChange={(event) =>
                setTokenValidacion(
                  event.target.value,
                )
              }
              placeholder="Ingrese o pegue el token..."
              required
            />
          </label>

          <p className="admin-ayuda">
            La validación cambia el ticket a
            UTILIZADO y la entrada asociada a
            UTILIZADA.
          </p>

          <div className="admin-form-acciones">
            <button
              type="submit"
              disabled={procesando}
            >
              Validar ticket
            </button>
          </div>
        </form>
      </section>

      <section className="admin-seccion">
        <div className="admin-seccion-titulo">
          <div>
            <h2>Tickets registrados</h2>

            <p>
              {ticketsFiltrados.length}
              {' '}
              ticket(s) mostrado(s).
            </p>
          </div>

          <div className="admin-filtros-tickets">
            <input
              className="admin-buscador"
              type="search"
              placeholder="Código, venta, cliente..."
              value={busqueda}
              onChange={(event) =>
                setBusqueda(
                  event.target.value,
                )
              }
            />

            <select
              value={estadoFiltro}
              onChange={(event) =>
                setEstadoFiltro(
                  event.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos los estados
              </option>

              <option value="ACTIVO">
                ACTIVO
              </option>

              <option value="UTILIZADO">
                UTILIZADO
              </option>

              <option value="CANCELADO">
                CANCELADO
              </option>

              <option value="INVALIDADO">
                INVALIDADO
              </option>
            </select>
          </div>
        </div>

        {ticketsFiltrados.length === 0 ? (
          <p>
            No se encontraron tickets.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-tickets">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Película</th>
                  <th>Asiento</th>
                  <th>Formato</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Generado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {ticketsFiltrados.map(
                  (ticket) => {
                    const asiento =
                      ticket.entrada
                        ?.funcion_asiento
                        ?.asiento

                    const funcion =
                      ticket.entrada
                        ?.funcion_asiento
                        ?.funcion

                    return (
                      <tr key={ticket.id}>
                        <td>
                          <strong>
                            {ticket.codigo}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {obtenerCliente(
                              ticket,
                            )}
                          </strong>

                          <small>
                            {
                              ticket.entrada
                                ?.venta?.cliente
                                ?.correo
                              ?? '-'
                            }
                          </small>
                        </td>

                        <td>
                          {
                            funcion?.pelicula
                              ?.titulo
                            ?? '-'
                          }
                        </td>

                        <td>
                          {asiento
                            ? `${asiento.fila}${asiento.numero}`
                            : '-'}
                        </td>

                        <td>
                          {ticket.formato}
                        </td>

                        <td>
                          #{ticket.version}
                        </td>

                        <td>
                          <span
                            className={
                              obtenerClaseEstado(
                                ticket.estado,
                              )
                            }
                          >
                            {ticket.estado}
                          </span>
                        </td>

                        <td>
                          {formatearFecha(
                            ticket.generado_en,
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            disabled={
                              cargandoDetalle
                            }
                            onClick={() =>
                              verDetalle(ticket)
                            }
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    )
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ticketSeleccionado && (
        <section
          className="admin-seccion"
          id="admin-detalle-ticket"
        >
          <div className="admin-seccion-titulo">
            <div>
              <h2>Detalle de ticket</h2>

              <p>
                {
                  ticketSeleccionado.codigo
                }
              </p>
            </div>

            <span
              className={
                obtenerClaseEstado(
                  ticketSeleccionado.estado,
                )
              }
            >
              {
                ticketSeleccionado.estado
              }
            </span>
          </div>

          <div className="admin-resumen-ticket">
            <div>
              <span>Venta</span>

              <strong>
                {
                  ticketSeleccionado.entrada
                    ?.venta?.numero_venta
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Cliente</span>

              <strong>
                {obtenerCliente(
                  ticketSeleccionado,
                )}
              </strong>
            </div>

            <div>
              <span>Película</span>

              <strong>
                {
                  ticketSeleccionado.entrada
                    ?.funcion_asiento
                    ?.funcion?.pelicula
                    ?.titulo
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Sala</span>

              <strong>
                {
                  ticketSeleccionado.entrada
                    ?.funcion_asiento
                    ?.funcion?.sala
                    ?.nombre
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Formato función</span>

              <strong>
                {
                  ticketSeleccionado.entrada
                    ?.funcion_asiento
                    ?.funcion?.formato
                    ?.nombre
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Asiento</span>

              <strong>
                {(() => {
                  const asiento =
                    ticketSeleccionado
                      .entrada
                      ?.funcion_asiento
                      ?.asiento

                  return asiento
                    ? `${asiento.fila}${asiento.numero}`
                    : '-'
                })()}
              </strong>
            </div>

            <div>
              <span>Versión</span>

              <strong>
                #
                {
                  ticketSeleccionado
                    .version
                }
              </strong>
            </div>

            <div>
              <span>Formato ticket</span>

              <strong>
                {
                  ticketSeleccionado.formato
                }
              </strong>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>Trazabilidad</h3>

            <div className="admin-resumen-ticket">
              <div>
                <span>Generado</span>

                <strong>
                  {formatearFecha(
                    ticketSeleccionado
                      .generado_en,
                  )}
                </strong>
              </div>

              <div>
                <span>Utilizado</span>

                <strong>
                  {formatearFecha(
                    ticketSeleccionado
                      .utilizado_en,
                  )}
                </strong>
              </div>

              <div>
                <span>Cancelado</span>

                <strong>
                  {formatearFecha(
                    ticketSeleccionado
                      .cancelado_en,
                  )}
                </strong>
              </div>

              <div>
                <span>Invalidado</span>

                <strong>
                  {formatearFecha(
                    ticketSeleccionado
                      .invalidado_en,
                  )}
                </strong>
              </div>
            </div>
          </div>

          {ticketSeleccionado
            .motivo_invalidacion && (
            <div className="admin-detalle-bloque">
              <div className="admin-motivo-cancelacion">
                <strong>
                  Motivo de invalidación
                </strong>

                <p>
                  {
                    ticketSeleccionado
                      .motivo_invalidacion
                  }
                </p>
              </div>
            </div>
          )}

          <div className="admin-detalle-bloque">
            <h3>Token de validación</h3>

            <div className="admin-token-ticket">
              {
                ticketSeleccionado
                  .token_validacion
              }
            </div>

            {ticketSeleccionado.estado
              === 'ACTIVO' && (
              <button
                type="button"
                onClick={() => {
                  setTokenValidacion(
                    ticketSeleccionado
                      .token_validacion,
                  )

                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  })
                }}
              >
                Usar este token para validar
              </button>
            )}
          </div>

          <div className="admin-detalle-bloque">
            <h3>Notificaciones</h3>

            {(ticketSeleccionado
              .notificaciones ?? []
            ).length === 0 ? (
              <p>
                No existen notificaciones
                asociadas.
              </p>
            ) : (
              <div className="admin-ticket-notificaciones">
                {(
                  ticketSeleccionado
                    .notificaciones
                  ?? []
                ).map(
                  (notificacion) => (
                    <div
                      key={
                        notificacion.id
                      }
                      className="admin-ticket-notificacion"
                    >
                      <strong>
                        {
                          notificacion.canal
                        }
                      </strong>

                      <span>
                        {
                          notificacion.estado
                        }
                      </span>

                      <small>
                        {
                          notificacion
                            .destinatario
                        }
                      </small>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AdminTickets