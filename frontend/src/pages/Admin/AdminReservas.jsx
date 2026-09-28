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

function AdminReservas() {
  const [
    reservas,
    setReservas,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    procesandoId,
    setProcesandoId,
  ] = useState(null)

  const [
    mensaje,
    setMensaje,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

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
    reservaSeleccionada,
    setReservaSeleccionada,
  ] = useState(null)

  const [
    reservaConfirmarCancelacion,
    setReservaConfirmarCancelacion,
  ] = useState(null)

  const [
    motivoCancelacion,
    setMotivoCancelacion,
  ] = useState('')

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

  const cargarReservas =
    async () => {
      try {
        setCargando(true)
        setError('')

        const params = {
          paginar: 1,
          page: pagina,
          per_page: porPagina,
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

        const respuesta =
          await api.get(
            '/reservas',
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

        setReservas(
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
          ?? 'No fue posible cargar las reservas.'
        )

        setReservas([])

        setPaginacion(
          paginacionInicial
        )
      } finally {
        setCargando(false)
      }
    }

  useEffect(() => {
    cargarReservas()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    estadoFiltro,
  ])

  const limpiarMensajes =
    () => {
      setMensaje('')
      setError('')
    }

  const copiarCodigoReserva =
    async (codigo) => {
      try {
        await navigator
          .clipboard
          .writeText(
            codigo
          )

        setMensaje(
          'Código de reserva copiado.'
        )

        setError('')
      } catch {
        setError(
          'No fue posible copiar el código de reserva.'
        )
      }
    }

  const obtenerPrimerError =
    (err) => {
      const errores =
        err.response?.data
          ?.errors

      if (errores) {
        const primerError =
          Object.values(
            errores
          )?.[0]?.[0]

        if (primerError) {
          return primerError
        }
      }

      return (
        err.response?.data
          ?.message
        ?? 'Ocurrió un error al procesar la solicitud.'
      )
    }

  const cambiarEstadoFiltro =
    (valor) => {
      setEstadoFiltro(
        valor
      )

      setPagina(1)

      setReservaSeleccionada(
        null
      )
    }

  const cambiarPorPagina =
    (valor) => {
      setPorPagina(
        valor
      )

      setPagina(1)

      setReservaSeleccionada(
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

      setReservaSeleccionada(
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
      setPagina(1)

      setReservaSeleccionada(
        null
      )
    }

  const formatearFecha =
    (fecha) => {
      if (!fecha) {
        return '-'
      }

      return new Intl
        .DateTimeFormat(
          'es-GT',
          {
            timeZone:
              'America/Guatemala',

            dateStyle:
              'medium',

            timeStyle:
              'short',
          }
        )
        .format(
          new Date(fecha)
        )
    }

  const formatearMonto =
    (monto) => {
      const valor =
        Number(
          monto
          ?? 0
        )

      return (
        `Q${valor.toFixed(2)}`
      )
    }

  const obtenerNombreCliente =
    (reserva) => {
      const usuario =
        reserva.usuario

      if (!usuario) {
        return 'Sin usuario'
      }

      return (
        `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`
          .trim()
      )
    }

  const obtenerAsientos =
    (reserva) => {
      const detalles =
        reserva.detalles
        ?? []

      return detalles
        .map(
          (detalle) => {
            const asiento =
              detalle
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

  const seleccionarReserva =
    (reserva) => {
      limpiarMensajes()

      setReservaSeleccionada(
        reserva
      )

      setTimeout(
        () => {
          document
            .getElementById(
              'admin-detalle-reserva'
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
    }

  const solicitarCancelarReserva =
    (reserva) => {
      if (
        reserva.estado
        !== 'PENDIENTE'
      ) {
        return
      }

      limpiarMensajes()

      setMotivoCancelacion('')

      setReservaConfirmarCancelacion(
        reserva
      )
    }

  const cerrarConfirmacion =
    () => {
      if (procesandoId) {
        return
      }

      setReservaConfirmarCancelacion(
        null
      )

      setMotivoCancelacion('')
    }

  const confirmarCancelarReserva =
    async () => {
      if (
        !reservaConfirmarCancelacion
      ) {
        return
      }

      const motivo =
        motivoCancelacion
          .trim()

      if (
        motivo.length < 5
      ) {
        setError(
          'El motivo de cancelación debe tener al menos 5 caracteres.'
        )

        return
      }

      const reserva =
        reservaConfirmarCancelacion

      try {
        setProcesandoId(
          reserva.id
        )

        limpiarMensajes()

        const respuesta =
          await api.post(
            `/reservas/${reserva.id}/cancelar`,
            {
              motivo_cancelacion:
                motivo,
            }
          )

        const reservaActualizada =
          respuesta.data.data

        setReservaConfirmarCancelacion(
          null
        )

        setMotivoCancelacion('')

        setMensaje(
          'Reserva cancelada correctamente.'
        )

        setReservaSeleccionada(
          reservaActualizada
        )

        await cargarReservas()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )
      } finally {
        setProcesandoId(
          null
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

        case 'CONVERTIDA':
          return (
            'admin-estado-convertida'
          )

        case 'CANCELADA':
          return (
            'admin-estado-cancelada'
          )

        case 'VENCIDA':
          return (
            'admin-estado-vencida'
          )

        default:
          return ''
      }
    }

  const obtenerClaseDetalle =
    (estado) => {
      switch (estado) {
        case 'RESERVADO':
          return (
            'admin-detalle-reservado'
          )

        case 'CONVERTIDO':
          return (
            'admin-detalle-convertido'
          )

        case 'LIBERADO':
          return (
            'admin-detalle-liberado'
          )

        default:
          return ''
      }
    }

  const procesando =
    Boolean(
      procesandoId
    )

  const hayFiltros =
    Boolean(
      busqueda
    )
    || estadoFiltro
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
                Reservas
              </h1>

              <p>
                Consulta y administra
                las reservas realizadas
                en Atlantic Cinema.
              </p>
            </div>
          </div>

          {mensaje && (
            <div className="admin-mensaje admin-mensaje-exito">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="admin-mensaje admin-mensaje-error">
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
                  {paginacion.total}
                  {' '}
                  reserva(s)
                  encontrada(s).
                </p>
              </div>

              <div className="admin-filtros-reservas">
                <div className="admin-filtros-reservas-titulo">
                  <span>
                    FILTROS
                  </span>

                  <strong>
                    Buscar reservas
                  </strong>
                </div>

                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Código, cliente, película..."
                  value={
                    busqueda
                  }
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value
                    )
                  }
                />

                <select
                  value={
                    estadoFiltro
                  }
                  onChange={(event) =>
                    cambiarEstadoFiltro(
                      event.target.value
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
                  Cargando reservas...
                </p>
              </div>
            ) : reservas.length
              === 0 ? (
                <div className="admin-listado-vacio">
                  <p>
                    No se encontraron
                    reservas con los
                    filtros seleccionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="admin-tabla-contenedor">
                    <table className="admin-tabla admin-tabla-reservas">
                      <thead>
                        <tr>
                          <th>
                            Reserva
                          </th>

                          <th>
                            Cliente
                          </th>

                          <th>
                            Función
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
                            Reservada
                          </th>

                          <th>
                            Acciones
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {reservas.map(
                          (reserva) => {
                            const filaProcesando =
                              procesandoId
                              === reserva.id

                            const asientos =
                              obtenerAsientos(
                                reserva
                              )

                            return (
                              <tr
                                key={
                                  reserva.id
                                }
                              >
                                <td>
                                  <div className="reserva-tabla-codigo">
                                    <strong>
                                      {
                                        reserva
                                          .codigo
                                      }
                                    </strong>

                                    <span>
                                      {
                                        reserva
                                          .funcion
                                          ?.pelicula
                                          ?.titulo
                                        ?? '-'
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <div className="reserva-tabla-cliente">
                                    <strong>
                                      {
                                        obtenerNombreCliente(
                                          reserva
                                        )
                                      }
                                    </strong>

                                    <span>
                                      {
                                        reserva
                                          .usuario
                                          ?.correo
                                        ?? '-'
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <div className="reserva-tabla-funcion">
                                    <strong>
                                      {
                                        reserva
                                          .funcion
                                          ?.sala
                                          ?.nombre
                                        ?? '-'
                                      }
                                    </strong>

                                    <span>
                                      {
                                        reserva
                                          .funcion
                                          ?.formato
                                          ?.nombre
                                        ?? '-'
                                      }

                                      {' · '}

                                      {
                                        formatearFecha(
                                          reserva
                                            .funcion
                                            ?.inicia_en
                                        )
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
                                  <strong>
                                    {
                                      reserva
                                        .cantidad_entradas
                                    }
                                  </strong>
                                </td>

                                <td>
                                  <strong className="reserva-tabla-total">
                                    {
                                      formatearMonto(
                                        reserva
                                          .total
                                      )
                                    }
                                  </strong>
                                </td>

                                <td>
                                  <span
                                    className={
                                      obtenerClaseEstado(
                                        reserva
                                          .estado
                                      )
                                    }
                                  >
                                    {
                                      reserva
                                        .estado
                                    }
                                  </span>
                                </td>

                                <td>
                                  <span className="reserva-tabla-fecha">
                                    {
                                      formatearFecha(
                                        reserva
                                          .reservada_en
                                      )
                                    }
                                  </span>
                                </td>

                                <td>
                                  <div className="admin-tabla-acciones reserva-tabla-acciones">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        seleccionarReserva(
                                          reserva
                                        )
                                      }
                                      disabled={
                                        filaProcesando
                                      }
                                    >
                                      Ver detalle
                                    </button>

                                    {reserva.estado
                                      === 'PENDIENTE'
                                      && (
                                        <button
                                          type="button"
                                          className="admin-boton-eliminar"
                                          disabled={
                                            filaProcesando
                                          }
                                          onClick={() =>
                                            solicitarCancelarReserva(
                                              reserva
                                            )
                                          }
                                        >
                                          {
                                            filaProcesando
                                              ? 'Procesando...'
                                              : 'Cancelar'
                                          }
                                        </button>
                                      )}
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

          {reservaSeleccionada && (
            <section
              className="admin-seccion"
              id="admin-detalle-reserva"
            >
              <div className="admin-seccion-titulo">
                <div>
                  <p className="admin-etiqueta">
                    DETALLE
                  </p>

                  <h2>
                    Reserva
                  </h2>

                  <div className="admin-reserva-codigo-detalle">
                    <strong>
                      {
                        reservaSeleccionada
                          .codigo
                      }
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        copiarCodigoReserva(
                          reservaSeleccionada
                            .codigo
                        )
                      }
                    >
                      Copiar código
                    </button>
                  </div>
                </div>

                <span
                  className={
                    obtenerClaseEstado(
                      reservaSeleccionada
                        .estado
                    )
                  }
                >
                  {
                    reservaSeleccionada
                      .estado
                  }
                </span>
              </div>

              <div className="admin-resumen-reserva">
                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {
                      obtenerNombreCliente(
                        reservaSeleccionada
                      )
                    }
                  </strong>

                  <small>
                    {
                      reservaSeleccionada
                        .usuario
                        ?.correo
                      ?? '-'
                    }
                  </small>
                </div>

                <div>
                  <span>
                    Película
                  </span>

                  <strong>
                    {
                      reservaSeleccionada
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
                      reservaSeleccionada
                        .funcion
                        ?.sala
                        ?.nombre
                      ?? '-'
                    }
                  </strong>

                  <small>
                    {
                      reservaSeleccionada
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
                        reservaSeleccionada
                          .funcion
                          ?.inicia_en
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {
                      formatearMonto(
                        reservaSeleccionada
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
                        reservaSeleccionada
                          .descuento
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Total
                  </span>

                  <strong className="reserva-detalle-total">
                    {
                      formatearMonto(
                        reservaSeleccionada
                          .total
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Expira
                  </span>

                  <strong>
                    {
                      formatearFecha(
                        reservaSeleccionada
                          .expira_en
                      )
                    }
                  </strong>
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Asientos
                </h3>

                <div className="admin-reserva-asientos">
                  {(
                    reservaSeleccionada
                      .detalles
                    ?? []
                  ).map(
                    (detalle) => {
                      const asiento =
                        detalle
                          .funcion_asiento
                          ?.asiento

                      return (
                        <div
                          key={
                            detalle.id
                          }
                          className="admin-reserva-asiento"
                        >
                          <strong>
                            {
                              asiento
                                ? `${asiento.fila}${asiento.numero}`
                                : 'Sin asiento'
                            }
                          </strong>

                          <span>
                            {
                              formatearMonto(
                                detalle
                                  .precio
                              )
                            }
                          </span>

                          <small
                            className={
                              obtenerClaseDetalle(
                                detalle
                                  .estado
                              )
                            }
                          >
                            {
                              detalle
                                .estado
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

                <div className="admin-resumen-reserva">
                  <div>
                    <span>
                      Reservada
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          reservaSeleccionada
                            .reservada_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Expiración
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          reservaSeleccionada
                            .expira_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Convertida
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          reservaSeleccionada
                            .convertida_en
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
                          reservaSeleccionada
                            .cancelada_en
                        )
                      }
                    </strong>
                  </div>
                </div>

                {reservaSeleccionada
                  .motivo_cancelacion
                  && (
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

                {reservaSeleccionada
                  .venta
                  && (
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

              {reservaSeleccionada
                .estado
                === 'PENDIENTE'
                && (
                  <div className="admin-cancelacion-reserva-contenedor">
                    <div>
                      <strong>
                        ¿Necesitas cancelar esta reserva?
                      </strong>

                      <p>
                        Los asientos asociados
                        serán liberados y podrán
                        volver a seleccionarse.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-boton-cancelar-reserva"
                      disabled={
                        procesandoId
                        === reservaSeleccionada
                          .id
                      }
                      onClick={() =>
                        solicitarCancelarReserva(
                          reservaSeleccionada
                        )
                      }
                    >
                      {
                        procesandoId
                        === reservaSeleccionada
                          .id
                          ? 'Cancelando...'
                          : 'Cancelar reserva'
                      }
                    </button>
                  </div>
                )}
            </section>
          )}
        </div>
      </main>

      {reservaConfirmarCancelacion && (
        <div
          className="confirmacion-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target
              === event.currentTarget
            ) {
              cerrarConfirmacion()
            }
          }}
        >
          <section
            className="confirmacion-modal admin-confirmacion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelar-reserva-titulo"
          >
            <div className="confirmacion-icono admin-confirmacion-icono-peligro">
              !
            </div>

            <span className="confirmacion-etiqueta admin-confirmacion-etiqueta-peligro">
              CANCELAR RESERVA
            </span>

            <h2 id="cancelar-reserva-titulo">
              ¿Cancelar esta reserva?
            </h2>

            <p className="confirmacion-descripcion">
              Los asientos reservados
              serán liberados y podrán
              volver a ser seleccionados.
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Código
                </span>

                <strong>
                  {
                    reservaConfirmarCancelacion
                      .codigo
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
                      reservaConfirmarCancelacion
                    )
                  }
                </strong>
              </div>

              <div>
                <span>
                  Película
                </span>

                <strong>
                  {
                    reservaConfirmarCancelacion
                      .funcion
                      ?.pelicula
                      ?.titulo
                    ?? '-'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Total
                </span>

                <strong className="confirmacion-total">
                  {
                    formatearMonto(
                      reservaConfirmarCancelacion
                        .total
                    )
                  }
                </strong>
              </div>
            </div>

            <div className="reserva-cancelacion-campo">
              <label htmlFor="motivo_cancelacion">
                Motivo de cancelación
              </label>

              <textarea
                id="motivo_cancelacion"
                rows="4"
                value={
                  motivoCancelacion
                }
                onChange={(event) =>
                  setMotivoCancelacion(
                    event.target.value
                  )
                }
                placeholder="Describe brevemente el motivo..."
                disabled={
                  procesando
                }
              />

              <small>
                Mínimo 5 caracteres.
              </small>
            </div>

            <div className="admin-confirmacion-advertencia">
              <strong>
                Esta acción afecta
                los asientos
              </strong>

              <p>
                Al cancelar la reserva,
                los asientos asociados
                dejarán de estar reservados.
              </p>
            </div>

            <div className="confirmacion-acciones">
              <button
                type="button"
                className="confirmacion-cancelar"
                onClick={
                  cerrarConfirmacion
                }
                disabled={
                  procesando
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="admin-confirmacion-eliminar"
                onClick={
                  confirmarCancelarReserva
                }
                disabled={
                  procesando
                }
              >
                {
                  procesando
                    ? 'Cancelando...'
                    : 'Cancelar reserva'
                }
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminReservas