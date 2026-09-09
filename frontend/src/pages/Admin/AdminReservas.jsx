import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

function AdminReservas() {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState(null)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS')

  const [reservaSeleccionada, setReservaSeleccionada] =
    useState(null)

  const cargarReservas = async () => {
    try {
      setCargando(true)
      setError('')

      const respuesta =
        await api.get('/reservas')

      setReservas(
        respuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar las reservas.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarReservas()
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

  const formatearMonto = (monto) => {
    const valor =
      Number(monto ?? 0)

    return `Q${valor.toFixed(2)}`
  }

  const obtenerNombreCliente = (reserva) => {
    const usuario =
      reserva.usuario

    if (!usuario) {
      return 'Sin usuario'
    }

    return `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim()
  }

  const obtenerAsientos = (reserva) => {
    const detalles =
      reserva.detalles ?? []

    return detalles
      .map((detalle) => {
        const asiento =
          detalle.funcion_asiento?.asiento

        if (!asiento) {
          return null
        }

        return `${asiento.fila}${asiento.numero}`
      })
      .filter(Boolean)
  }

  const reservasFiltradas = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase()

    return reservas.filter((reserva) => {
      if (
        estadoFiltro !== 'TODOS'
        && reserva.estado !== estadoFiltro
      ) {
        return false
      }

      if (!termino) {
        return true
      }

      const cliente =
        obtenerNombreCliente(reserva)
          .toLowerCase()

      const correo =
        (reserva.usuario?.correo ?? '')
          .toLowerCase()

      const codigo =
        (reserva.codigo ?? '')
          .toLowerCase()

      const pelicula =
        (reserva.funcion?.pelicula?.titulo ?? '')
          .toLowerCase()

      const sala =
        (reserva.funcion?.sala?.nombre ?? '')
          .toLowerCase()

      return (
        cliente.includes(termino)
        || correo.includes(termino)
        || codigo.includes(termino)
        || pelicula.includes(termino)
        || sala.includes(termino)
      )
    })
  }, [
    reservas,
    busqueda,
    estadoFiltro,
  ])

  const seleccionarReserva = (
    reserva,
  ) => {
    limpiarMensajes()

    setReservaSeleccionada(
      reserva,
    )

    setTimeout(() => {
      document
        .getElementById(
          'admin-detalle-reserva',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 0)
  }

  const cancelarReserva = async (
    reserva,
  ) => {
    if (
      reserva.estado !== 'PENDIENTE'
    ) {
      return
    }

    const motivo = window.prompt(
      `Indica el motivo de cancelación de la reserva ${reserva.codigo}:`,
    )

    if (motivo === null) {
      return
    }

    if (
      motivo.trim().length < 5
    ) {
      setError(
        'El motivo de cancelación debe tener al menos 5 caracteres.',
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    const confirmar =
      window.confirm(
        `¿Confirmas la cancelación de la reserva ${reserva.codigo}? Los asientos reservados serán liberados.`,
      )

    if (!confirmar) {
      return
    }

    try {
      setProcesandoId(
        reserva.id,
      )

      limpiarMensajes()

      const respuesta =
        await api.post(
          `/reservas/${reserva.id}/cancelar`,
          {
            motivo_cancelacion:
              motivo.trim(),
          },
        )

      setMensaje(
        'Reserva cancelada correctamente.',
      )

      setReservaSeleccionada(
        respuesta.data.data,
      )

      await cargarReservas()

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

  const obtenerClaseEstado = (
    estado,
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'admin-estado-pendiente'

      case 'CONVERTIDA':
        return 'admin-estado-convertida'

      case 'CANCELADA':
        return 'admin-estado-cancelada'

      case 'VENCIDA':
        return 'admin-estado-vencida'

      default:
        return ''
    }
  }

  const obtenerClaseDetalle = (
    estado,
  ) => {
    switch (estado) {
      case 'RESERVADO':
        return 'admin-detalle-reservado'

      case 'CONVERTIDO':
        return 'admin-detalle-convertido'

      case 'LIBERADO':
        return 'admin-detalle-liberado'

      default:
        return ''
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando reservas...</p>
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

          <h1>Reservas</h1>

          <p>
            Consulta y administra las reservas
            realizadas en Atlantic Cinema.
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
              Reservas registradas
            </h2>

            <p>
              {reservasFiltradas.length}
              {' '}
              reserva(s) mostrada(s).
            </p>
          </div>

          <div className="admin-filtros-reservas">
            <input
              className="admin-buscador"
              type="search"
              placeholder="Código, cliente, película..."
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

              <option value="CONVERTIDA">
                CONVERTIDA
              </option>

              <option value="CANCELADA">
                CANCELADA
              </option>

              <option value="VENCIDA">
                VENCIDA
              </option>
            </select>
          </div>
        </div>

        {reservasFiltradas.length === 0 ? (
          <p>
            No se encontraron reservas.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-reservas">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Película</th>
                  <th>Función</th>
                  <th>Entradas</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Reservada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {reservasFiltradas.map(
                  (reserva) => {
                    const procesando =
                      procesandoId
                      === reserva.id

                    return (
                      <tr key={reserva.id}>
                        <td>
                          <strong>
                            {reserva.codigo}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {obtenerNombreCliente(
                              reserva,
                            )}
                          </strong>

                          <small>
                            {
                              reserva.usuario?.correo
                              ?? '-'
                            }
                          </small>
                        </td>

                        <td>
                          {
                            reserva.funcion?.pelicula
                              ?.titulo
                            ?? '-'
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              reserva.funcion?.sala
                                ?.nombre
                              ?? '-'
                            }
                          </strong>

                          <small>
                            {
                              reserva.funcion?.formato
                                ?.nombre
                              ?? '-'
                            }
                            {' · '}
                            {formatearFecha(
                              reserva.funcion
                                ?.inicia_en,
                            )}
                          </small>
                        </td>

                        <td>
                          {
                            reserva.cantidad_entradas
                          }
                        </td>

                        <td>
                          {formatearMonto(
                            reserva.total,
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              obtenerClaseEstado(
                                reserva.estado,
                              )
                            }
                          >
                            {reserva.estado}
                          </span>
                        </td>

                        <td>
                          {formatearFecha(
                            reserva.reservada_en,
                          )}
                        </td>

                        <td>
                          <div className="admin-tabla-acciones">
                            <button
                              type="button"
                              onClick={() =>
                                seleccionarReserva(
                                  reserva,
                                )
                              }
                              disabled={procesando}
                            >
                              Ver detalle
                            </button>

                            {reserva.estado
                              === 'PENDIENTE' && (
                              <button
                                type="button"
                                className="admin-boton-eliminar"
                                disabled={procesando}
                                onClick={() =>
                                  cancelarReserva(
                                    reserva,
                                  )
                                }
                              >
                                {procesando
                                  ? 'Procesando...'
                                  : 'Cancelar'}
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

      {reservaSeleccionada && (
        <section
          className="admin-seccion"
          id="admin-detalle-reserva"
        >
          <div className="admin-seccion-titulo">
            <div>
              <h2>
                Detalle de reserva
              </h2>

              <p>
                {
                  reservaSeleccionada.codigo
                }
              </p>
            </div>

            <span
              className={
                obtenerClaseEstado(
                  reservaSeleccionada.estado,
                )
              }
            >
              {
                reservaSeleccionada.estado
              }
            </span>
          </div>

          <div className="admin-resumen-reserva">
            <div>
              <span>Cliente</span>

              <strong>
                {obtenerNombreCliente(
                  reservaSeleccionada,
                )}
              </strong>

              <small>
                {
                  reservaSeleccionada.usuario
                    ?.correo
                  ?? '-'
                }
              </small>
            </div>

            <div>
              <span>Película</span>

              <strong>
                {
                  reservaSeleccionada.funcion
                    ?.pelicula?.titulo
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Sala</span>

              <strong>
                {
                  reservaSeleccionada.funcion
                    ?.sala?.nombre
                  ?? '-'
                }
              </strong>

              <small>
                {
                  reservaSeleccionada.funcion
                    ?.formato?.nombre
                  ?? '-'
                }
              </small>
            </div>

            <div>
              <span>Función</span>

              <strong>
                {formatearFecha(
                  reservaSeleccionada.funcion
                    ?.inicia_en,
                )}
              </strong>
            </div>

            <div>
              <span>Subtotal</span>

              <strong>
                {formatearMonto(
                  reservaSeleccionada.subtotal,
                )}
              </strong>
            </div>

            <div>
              <span>Descuento</span>

              <strong>
                {formatearMonto(
                  reservaSeleccionada.descuento,
                )}
              </strong>
            </div>

            <div>
              <span>Total</span>

              <strong>
                {formatearMonto(
                  reservaSeleccionada.total,
                )}
              </strong>
            </div>

            <div>
              <span>Expira</span>

              <strong>
                {formatearFecha(
                  reservaSeleccionada.expira_en,
                )}
              </strong>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>Asientos</h3>

            <div className="admin-reserva-asientos">
              {(
                reservaSeleccionada.detalles
                ?? []
              ).map((detalle) => {
                const asiento =
                  detalle.funcion_asiento
                    ?.asiento

                return (
                  <div
                    key={detalle.id}
                    className="admin-reserva-asiento"
                  >
                    <strong>
                      {asiento
                        ? `${asiento.fila}${asiento.numero}`
                        : 'Sin asiento'}
                    </strong>

                    <span>
                      {formatearMonto(
                        detalle.precio,
                      )}
                    </span>

                    <small
                      className={
                        obtenerClaseDetalle(
                          detalle.estado,
                        )
                      }
                    >
                      {detalle.estado}
                    </small>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>
              Fechas y trazabilidad
            </h3>

            <div className="admin-resumen-reserva">
              <div>
                <span>
                  Reservada
                </span>

                <strong>
                  {formatearFecha(
                    reservaSeleccionada
                      .reservada_en,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Expiración
                </span>

                <strong>
                  {formatearFecha(
                    reservaSeleccionada
                      .expira_en,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Convertida
                </span>

                <strong>
                  {formatearFecha(
                    reservaSeleccionada
                      .convertida_en,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Cancelada
                </span>

                <strong>
                  {formatearFecha(
                    reservaSeleccionada
                      .cancelada_en,
                  )}
                </strong>
              </div>
            </div>

            {reservaSeleccionada
              .motivo_cancelacion && (
              <div className="admin-motivo-cancelacion">
                <strong>
                  Motivo de cancelación
                </strong>

                <p>
                  {
                    reservaSeleccionada
                      .motivo_cancelacion
                  }
                </p>
              </div>
            )}

            {reservaSeleccionada.venta && (
              <div className="admin-venta-relacionada">
                <strong>
                  Venta relacionada
                </strong>

                <p>
                  Venta #
                  {
                    reservaSeleccionada
                      .venta.id
                  }
                </p>
              </div>
            )}
          </div>

          {reservaSeleccionada.estado
            === 'PENDIENTE' && (
            <div className="admin-form-acciones">
              <button
                type="button"
                className="admin-boton-eliminar"
                disabled={
                  procesandoId
                  === reservaSeleccionada.id
                }
                onClick={() =>
                  cancelarReserva(
                    reservaSeleccionada,
                  )
                }
              >
                Cancelar reserva
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default AdminReservas