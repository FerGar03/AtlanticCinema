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

function AdminPagos() {
  const [
    pagos,
    setPagos,
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
    pagoSeleccionado,
    setPagoSeleccionado,
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
    metodoFiltro,
    setMetodoFiltro,
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
   * Debounce de búsqueda.
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

  /*
   * Carga paginada de pagos.
   */
  useEffect(() => {
    const cargarPagos =
      async () => {
        try {
          setCargando(true)
          setError('')

          const params = {
            paginar:
              1,

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
            metodoFiltro
            !== 'TODOS'
          ) {
            params.metodo =
              metodoFiltro
          }

          const respuesta =
            await api.get(
              '/pagos',
              {
                params,
              }
            )

          const meta = {
            ...paginacionInicial,
            ...(
              respuesta.data.meta
              ?? {}
            ),
          }

          /*
           * Si tras algún cambio la página
           * actual deja de existir,
           * regresamos a la última válida.
           */
          if (
            pagina
            > meta.last_page
            && meta.last_page >= 1
          ) {
            setPagina(
              meta.last_page
            )

            return
          }

          setPagos(
            respuesta.data.data
            ?? []
          )

          setPaginacion(
            meta
          )
        } catch (err) {
          setError(
            err.response?.data
              ?.message
            ?? 'No fue posible cargar los pagos.'
          )

          setPagos([])

          setPaginacion(
            paginacionInicial
          )
        } finally {
          setCargando(false)
        }
      }

    cargarPagos()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    estadoFiltro,
    metodoFiltro,
  ])

  const cambiarEstadoFiltro =
    (valor) => {
      setEstadoFiltro(
        valor
      )

      setPagina(1)

      setPagoSeleccionado(
        null
      )
    }

  const cambiarMetodoFiltro =
    (valor) => {
      setMetodoFiltro(
        valor
      )

      setPagina(1)

      setPagoSeleccionado(
        null
      )
    }

  const cambiarPorPagina =
    (valor) => {
      setPorPagina(
        valor
      )

      setPagina(1)

      setPagoSeleccionado(
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

      setPagoSeleccionado(
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
      setMetodoFiltro('TODOS')
      setPagina(1)

      setPagoSeleccionado(
        null
      )
    }

  const formatearMonto =
    (
      valor,
      moneda = 'GTQ'
    ) => {
      const monto =
        Number(
          valor
          ?? 0
        )

      if (
        moneda === 'GTQ'
      ) {
        return (
          `Q${monto.toFixed(2)}`
        )
      }

      return (
        `${moneda} ${monto.toFixed(2)}`
      )
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

  const obtenerNombreCliente =
    (pago) => {
      const cliente =
        pago.venta?.cliente

      if (!cliente) {
        return 'Sin cliente'
      }

      return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim()
    }

  const verDetalle =
    async (pago) => {
      try {
        setCargandoDetalle(
          true
        )

        setError('')

        const respuesta =
          await api.get(
            `/pagos/${pago.id}`
          )

        setPagoSeleccionado(
          respuesta.data.data
        )

        setTimeout(
          () => {
            document
              .getElementById(
                'admin-detalle-pago'
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
          ?? 'No fue posible cargar el detalle del pago.'
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

        case 'APROBADO':
          return (
            'admin-estado-aprobado'
          )

        case 'RECHAZADO':
          return (
            'admin-estado-rechazado'
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
    || metodoFiltro
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
                Pagos
              </h1>

              <p>
                Consulta los pagos y su
                trazabilidad dentro de
                Atlantic Cinema.
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
                  Pagos registrados
                </h2>

                <p>
                  {paginacion.total}
                  {' '}
                  pago(s) encontrado(s).
                </p>
              </div>

              <div className="admin-filtros-pagos">
                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Venta, cliente, referencia..."
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

                  <option value="APROBADO">
                    APROBADO
                  </option>

                  <option value="RECHAZADO">
                    RECHAZADO
                  </option>
                </select>

                <select
                  value={
                    metodoFiltro
                  }
                  onChange={(event) =>
                    cambiarMetodoFiltro(
                      event
                        .target
                        .value
                    )
                  }
                >
                  <option value="TODOS">
                    Todos los métodos
                  </option>

                  <option value="EFECTIVO">
                    EFECTIVO
                  </option>

                  <option value="TARJETA">
                    TARJETA
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
                  Cargando pagos...
                </p>
              </div>
            ) : pagos.length
              === 0 ? (
                <div className="admin-listado-vacio">
                  <p>
                    No se encontraron
                    pagos con los filtros
                    seleccionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="admin-tabla-contenedor">
                    <table className="admin-tabla admin-tabla-pagos">
                      <thead>
                        <tr>
                          <th>
                            Pago
                          </th>

                          <th>
                            Venta
                          </th>

                          <th>
                            Cliente
                          </th>

                          <th>
                            Método
                          </th>

                          <th>
                            Proveedor
                          </th>

                          <th>
                            Monto
                          </th>

                          <th>
                            Estado
                          </th>

                          <th>
                            Aprobado
                          </th>

                          <th>
                            Acciones
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {pagos.map(
                          (pago) => (
                            <tr
                              key={
                                pago.id
                              }
                            >
                              <td>
                                <div className="pago-tabla-id">
                                  <strong>
                                    Pago #
                                    {
                                      pago.id
                                    }
                                  </strong>

                                  <span>
                                    {
                                      pago.moneda
                                      ?? 'GTQ'
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="pago-tabla-venta">
                                  <strong>
                                    {
                                      pago.venta
                                        ?.numero_venta
                                      ?? '-'
                                    }
                                  </strong>

                                  <span>
                                    {
                                      pago.venta
                                        ?.funcion
                                        ?.pelicula
                                        ?.titulo
                                      ?? '-'
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="pago-tabla-cliente">
                                  <strong>
                                    {
                                      obtenerNombreCliente(
                                        pago
                                      )
                                    }
                                  </strong>

                                  <span>
                                    {
                                      pago.venta
                                        ?.cliente
                                        ?.correo
                                      ?? '-'
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span className="pago-tabla-metodo">
                                  {
                                    pago.metodo_pago
                                      ?.nombre
                                    ?? pago.metodo_pago
                                      ?.codigo
                                    ?? '-'
                                  }
                                </span>
                              </td>

                              <td>
                                <div className="pago-tabla-proveedor">
                                  <strong>
                                    {
                                      pago.proveedor
                                      ?? '-'
                                    }
                                  </strong>

                                  {pago
                                    .referencia_proveedor
                                    && (
                                      <span>
                                        {
                                          pago
                                            .referencia_proveedor
                                        }
                                      </span>
                                    )}
                                </div>
                              </td>

                              <td>
                                <strong className="pago-tabla-monto">
                                  {
                                    formatearMonto(
                                      pago.monto,
                                      pago.moneda
                                    )
                                  }
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={
                                    obtenerClaseEstado(
                                      pago.estado
                                    )
                                  }
                                >
                                  {
                                    pago.estado
                                  }
                                </span>
                              </td>

                              <td>
                                <span className="pago-tabla-fecha">
                                  {
                                    formatearFecha(
                                      pago.aprobado_en
                                    )
                                  }
                                </span>
                              </td>

                              <td>
                                <div className="admin-tabla-acciones pago-tabla-acciones">
                                  <button
                                    type="button"
                                    disabled={
                                      cargandoDetalle
                                    }
                                    onClick={() =>
                                      verDetalle(
                                        pago
                                      )
                                    }
                                  >
                                    Ver detalle
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
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

          {pagoSeleccionado && (
            <section
              className="admin-seccion"
              id="admin-detalle-pago"
            >
              <div className="admin-seccion-titulo">
                <div>
                  <p className="admin-etiqueta">
                    DETALLE
                  </p>

                  <h2>
                    Pago
                  </h2>

                  <p>
                    Pago #
                    {
                      pagoSeleccionado.id
                    }
                  </p>
                </div>

                <span
                  className={
                    obtenerClaseEstado(
                      pagoSeleccionado
                        .estado
                    )
                  }
                >
                  {
                    pagoSeleccionado
                      .estado
                  }
                </span>
              </div>

              <div className="admin-resumen-pago">
                <div>
                  <span>
                    Venta
                  </span>

                  <strong>
                    {
                      pagoSeleccionado
                        .venta
                        ?.numero_venta
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {
                      obtenerNombreCliente(
                        pagoSeleccionado
                      )
                    }
                  </strong>

                  <small>
                    {
                      pagoSeleccionado
                        .venta
                        ?.cliente
                        ?.correo
                      ?? '-'
                    }
                  </small>
                </div>

                <div>
                  <span>
                    Método
                  </span>

                  <strong>
                    {
                      pagoSeleccionado
                        .metodo_pago
                        ?.nombre
                      ?? pagoSeleccionado
                        .metodo_pago
                        ?.codigo
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Proveedor
                  </span>

                  <strong>
                    {
                      pagoSeleccionado
                        .proveedor
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Monto
                  </span>

                  <strong className="pago-detalle-monto">
                    {
                      formatearMonto(
                        pagoSeleccionado
                          .monto,
                        pagoSeleccionado
                          .moneda
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Moneda
                  </span>

                  <strong>
                    {
                      pagoSeleccionado
                        .moneda
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Referencia
                  </span>

                  <strong className="pago-detalle-referencia">
                    {
                      pagoSeleccionado
                        .referencia_proveedor
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Autorización
                  </span>

                  <strong className="pago-detalle-referencia">
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
                    <span>
                      Película
                    </span>

                    <strong>
                      {
                        pagoSeleccionado
                          .venta
                          ?.funcion
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
                        pagoSeleccionado
                          .venta
                          ?.funcion
                          ?.sala
                          ?.nombre
                        ?? '-'
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Formato
                    </span>

                    <strong>
                      {
                        pagoSeleccionado
                          .venta
                          ?.funcion
                          ?.formato
                          ?.nombre
                        ?? '-'
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Estado venta
                    </span>

                    <strong>
                      {
                        pagoSeleccionado
                          .venta
                          ?.estado
                        ?? '-'
                      }
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Asientos
                </h3>

                <div className="admin-pago-asientos">
                  {(
                    pagoSeleccionado
                      .venta
                      ?.entradas
                    ?? []
                  ).map(
                    (entrada) => {
                      const asiento =
                        entrada
                          .funcion_asiento
                          ?.asiento

                      return (
                        <div
                          className="admin-pago-asiento"
                          key={
                            entrada.id
                          }
                        >
                          <div className="pago-asiento-cabecera">
                            <strong>
                              {asiento
                                ? `${asiento.fila}${asiento.numero}`
                                : '-'}
                            </strong>

                            <span>
                              {
                                entrada.estado
                              }
                            </span>
                          </div>

                          <small>
                            {
                              entrada.codigo
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
                  Procesamiento
                </h3>

                <div className="admin-resumen-pago">
                  <div>
                    <span>
                      Aprobado en
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          pagoSeleccionado
                            .aprobado_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Descripción
                    </span>

                    <strong>
                      {
                        pagoSeleccionado
                          .descripcion
                        ?? '-'
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminPagos