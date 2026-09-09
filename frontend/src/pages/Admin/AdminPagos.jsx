import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

function AdminPagos() {
  const [pagos, setPagos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false)

  const [pagoSeleccionado, setPagoSeleccionado] =
    useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] =
    useState('TODOS')

  const [metodoFiltro, setMetodoFiltro] =
    useState('TODOS')

  const [error, setError] = useState('')

  const cargarPagos = async () => {
    try {
      setCargando(true)
      setError('')

      const respuesta =
        await api.get('/pagos')

      setPagos(
        respuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar los pagos.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPagos()
  }, [])

  const formatearMonto = (valor, moneda = 'GTQ') => {
    const monto =
      Number(valor ?? 0)

    if (moneda === 'GTQ') {
      return `Q${monto.toFixed(2)}`
    }

    return `${moneda} ${monto.toFixed(2)}`
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

  const obtenerNombreCliente = (pago) => {
    const cliente =
      pago.venta?.cliente

    if (!cliente) {
      return 'Sin cliente'
    }

    return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim()
  }

  const metodosDisponibles = useMemo(() => {
    return [
      ...new Set(
        pagos
          .map(
            (pago) =>
              pago.metodo_pago?.codigo
              ?? pago.metodo_pago?.nombre,
          )
          .filter(Boolean),
      ),
    ].sort()
  }, [pagos])

  const pagosFiltrados = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase()

    return pagos.filter((pago) => {
      if (
        estadoFiltro !== 'TODOS'
        && pago.estado !== estadoFiltro
      ) {
        return false
      }

      const metodo =
        pago.metodo_pago?.codigo
        ?? pago.metodo_pago?.nombre
        ?? ''

      if (
        metodoFiltro !== 'TODOS'
        && metodo !== metodoFiltro
      ) {
        return false
      }

      if (!termino) {
        return true
      }

      const venta =
        (pago.venta?.numero_venta ?? '')
          .toLowerCase()

      const cliente =
        obtenerNombreCliente(pago)
          .toLowerCase()

      const correo =
        (pago.venta?.cliente?.correo ?? '')
          .toLowerCase()

      const proveedor =
        (pago.proveedor ?? '')
          .toLowerCase()

      const referencia =
        (pago.referencia_proveedor ?? '')
          .toLowerCase()

      const autorizacion =
        (pago.autorizacion_codigo ?? '')
          .toLowerCase()

      const pelicula =
        (pago.venta?.funcion?.pelicula?.titulo ?? '')
          .toLowerCase()

      return (
        venta.includes(termino)
        || cliente.includes(termino)
        || correo.includes(termino)
        || proveedor.includes(termino)
        || referencia.includes(termino)
        || autorizacion.includes(termino)
        || pelicula.includes(termino)
      )
    })
  }, [
    pagos,
    busqueda,
    estadoFiltro,
    metodoFiltro,
  ])

  const verDetalle = async (pago) => {
    try {
      setCargandoDetalle(true)
      setError('')

      const respuesta =
        await api.get(
          `/pagos/${pago.id}`,
        )

      setPagoSeleccionado(
        respuesta.data.data,
      )

      setTimeout(() => {
        document
          .getElementById(
            'admin-detalle-pago',
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 0)
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar el detalle del pago.',
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'admin-estado-pendiente'

      case 'APROBADO':
        return 'admin-estado-aprobado'

      case 'RECHAZADO':
        return 'admin-estado-rechazado'

      default:
        return ''
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando pagos...</p>
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

          <h1>Pagos</h1>

          <p>
            Consulta los pagos y su
            trazabilidad dentro de Atlantic Cinema.
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
              Pagos registrados
            </h2>

            <p>
              {pagosFiltrados.length}
              {' '}
              pago(s) mostrado(s).
            </p>
          </div>

          <div className="admin-filtros-pagos">
            <input
              className="admin-buscador"
              type="search"
              placeholder="Venta, cliente, referencia..."
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

              <option value="APROBADO">
                APROBADO
              </option>

              <option value="RECHAZADO">
                RECHAZADO
              </option>
            </select>

            <select
              value={metodoFiltro}
              onChange={(event) =>
                setMetodoFiltro(
                  event.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos los métodos
              </option>

              {metodosDisponibles.map(
                (metodo) => (
                  <option
                    key={metodo}
                    value={metodo}
                  >
                    {metodo}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {pagosFiltrados.length === 0 ? (
          <p>
            No se encontraron pagos.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-pagos">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Venta</th>
                  <th>Cliente</th>
                  <th>Método</th>
                  <th>Proveedor</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Aprobado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pagosFiltrados.map(
                  (pago) => (
                    <tr key={pago.id}>
                      <td>
                        #{pago.id}
                      </td>

                      <td>
                        <strong>
                          {
                            pago.venta?.numero_venta
                            ?? '-'
                          }
                        </strong>

                        <small>
                          {
                            pago.venta?.funcion
                              ?.pelicula?.titulo
                            ?? '-'
                          }
                        </small>
                      </td>

                      <td>
                        <strong>
                          {obtenerNombreCliente(
                            pago,
                          )}
                        </strong>

                        <small>
                          {
                            pago.venta?.cliente
                              ?.correo
                            ?? '-'
                          }
                        </small>
                      </td>

                      <td>
                        {
                          pago.metodo_pago?.nombre
                          ?? pago.metodo_pago?.codigo
                          ?? '-'
                        }
                      </td>

                      <td>
                        {pago.proveedor ?? '-'}
                      </td>

                      <td>
                        {formatearMonto(
                          pago.monto,
                          pago.moneda,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            obtenerClaseEstado(
                              pago.estado,
                            )
                          }
                        >
                          {pago.estado}
                        </span>
                      </td>

                      <td>
                        {formatearFecha(
                          pago.aprobado_en,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          disabled={
                            cargandoDetalle
                          }
                          onClick={() =>
                            verDetalle(pago)
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

      {pagoSeleccionado && (
        <section
          className="admin-seccion"
          id="admin-detalle-pago"
        >
          <div className="admin-seccion-titulo">
            <div>
              <h2>
                Detalle de pago
              </h2>

              <p>
                Pago #{pagoSeleccionado.id}
              </p>
            </div>

            <span
              className={
                obtenerClaseEstado(
                  pagoSeleccionado.estado,
                )
              }
            >
              {pagoSeleccionado.estado}
            </span>
          </div>

          <div className="admin-resumen-pago">
            <div>
              <span>Venta</span>

              <strong>
                {
                  pagoSeleccionado.venta
                    ?.numero_venta
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Cliente</span>

              <strong>
                {obtenerNombreCliente(
                  pagoSeleccionado,
                )}
              </strong>

              <small>
                {
                  pagoSeleccionado.venta
                    ?.cliente?.correo
                  ?? '-'
                }
              </small>
            </div>

            <div>
              <span>Método</span>

              <strong>
                {
                  pagoSeleccionado.metodo_pago
                    ?.nombre
                  ?? pagoSeleccionado.metodo_pago
                    ?.codigo
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Proveedor</span>

              <strong>
                {
                  pagoSeleccionado.proveedor
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Monto</span>

              <strong>
                {formatearMonto(
                  pagoSeleccionado.monto,
                  pagoSeleccionado.moneda,
                )}
              </strong>
            </div>

            <div>
              <span>Moneda</span>

              <strong>
                {
                  pagoSeleccionado.moneda
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Referencia</span>

              <strong>
                {
                  pagoSeleccionado
                    .referencia_proveedor
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Autorización</span>

              <strong>
                {
                  pagoSeleccionado
                    .autorizacion_codigo
                  ?? '-'
                }
              </strong>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>
              Venta relacionada
            </h3>

            <div className="admin-resumen-pago">
              <div>
                <span>Película</span>

                <strong>
                  {
                    pagoSeleccionado.venta
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
                    pagoSeleccionado.venta
                      ?.funcion?.sala?.nombre
                    ?? '-'
                  }
                </strong>
              </div>

              <div>
                <span>Formato</span>

                <strong>
                  {
                    pagoSeleccionado.venta
                      ?.funcion?.formato?.nombre
                    ?? '-'
                  }
                </strong>
              </div>

              <div>
                <span>Estado venta</span>

                <strong>
                  {
                    pagoSeleccionado.venta
                      ?.estado
                    ?? '-'
                  }
                </strong>
              </div>
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>Asientos</h3>

            <div className="admin-pago-asientos">
              {(
                pagoSeleccionado.venta
                  ?.entradas
                ?? []
              ).map((entrada) => {
                const asiento =
                  entrada.funcion_asiento
                    ?.asiento

                return (
                  <div
                    className="admin-pago-asiento"
                    key={entrada.id}
                  >
                    <strong>
                      {asiento
                        ? `${asiento.fila}${asiento.numero}`
                        : '-'}
                    </strong>

                    <span>
                      {entrada.estado}
                    </span>

                    <small>
                      {entrada.codigo}
                    </small>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>
              Procesamiento
            </h3>

            <div className="admin-resumen-pago">
              <div>
                <span>Aprobado en</span>

                <strong>
                  {formatearFecha(
                    pagoSeleccionado
                      .aprobado_en,
                  )}
                </strong>
              </div>

              <div>
                <span>Descripción</span>

                <strong>
                  {
                    pagoSeleccionado.descripcion
                    ?? '-'
                  }
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default AdminPagos