import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

function AdminNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([])

  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false)

  const [procesandoId, setProcesandoId] =
    useState(null)

  const [
    notificacionSeleccionada,
    setNotificacionSeleccionada,
  ] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] =
    useState('TODOS')

  const [canalFiltro, setCanalFiltro] =
    useState('TODOS')

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const cargarNotificaciones = async () => {
    try {
      setCargando(true)
      setError('')

      const respuesta =
        await api.get('/notificaciones')

      setNotificaciones(
        respuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar las notificaciones.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
  }

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

  const obtenerNombreUsuario = (notificacion) => {
    const usuario =
      notificacion.usuario

    if (!usuario) {
      return '-'
    }

    return `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim()
  }

  const canalesDisponibles = useMemo(() => {
    return [
      ...new Set(
        notificaciones
          .map(
            (notificacion) =>
              notificacion.canal,
          )
          .filter(Boolean),
      ),
    ].sort()
  }, [notificaciones])

  const notificacionesFiltradas = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase()

    return notificaciones.filter(
      (notificacion) => {
        if (
          estadoFiltro !== 'TODOS'
          && notificacion.estado
            !== estadoFiltro
        ) {
          return false
        }

        if (
          canalFiltro !== 'TODOS'
          && notificacion.canal
            !== canalFiltro
        ) {
          return false
        }

        if (!termino) {
          return true
        }

        const usuario =
          obtenerNombreUsuario(
            notificacion,
          ).toLowerCase()

        const destinatario =
          (
            notificacion.destinatario
            ?? ''
          ).toLowerCase()

        const asunto =
          (
            notificacion.asunto
            ?? ''
          ).toLowerCase()

        const venta =
          (
            notificacion.venta
              ?.numero_venta
            ?? ''
          ).toLowerCase()

        const reserva =
          (
            notificacion.reserva
              ?.codigo
            ?? ''
          ).toLowerCase()

        const factura =
          (
            notificacion.factura
              ?.numero_interno
            ?? ''
          ).toLowerCase()

        const ticket =
          (
            notificacion.ticket
              ?.codigo
            ?? ''
          ).toLowerCase()

        return (
          usuario.includes(termino)
          || destinatario.includes(termino)
          || asunto.includes(termino)
          || venta.includes(termino)
          || reserva.includes(termino)
          || factura.includes(termino)
          || ticket.includes(termino)
        )
      },
    )
  }, [
    notificaciones,
    busqueda,
    estadoFiltro,
    canalFiltro,
  ])

  const procesarNotificacion = async (
    notificacion,
  ) => {
    if (
      notificacion.estado !== 'PENDIENTE'
    ) {
      return
    }

    const confirmar =
      window.confirm(
        `¿Deseas procesar la notificación #${notificacion.id}? El envío será simulado y quedará registrada como ENVIADA.`,
      )

    if (!confirmar) {
      return
    }

    try {
      setProcesandoId(
        notificacion.id,
      )

      limpiarMensajes()

      const respuesta =
        await api.post(
          '/notificaciones/procesar',
          {
            notificacion_id:
              notificacion.id,
          },
        )

      setMensaje(
        'Notificación procesada correctamente.',
      )

      setNotificacionSeleccionada(
        respuesta.data.data,
      )

      await cargarNotificaciones()

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
      setProcesandoId(null)
    }
  }

  const verDetalle = async (
    notificacion,
  ) => {
    try {
      setCargandoDetalle(true)
      setError('')

      const respuesta =
        await api.get(
          `/notificaciones/${notificacion.id}`,
        )

      setNotificacionSeleccionada(
        respuesta.data.data,
      )

      setTimeout(() => {
        document
          .getElementById(
            'admin-detalle-notificacion',
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 0)
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar el detalle de la notificación.',
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

  const obtenerClaseEstado = (
    estado,
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'admin-estado-pendiente'

      case 'ENVIADA':
        return 'admin-estado-enviada'

      case 'ERROR':
        return 'admin-estado-error'

      default:
        return ''
    }
  }

  const obtenerReferencia = (
    notificacion,
  ) => {
    if (
      notificacion.ticket
        ?.codigo
    ) {
      return {
        tipo: 'Ticket',
        valor:
          notificacion.ticket.codigo,
      }
    }

    if (
      notificacion.factura
        ?.numero_interno
    ) {
      return {
        tipo: 'Factura',
        valor:
          notificacion.factura
            .numero_interno,
      }
    }

    if (
      notificacion.venta
        ?.numero_venta
    ) {
      return {
        tipo: 'Venta',
        valor:
          notificacion.venta
            .numero_venta,
      }
    }

    if (
      notificacion.reserva
        ?.codigo
    ) {
      return {
        tipo: 'Reserva',
        valor:
          notificacion.reserva
            .codigo,
      }
    }

    return {
      tipo: 'Sin referencia',
      valor: '-',
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>
          Cargando notificaciones...
        </p>
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

          <h1>Notificaciones</h1>

          <p>
            Consulta y procesa las
            notificaciones generadas por
            Atlantic Cinema.
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
        <div className="admin-seccion-titulo">
          <div>
            <h2>
              Notificaciones registradas
            </h2>

            <p>
              {
                notificacionesFiltradas.length
              }
              {' '}
              notificación(es) mostrada(s).
            </p>
          </div>

          <div className="admin-filtros-notificaciones">
            <input
              className="admin-buscador"
              type="search"
              placeholder="Usuario, destinatario, referencia..."
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

              <option value="PENDIENTE">
                PENDIENTE
              </option>

              <option value="ENVIADA">
                ENVIADA
              </option>

              <option value="ERROR">
                ERROR
              </option>
            </select>

            <select
              value={canalFiltro}
              onChange={(event) =>
                setCanalFiltro(
                  event.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos los canales
              </option>

              {canalesDisponibles.map(
                (canal) => (
                  <option
                    key={canal}
                    value={canal}
                  >
                    {canal}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {notificacionesFiltradas.length
          === 0 ? (
          <p>
            No se encontraron
            notificaciones.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-notificaciones">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Canal</th>
                  <th>Destinatario</th>
                  <th>Asunto</th>
                  <th>Referencia</th>
                  <th>Estado</th>
                  <th>Enviada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {notificacionesFiltradas.map(
                  (notificacion) => {
                    const procesando =
                      procesandoId
                      === notificacion.id

                    const referencia =
                      obtenerReferencia(
                        notificacion,
                      )

                    return (
                      <tr
                        key={
                          notificacion.id
                        }
                      >
                        <td>
                          #
                          {notificacion.id}
                        </td>

                        <td>
                          <strong>
                            {obtenerNombreUsuario(
                              notificacion,
                            )}
                          </strong>

                          <small>
                            {
                              notificacion.usuario
                                ?.correo
                              ?? '-'
                            }
                          </small>
                        </td>

                        <td>
                          {
                            notificacion.canal
                          }
                        </td>

                        <td>
                          {
                            notificacion
                              .destinatario
                          }
                        </td>

                        <td>
                          {
                            notificacion.asunto
                            ?? '-'
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              referencia.tipo
                            }
                          </strong>

                          <small>
                            {
                              referencia.valor
                            }
                          </small>
                        </td>

                        <td>
                          <span
                            className={
                              obtenerClaseEstado(
                                notificacion
                                  .estado,
                              )
                            }
                          >
                            {
                              notificacion
                                .estado
                            }
                          </span>
                        </td>

                        <td>
                          {formatearFecha(
                            notificacion
                              .enviada_en,
                          )}
                        </td>

                        <td>
                          <div className="admin-tabla-acciones">
                            <button
                              type="button"
                              disabled={
                                procesando
                                || cargandoDetalle
                              }
                              onClick={() =>
                                verDetalle(
                                  notificacion,
                                )
                              }
                            >
                              Ver detalle
                            </button>

                            {notificacion.estado
                              === 'PENDIENTE' && (
                              <button
                                type="button"
                                disabled={
                                  procesando
                                }
                                onClick={() =>
                                  procesarNotificacion(
                                    notificacion,
                                  )
                                }
                              >
                                {procesando
                                  ? 'Procesando...'
                                  : 'Procesar'}
                              </button>
                            )}
                          </div>
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

      {notificacionSeleccionada && (
        <section
          className="admin-seccion"
          id="admin-detalle-notificacion"
        >
          <div className="admin-seccion-titulo">
            <div>
              <h2>
                Detalle de notificación
              </h2>

              <p>
                Notificación #
                {
                  notificacionSeleccionada
                    .id
                }
              </p>
            </div>

            <span
              className={
                obtenerClaseEstado(
                  notificacionSeleccionada
                    .estado,
                )
              }
            >
              {
                notificacionSeleccionada
                  .estado
              }
            </span>
          </div>

          <div className="admin-resumen-notificacion">
            <div>
              <span>Usuario</span>

              <strong>
                {obtenerNombreUsuario(
                  notificacionSeleccionada,
                )}
              </strong>
            </div>

            <div>
              <span>Canal</span>

              <strong>
                {
                  notificacionSeleccionada
                    .canal
                }
              </strong>
            </div>

            <div>
              <span>Destinatario</span>

              <strong>
                {
                  notificacionSeleccionada
                    .destinatario
                }
              </strong>
            </div>

            <div>
              <span>Estado</span>

              <strong>
                {
                  notificacionSeleccionada
                    .estado
                }
              </strong>
            </div>

            <div>
              <span>Enviada</span>

              <strong>
                {formatearFecha(
                  notificacionSeleccionada
                    .enviada_en,
                )}
              </strong>
            </div>

            <div>
              <span>Leída</span>

              <strong>
                {formatearFecha(
                  notificacionSeleccionada
                    .leida_en,
                )}
              </strong>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>Contenido</h3>

            <div className="admin-contenido-notificacion">
              <strong>
                {
                  notificacionSeleccionada
                    .asunto
                  ?? 'Sin asunto'
                }
              </strong>

              <p>
                {
                  notificacionSeleccionada
                    .mensaje
                  ?? 'Sin mensaje'
                }
              </p>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>
              Referencias relacionadas
            </h3>

            <div className="admin-resumen-notificacion">
              <div>
                <span>Venta</span>

                <strong>
                  {
                    notificacionSeleccionada
                      .venta?.numero_venta
                    ?? '-'
                  }
                </strong>
              </div>

              <div>
                <span>Reserva</span>

                <strong>
                  {
                    notificacionSeleccionada
                      .reserva?.codigo
                    ?? '-'
                  }
                </strong>
              </div>

              <div>
                <span>Factura</span>

                <strong>
                  {
                    notificacionSeleccionada
                      .factura
                      ?.numero_interno
                    ?? '-'
                  }
                </strong>
              </div>

              <div>
                <span>Ticket</span>

                <strong>
                  {
                    notificacionSeleccionada
                      .ticket?.codigo
                    ?? '-'
                  }
                </strong>
              </div>
            </div>
          </div>

          {notificacionSeleccionada.estado
            === 'PENDIENTE' && (
            <div className="admin-form-acciones">
              <button
                type="button"
                disabled={
                  procesandoId
                  === notificacionSeleccionada.id
                }
                onClick={() =>
                  procesarNotificacion(
                    notificacionSeleccionada,
                  )
                }
              >
                {procesandoId
                  === notificacionSeleccionada.id
                  ? 'Procesando...'
                  : 'Procesar notificación'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default AdminNotificaciones