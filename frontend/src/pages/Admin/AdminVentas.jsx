import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

function AdminVentas() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false)

  const [ventaSeleccionada, setVentaSeleccionada] =
    useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] =
    useState('TODOS')

  const [origenFiltro, setOrigenFiltro] =
    useState('TODOS')

  const [error, setError] = useState('')

  const cargarVentas = async () => {
    try {
      setCargando(true)
      setError('')

      const respuesta =
        await api.get('/ventas')

      setVentas(
        respuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar las ventas.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarVentas()
  }, [])

  const obtenerNombreCliente = (venta) => {
    if (!venta.cliente) {
      return 'Sin cliente'
    }

    return `${venta.cliente.nombres ?? ''} ${venta.cliente.apellidos ?? ''}`.trim()
  }

  const obtenerNombreEmpleado = (venta) => {
    if (!venta.empleado) {
      return '-'
    }

    return `${venta.empleado.nombres ?? ''} ${venta.empleado.apellidos ?? ''}`.trim()
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

  const formatearMonto = (valor) => {
    return `Q${Number(valor ?? 0).toFixed(2)}`
  }

  const obtenerAsientos = (venta) => {
    return (venta.entradas ?? [])
      .map((entrada) => {
        const asiento =
          entrada.funcion_asiento?.asiento

        if (!asiento) {
          return null
        }

        return `${asiento.fila}${asiento.numero}`
      })
      .filter(Boolean)
  }

  const ventasFiltradas = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase()

    return ventas.filter((venta) => {
      if (
        estadoFiltro !== 'TODOS'
        && venta.estado !== estadoFiltro
      ) {
        return false
      }

      if (
        origenFiltro !== 'TODOS'
        && venta.origen !== origenFiltro
      ) {
        return false
      }

      if (!termino) {
        return true
      }

      const numero =
        (venta.numero_venta ?? '')
          .toLowerCase()

      const cliente =
        obtenerNombreCliente(venta)
          .toLowerCase()

      const correo =
        (venta.cliente?.correo ?? '')
          .toLowerCase()

      const pelicula =
        (venta.funcion?.pelicula?.titulo ?? '')
          .toLowerCase()

      const sala =
        (venta.funcion?.sala?.nombre ?? '')
          .toLowerCase()

      const reserva =
        (venta.reserva?.codigo ?? '')
          .toLowerCase()

      return (
        numero.includes(termino)
        || cliente.includes(termino)
        || correo.includes(termino)
        || pelicula.includes(termino)
        || sala.includes(termino)
        || reserva.includes(termino)
      )
    })
  }, [
    ventas,
    busqueda,
    estadoFiltro,
    origenFiltro,
  ])

  const verDetalle = async (venta) => {
    try {
      setCargandoDetalle(true)
      setError('')

      const respuesta =
        await api.get(
          `/ventas/${venta.id}`,
        )

      setVentaSeleccionada(
        respuesta.data.data,
      )

      setTimeout(() => {
        document
          .getElementById(
            'admin-detalle-venta',
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 0)
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar el detalle de la venta.',
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'admin-estado-pendiente'

      case 'PAGADA':
        return 'admin-estado-pagada'

      case 'CANCELADA':
        return 'admin-estado-cancelada'

      case 'FALLIDA':
        return 'admin-estado-fallida'

      default:
        return ''
    }
  }

  const obtenerClaseEntrada = (estado) => {
    switch (estado) {
      case 'VALIDA':
        return 'admin-entrada-valida'

      case 'PENDIENTE':
        return 'admin-entrada-pendiente'

      case 'UTILIZADA':
        return 'admin-entrada-utilizada'

      case 'CANCELADA':
        return 'admin-entrada-cancelada'

      case 'REEMBOLSADA':
        return 'admin-entrada-reembolsada'

      default:
        return ''
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando ventas...</p>
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

          <h1>Ventas</h1>

          <p>
            Consulta el historial y la
            trazabilidad de las ventas de
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
              Ventas registradas
            </h2>

            <p>
              {ventasFiltradas.length}
              {' '}
              venta(s) mostrada(s).
            </p>
          </div>

          <div className="admin-filtros-ventas">
            <input
              className="admin-buscador"
              type="search"
              placeholder="Venta, cliente, película..."
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

              <option value="PAGADA">
                PAGADA
              </option>

              <option value="CANCELADA">
                CANCELADA
              </option>

              <option value="FALLIDA">
                FALLIDA
              </option>
            </select>

            <select
              value={origenFiltro}
              onChange={(event) =>
                setOrigenFiltro(
                  event.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos los orígenes
              </option>

              <option value="RESERVA">
                RESERVA
              </option>

              <option value="COMPRA_WEB">
                COMPRA WEB
              </option>
            </select>
          </div>
        </div>

        {ventasFiltradas.length === 0 ? (
          <p>
            No se encontraron ventas.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-ventas">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Película</th>
                  <th>Origen</th>
                  <th>Entradas</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Realizada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {ventasFiltradas.map(
                  (venta) => (
                    <tr key={venta.id}>
                      <td>
                        <strong>
                          {venta.numero_venta}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {obtenerNombreCliente(
                            venta,
                          )}
                        </strong>

                        <small>
                          {
                            venta.cliente?.correo
                            ?? '-'
                          }
                        </small>
                      </td>

                      <td>
                        {
                          venta.funcion?.pelicula
                            ?.titulo
                          ?? '-'
                        }

                        <small>
                          {
                            venta.funcion?.sala
                              ?.nombre
                            ?? '-'
                          }
                        </small>
                      </td>

                      <td>
                        {venta.origen}
                      </td>

                      <td>
                        {
                          venta.entradas?.length
                          ?? 0
                        }
                      </td>

                      <td>
                        {formatearMonto(
                          venta.total,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            obtenerClaseEstado(
                              venta.estado,
                            )
                          }
                        >
                          {venta.estado}
                        </span>
                      </td>

                      <td>
                        {formatearFecha(
                          venta.realizada_en,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            verDetalle(venta)
                          }
                          disabled={
                            cargandoDetalle
                          }
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ventaSeleccionada && (
        <section
          className="admin-seccion"
          id="admin-detalle-venta"
        >
          <div className="admin-seccion-titulo">
            <div>
              <h2>
                Detalle de venta
              </h2>

              <p>
                {
                  ventaSeleccionada
                    .numero_venta
                }
              </p>
            </div>

            <span
              className={
                obtenerClaseEstado(
                  ventaSeleccionada.estado,
                )
              }
            >
              {ventaSeleccionada.estado}
            </span>
          </div>

          <div className="admin-resumen-venta">
            <div>
              <span>Cliente</span>

              <strong>
                {obtenerNombreCliente(
                  ventaSeleccionada,
                )}
              </strong>

              <small>
                {
                  ventaSeleccionada.cliente
                    ?.correo
                  ?? '-'
                }
              </small>
            </div>

            <div>
              <span>Empleado</span>

              <strong>
                {obtenerNombreEmpleado(
                  ventaSeleccionada,
                )}
              </strong>
            </div>

            <div>
              <span>Origen</span>

              <strong>
                {
                  ventaSeleccionada.origen
                }
              </strong>
            </div>

            <div>
              <span>Reserva</span>

              <strong>
                {
                  ventaSeleccionada.reserva
                    ?.codigo
                  ?? 'Compra directa'
                }
              </strong>
            </div>

            <div>
              <span>Película</span>

              <strong>
                {
                  ventaSeleccionada.funcion
                    ?.pelicula?.titulo
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Sala</span>

              <strong>
                {
                  ventaSeleccionada.funcion
                    ?.sala?.nombre
                  ?? '-'
                }
              </strong>

              <small>
                {
                  ventaSeleccionada.funcion
                    ?.formato?.nombre
                  ?? '-'
                }
              </small>
            </div>

            <div>
              <span>Función</span>

              <strong>
                {formatearFecha(
                  ventaSeleccionada.funcion
                    ?.inicia_en,
                )}
              </strong>
            </div>

            <div>
              <span>Entradas</span>

              <strong>
                {
                  ventaSeleccionada.entradas
                    ?.length
                  ?? 0
                }
              </strong>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>Información económica</h3>

            <div className="admin-resumen-venta">
              <div>
                <span>Subtotal</span>

                <strong>
                  {formatearMonto(
                    ventaSeleccionada
                      .subtotal,
                  )}
                </strong>
              </div>

              <div>
                <span>Descuento</span>

                <strong>
                  {formatearMonto(
                    ventaSeleccionada
                      .descuento,
                  )}
                </strong>
              </div>

              <div>
                <span>Total</span>

                <strong>
                  {formatearMonto(
                    ventaSeleccionada.total,
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>Entradas y asientos</h3>

            <div className="admin-venta-entradas">
              {(
                ventaSeleccionada.entradas
                ?? []
              ).map((entrada) => {
                const asiento =
                  entrada.funcion_asiento
                    ?.asiento

                return (
                  <div
                    key={entrada.id}
                    className="admin-venta-entrada"
                  >
                    <strong>
                      {asiento
                        ? `${asiento.fila}${asiento.numero}`
                        : 'Sin asiento'}
                    </strong>

                    <span>
                      {formatearMonto(
                        entrada.precio,
                      )}
                    </span>

                    <small>
                      {entrada.codigo}
                    </small>

                    <span
                      className={
                        obtenerClaseEntrada(
                          entrada.estado,
                        )
                      }
                    >
                      {entrada.estado}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>
              Fechas y trazabilidad
            </h3>

            <div className="admin-resumen-venta">
              <div>
                <span>Realizada</span>

                <strong>
                  {formatearFecha(
                    ventaSeleccionada
                      .realizada_en,
                  )}
                </strong>
              </div>

              <div>
                <span>Pagada</span>

                <strong>
                  {formatearFecha(
                    ventaSeleccionada
                      .pagada_en,
                  )}
                </strong>
              </div>

              <div>
                <span>Cancelada</span>

                <strong>
                  {formatearFecha(
                    ventaSeleccionada
                      .cancelada_en,
                  )}
                </strong>
              </div>
            </div>

            {ventaSeleccionada
              .motivo_cancelacion && (
              <div className="admin-motivo-cancelacion">
                <strong>
                  Motivo de cancelación
                </strong>

                <p>
                  {
                    ventaSeleccionada
                      .motivo_cancelacion
                  }
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AdminVentas