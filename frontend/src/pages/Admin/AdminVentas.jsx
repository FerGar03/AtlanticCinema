import {
  useEffect,
  useState,
} from 'react'

import api from '../../services/api'

import AdminSidebar
  from '../../components/Admin/AdminSidebar'

import AdminPaginacion
  from '../../components/Admin/AdminPaginacion'

const paginacionInicial = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0,
}

function AdminVentas() {
  const [
    ventas,
    setVentas,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false)

  const [
    ventaSeleccionada,
    setVentaSeleccionada,
  ] = useState(null)

  const [
    busqueda,
    setBusqueda,
  ] = useState('')

  const [
    busquedaAplicada,
    setBusquedaAplicada,
  ] = useState('')

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState('TODOS')

  const [
    origenFiltro,
    setOrigenFiltro,
  ] = useState('TODOS')

  const [
    pagina,
    setPagina,
  ] = useState(1)

  const [
    porPagina,
    setPorPagina,
  ] = useState(20)

  const [
    paginacion,
    setPaginacion,
  ] = useState(
    paginacionInicial
  )

  const [
    error,
    setError,
  ] = useState('')

  /*
   * Aplicamos un pequeño debounce a
   * la búsqueda para no hacer una
   * solicitud HTTP por cada tecla.
   */
  useEffect(() => {
    const temporizador =
      setTimeout(
        () => {
          setBusquedaAplicada(
            busqueda.trim()
          )

          setPagina(1)
        },
        400
      )

    return () =>
      clearTimeout(
        temporizador
      )
  }, [busqueda])

  useEffect(() => {
    const cargarVentas =
      async () => {
        try {
          setCargando(true)
          setError('')

          const params = {
            page:
              pagina,

            per_page:
              porPagina,
          }

          if (
            busquedaAplicada
          ) {
            params.buscar =
              busquedaAplicada
          }

          if (
            estadoFiltro
            !== 'TODOS'
          ) {
            params.estado =
              estadoFiltro
          }

          if (
            origenFiltro
            !== 'TODOS'
          ) {
            params.origen =
              origenFiltro
          }

          const respuesta =
            await api.get(
              '/ventas',
              {
                params,
              }
            )

          setVentas(
            respuesta.data.data
            ?? []
          )

          setPaginacion({
            ...paginacionInicial,
            ...(
              respuesta.data.meta
              ?? {}
            ),
          })
        } catch (err) {
          setError(
            err.response?.data
              ?.message
            ?? 'No fue posible cargar las ventas.'
          )

          setVentas([])

          setPaginacion(
            paginacionInicial
          )
        } finally {
          setCargando(false)
        }
      }

    cargarVentas()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    estadoFiltro,
    origenFiltro,
  ])

  const cambiarEstadoFiltro =
    (valor) => {
      setEstadoFiltro(
        valor
      )

      setPagina(1)

      setVentaSeleccionada(
        null
      )
    }

  const cambiarOrigenFiltro =
    (valor) => {
      setOrigenFiltro(
        valor
      )

      setPagina(1)

      setVentaSeleccionada(
        null
      )
    }

  const cambiarPorPagina =
    (valor) => {
      setPorPagina(
        valor
      )

      setPagina(1)

      setVentaSeleccionada(
        null
      )
    }

  const cambiarPagina =
    (nuevaPagina) => {
      if (
        nuevaPagina < 1
        || nuevaPagina
          > paginacion.last_page
      ) {
        return
      }

      setPagina(
        nuevaPagina
      )

      setVentaSeleccionada(
        null
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

  const limpiarFiltros =
    () => {
      setBusqueda('')
      setBusquedaAplicada('')
      setEstadoFiltro('TODOS')
      setOrigenFiltro('TODOS')
      setPagina(1)
      setVentaSeleccionada(null)
    }

  const obtenerNombreCliente =
    (venta) => {
      if (!venta.cliente) {
        return 'Sin cliente'
      }

      return `${venta.cliente.nombres ?? ''} ${venta.cliente.apellidos ?? ''}`.trim()
    }

  const obtenerNombreEmpleado =
    (venta) => {
      if (!venta.empleado) {
        return '-'
      }

      return `${venta.empleado.nombres ?? ''} ${venta.empleado.apellidos ?? ''}`.trim()
    }

  const formatearFecha =
    (fecha) => {
      if (!fecha) {
        return '-'
      }

      return new Intl.DateTimeFormat(
        'es-GT',
        {
          timeZone:
            'America/Guatemala',

          dateStyle:
            'medium',

          timeStyle:
            'short',
        }
      ).format(
        new Date(fecha)
      )
    }

  const formatearMonto =
    (valor) => {
      return `Q${Number(
        valor ?? 0
      ).toFixed(2)}`
    }

  const obtenerAsientos =
    (venta) => {
      return (
        venta.entradas
        ?? []
      )
        .map(
          (entrada) => {
            const asiento =
              entrada
                .funcion_asiento
                ?.asiento

            if (!asiento) {
              return null
            }

            return (
              `${asiento.fila}${asiento.numero}`
            )
          }
        )
        .filter(Boolean)
    }

  const verDetalle =
    async (venta) => {
      try {
        setCargandoDetalle(
          true
        )

        setError('')

        const respuesta =
          await api.get(
            `/ventas/${venta.id}`
          )

        setVentaSeleccionada(
          respuesta.data.data
        )

        setTimeout(
          () => {
            document
              .getElementById(
                'admin-detalle-venta'
              )
              ?.scrollIntoView({
                behavior:
                  'smooth',

                block:
                  'start',
              })
          },
          0
        )
      } catch (err) {
        setError(
          err.response?.data
            ?.message
          ?? 'No fue posible cargar el detalle de la venta.'
        )
      } finally {
        setCargandoDetalle(
          false
        )
      }
    }

  const obtenerClaseEstado =
    (estado) => {
      switch (estado) {
        case 'PENDIENTE':
          return (
            'admin-estado-pendiente'
          )

        case 'PAGADA':
          return (
            'admin-estado-pagada'
          )

        case 'CANCELADA':
          return (
            'admin-estado-cancelada'
          )

        case 'FALLIDA':
          return (
            'admin-estado-fallida'
          )

        case 'REEMBOLSADA':
          return (
            'admin-estado-cancelada'
          )

        case 'PARCIALMENTE_REEMBOLSADA':
          return (
            'admin-estado-pendiente'
          )

        default:
          return ''
      }
    }

  const obtenerClaseEntrada =
    (estado) => {
      switch (estado) {
        case 'VALIDA':
          return (
            'admin-entrada-valida'
          )

        case 'PENDIENTE':
          return (
            'admin-entrada-pendiente'
          )

        case 'UTILIZADA':
          return (
            'admin-entrada-utilizada'
          )

        case 'CANCELADA':
          return (
            'admin-entrada-cancelada'
          )

        case 'REEMBOLSADA':
          return (
            'admin-entrada-reembolsada'
          )

        default:
          return ''
      }
    }

  const hayFiltros =
    Boolean(
      busqueda
    )
    || estadoFiltro
      !== 'TODOS'
    || origenFiltro
      !== 'TODOS'

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-contenido">
        <div className="admin-pagina">
          <div className="admin-pagina-encabezado">
            <div>
              <p className="admin-etiqueta">
                ADMINISTRACIÓN
              </p>

              <h1>
                Ventas
              </h1>

              <p>
                Consulta el historial
                y la trazabilidad de las
                ventas de Atlantic Cinema.
              </p>
            </div>
          </div>

          {error && (
            <div className="admin-mensaje admin-mensaje-error">
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
                  {paginacion.total}
                  {' '}
                  venta(s) encontrada(s).
                </p>
              </div>

              <div className="admin-filtros-ventas">
                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Venta, cliente, película..."
                  value={
                    busqueda
                  }
                  onChange={(event) =>
                    setBusqueda(
                      event
                        .target
                        .value
                    )
                  }
                />

                <select
                  value={
                    estadoFiltro
                  }
                  onChange={(event) =>
                    cambiarEstadoFiltro(
                      event
                        .target
                        .value
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

                  <option value="REEMBOLSADA">
                    REEMBOLSADA
                  </option>

                  <option value="PARCIALMENTE_REEMBOLSADA">
                    PARCIALMENTE REEMBOLSADA
                  </option>
                </select>

                <select
                  value={
                    origenFiltro
                  }
                  onChange={(event) =>
                    cambiarOrigenFiltro(
                      event
                        .target
                        .value
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

                  <option value="TAQUILLA">
                    TAQUILLA
                  </option>
                </select>

                {hayFiltros && (
                  <button
                    type="button"
                    className="admin-boton-secundario"
                    onClick={
                      limpiarFiltros
                    }
                    disabled={
                      cargando
                    }
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {cargando ? (
              <div className="admin-cargando admin-cargando-listado">
                <div className="cartelera-spinner" />

                <p>
                  Cargando ventas...
                </p>
              </div>
            ) : ventas.length === 0 ? (
              <div className="admin-listado-vacio">
                <p>
                  No se encontraron ventas
                  con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-tabla-contenedor">
                  <table className="admin-tabla admin-tabla-ventas">
                    <thead>
                      <tr>
                        <th>
                          Venta
                        </th>

                        <th>
                          Cliente
                        </th>

                        <th>
                          Función
                        </th>

                        <th>
                          Origen
                        </th>

                        <th>
                          Entradas
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Estado
                        </th>

                        <th>
                          Realizada
                        </th>

                        <th>
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {ventas.map(
                        (venta) => {
                          const asientos =
                            obtenerAsientos(
                              venta
                            )

                          return (
                            <tr
                              key={
                                venta.id
                              }
                            >
                              <td>
                                <div className="venta-tabla-numero">
                                  <strong>
                                    {
                                      venta
                                        .numero_venta
                                    }
                                  </strong>

                                  <span>
                                    Venta #
                                    {
                                      venta.id
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="venta-tabla-cliente">
                                  <strong>
                                    {
                                      obtenerNombreCliente(
                                        venta
                                      )
                                    }
                                  </strong>

                                  <span>
                                    {
                                      venta
                                        .cliente
                                        ?.correo
                                      ?? '-'
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="venta-tabla-funcion">
                                  <strong>
                                    {
                                      venta
                                        .funcion
                                        ?.pelicula
                                        ?.titulo
                                      ?? '-'
                                    }
                                  </strong>

                                  <span>
                                    {
                                      venta
                                        .funcion
                                        ?.sala
                                        ?.nombre
                                      ?? '-'
                                    }
                                    {' · '}
                                    {
                                      venta
                                        .funcion
                                        ?.formato
                                        ?.nombre
                                      ?? '-'
                                    }
                                  </span>

                                  {asientos.length
                                    > 0
                                    && (
                                      <small>
                                        Asientos:
                                        {' '}
                                        {
                                          asientos
                                            .join(
                                              ', '
                                            )
                                        }
                                      </small>
                                    )}
                                </div>
                              </td>

                              <td>
                                <span className="venta-tabla-origen">
                                  {
                                    venta
                                      .origen
                                  }
                                </span>
                              </td>

                              <td>
                                <strong>
                                  {
                                    venta
                                      .entradas
                                      ?.length
                                    ?? 0
                                  }
                                </strong>
                              </td>

                              <td>
                                <strong className="venta-tabla-total">
                                  {
                                    formatearMonto(
                                      venta
                                        .total
                                    )
                                  }
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={
                                    obtenerClaseEstado(
                                      venta
                                        .estado
                                    )
                                  }
                                >
                                  {
                                    venta
                                      .estado
                                  }
                                </span>
                              </td>

                              <td>
                                <span className="venta-tabla-fecha">
                                  {
                                    formatearFecha(
                                      venta
                                        .realizada_en
                                    )
                                  }
                                </span>
                              </td>

                              <td>
                                <div className="admin-tabla-acciones venta-tabla-acciones">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      verDetalle(
                                        venta
                                      )
                                    }
                                    disabled={
                                      cargandoDetalle
                                    }
                                  >
                                    Ver detalle
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <AdminPaginacion
                  paginaActual={
                    paginacion
                      .current_page
                  }
                  ultimaPagina={
                    paginacion
                      .last_page
                  }
                  porPagina={
                    paginacion
                      .per_page
                  }
                  total={
                    paginacion
                      .total
                  }
                  desde={
                    paginacion
                      .from
                  }
                  hasta={
                    paginacion
                      .to
                  }
                  onCambiarPagina={
                    cambiarPagina
                  }
                  onCambiarPorPagina={
                    cambiarPorPagina
                  }
                  deshabilitado={
                    cargando
                  }
                />
              </>
            )}
          </section>

          {ventaSeleccionada && (
            <section
              className="admin-seccion"
              id="admin-detalle-venta"
            >
              <div className="admin-seccion-titulo">
                <div>
                  <p className="admin-etiqueta">
                    DETALLE
                  </p>

                  <h2>
                    Venta
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
                      ventaSeleccionada
                        .estado
                    )
                  }
                >
                  {
                    ventaSeleccionada
                      .estado
                  }
                </span>
              </div>

              <div className="admin-resumen-venta">
                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {
                      obtenerNombreCliente(
                        ventaSeleccionada
                      )
                    }
                  </strong>

                  <small>
                    {
                      ventaSeleccionada
                        .cliente
                        ?.correo
                      ?? '-'
                    }
                  </small>
                </div>

                <div>
                  <span>
                    Empleado
                  </span>

                  <strong>
                    {
                      obtenerNombreEmpleado(
                        ventaSeleccionada
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Origen
                  </span>

                  <strong>
                    {
                      ventaSeleccionada
                        .origen
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Reserva
                  </span>

                  <strong>
                    {
                      ventaSeleccionada
                        .reserva
                        ?.codigo
                      ?? 'Compra directa'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Película
                  </span>

                  <strong>
                    {
                      ventaSeleccionada
                        .funcion
                        ?.pelicula
                        ?.titulo
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Sala
                  </span>

                  <strong>
                    {
                      ventaSeleccionada
                        .funcion
                        ?.sala
                        ?.nombre
                      ?? '-'
                    }
                  </strong>

                  <small>
                    {
                      ventaSeleccionada
                        .funcion
                        ?.formato
                        ?.nombre
                      ?? '-'
                    }
                  </small>
                </div>

                <div>
                  <span>
                    Función
                  </span>

                  <strong>
                    {
                      formatearFecha(
                        ventaSeleccionada
                          .funcion
                          ?.inicia_en
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Entradas
                  </span>

                  <strong>
                    {
                      ventaSeleccionada
                        .entradas
                        ?.length
                      ?? 0
                    }
                  </strong>
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Información económica
                </h3>

                <div className="admin-resumen-venta">
                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {
                        formatearMonto(
                          ventaSeleccionada
                            .subtotal
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Descuento
                    </span>

                    <strong>
                      {
                        formatearMonto(
                          ventaSeleccionada
                            .descuento
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total
                    </span>

                    <strong className="venta-detalle-total">
                      {
                        formatearMonto(
                          ventaSeleccionada
                            .total
                        )
                      }
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Entradas y asientos
                </h3>

                <div className="admin-venta-entradas">
                  {(
                    ventaSeleccionada
                      .entradas
                    ?? []
                  ).map(
                    (entrada) => {
                      const asiento =
                        entrada
                          .funcion_asiento
                          ?.asiento

                      return (
                        <div
                          key={
                            entrada.id
                          }
                          className="admin-venta-entrada"
                        >
                          <div className="venta-entrada-cabecera">
                            <strong>
                              {asiento
                                ? `${asiento.fila}${asiento.numero}`
                                : 'Sin asiento'}
                            </strong>

                            <span
                              className={
                                obtenerClaseEntrada(
                                  entrada
                                    .estado
                                )
                              }
                            >
                              {
                                entrada
                                  .estado
                              }
                            </span>
                          </div>

                          <span className="venta-entrada-precio">
                            {
                              formatearMonto(
                                entrada
                                  .precio
                              )
                            }
                          </span>

                          <small>
                            {
                              entrada
                                .codigo
                            }
                          </small>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Fechas y trazabilidad
                </h3>

                <div className="admin-resumen-venta">
                  <div>
                    <span>
                      Realizada
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          ventaSeleccionada
                            .realizada_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pagada
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          ventaSeleccionada
                            .pagada_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cancelada
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          ventaSeleccionada
                            .cancelada_en
                        )
                      }
                    </strong>
                  </div>
                </div>

                {ventaSeleccionada
                  .motivo_cancelacion
                  && (
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
      </main>
    </div>
  )
}

export default AdminVentas