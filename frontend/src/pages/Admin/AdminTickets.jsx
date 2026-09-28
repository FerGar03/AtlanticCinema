import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Html5Qrcode } from 'html5-qrcode'

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

function AdminTickets() {
  const [
    tickets,
    setTickets,
  ] = useState([])

  const [
    ventasDisponibles,
    setVentasDisponibles,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    procesando,
    setProcesando,
  ] = useState(false)

  const [
    procesandoVentaId,
    setProcesandoVentaId,
  ] = useState(null)

  const [
    procesandoPdf,
    setProcesandoPdf,
  ] = useState('')

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false)

  const [
    ticketSeleccionado,
    setTicketSeleccionado,
  ] = useState(null)

  const [
    tokenValidacion,
    setTokenValidacion,
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
    mensaje,
    setMensaje,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    confirmarValidacion,
    setConfirmarValidacion,
  ] = useState(false)

  const [
    escanerActivo,
    setEscanerActivo,
  ] = useState(false)

  const [
    iniciandoEscaner,
    setIniciandoEscaner,
  ] = useState(false)

  const [
    mensajeEscaner,
    setMensajeEscaner,
  ] = useState('')

  const qrScannerRef =
    useRef(null)

  const procesandoEscaneoRef =
    useRef(false)

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

  const limpiarMensajes =
    () => {
      setMensaje('')
      setError('')
    }

  const cargarVentasDisponibles =
    async () => {
      try {
        const respuesta =
          await api.get(
            '/tickets/ventas-disponibles'
          )

        setVentasDisponibles(
          respuesta.data.data
          ?? []
        )
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )
      }
    }

  const cargarTickets =
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
            '/tickets',
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

        setTickets(
          respuesta.data.data
          ?? []
        )

        setPaginacion(
          meta
        )
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )

        setTickets([])

        setPaginacion(
          paginacionInicial
        )
      } finally {
        setCargando(false)
      }
    }

  useEffect(() => {
    cargarVentasDisponibles()
  }, [])

  useEffect(() => {
    cargarTickets()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    estadoFiltro,
  ])

  useEffect(() => {
    return () => {
      const scanner =
        qrScannerRef.current

      if (!scanner) {
        return
      }

      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => {
            try {
              scanner.clear()
            } catch {
              // No requiere acción.
            }
          })
          .catch(() => {})
      } else {
        try {
          scanner.clear()
        } catch {
          // No requiere acción.
        }
      }
    }
  }, [])

  const cambiarEstadoFiltro =
    (valor) => {
      setEstadoFiltro(
        valor
      )

      setPagina(1)

      setTicketSeleccionado(
        null
      )
    }

  const cambiarPorPagina =
    (valor) => {
      setPorPagina(
        valor
      )

      setPagina(1)

      setTicketSeleccionado(
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

      setTicketSeleccionado(
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

      setTicketSeleccionado(
        null
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

  const formatearMonto =
    (valor) => {
      return `Q${Number(
        valor ?? 0
      ).toFixed(2)}`
    }

  const obtenerCliente =
    (ticket) => {
      const cliente =
        ticket.entrada
          ?.venta
          ?.cliente

      if (!cliente) {
        return '-'
      }

      return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`
        .trim()
        || '-'
    }

  const obtenerClienteVenta =
    (venta) => {
      const cliente =
        venta?.cliente

      if (!cliente) {
        return '-'
      }

      return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`
        .trim()
        || '-'
    }

  const generarTicketsFaltantes =
    async (
      venta
    ) => {
      try {
        setProcesandoVentaId(
          venta.id
        )

        limpiarMensajes()

        const respuesta =
          await api.post(
            '/tickets',
            {
              venta_id:
                Number(
                  venta.id
                ),
            }
          )

        setMensaje(
          respuesta.data
            ?.message
          ?? 'Tickets faltantes generados correctamente.'
        )

        await Promise.all([
          cargarTickets(),
          cargarVentasDisponibles(),
        ])

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

        await cargarVentasDisponibles()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } finally {
        setProcesandoVentaId(
          null
        )
      }
    }

  const detenerEscaner =
    async () => {
      const scanner =
        qrScannerRef.current

      qrScannerRef.current =
        null

      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop()
          }
        } catch {
          // Puede estar detenida.
        }

        try {
          scanner.clear()
        } catch {
          // No requiere acción.
        }
      }

      procesandoEscaneoRef.current =
        false

      setEscanerActivo(false)

      setIniciandoEscaner(false)
    }

  const validarTokenEscaneado =
    async (
      textoQr
    ) => {
      const token =
        String(
          textoQr
          ?? ''
        ).trim()

      if (
        !token
        || procesandoEscaneoRef.current
      ) {
        return
      }

      procesandoEscaneoRef.current =
        true

      try {
        setProcesando(true)

        limpiarMensajes()

        setMensajeEscaner(
          'QR detectado. Validando ticket...'
        )

        const respuesta =
          await api.post(
            '/tickets/validar',
            {
              token_validacion:
                token,
            }
          )

        setTicketSeleccionado(
          respuesta.data.data
        )

        setTokenValidacion('')

        setMensaje(
          'Ticket validado correctamente. Acceso autorizado.'
        )

        setMensajeEscaner(
          'Acceso autorizado. El ticket fue marcado como UTILIZADO.'
        )

        await cargarTickets()

        await detenerEscaner()

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

        setMensajeEscaner(
          'El QR fue leído, pero el ticket no pudo validarse.'
        )

        await detenerEscaner()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } finally {
        procesandoEscaneoRef.current =
          false

        setProcesando(false)
      }
    }

  const iniciarEscaner =
    async () => {
      if (
        escanerActivo
        || iniciandoEscaner
      ) {
        return
      }

      try {
        limpiarMensajes()

        setMensajeEscaner(
          'Solicitando acceso a la cámara...'
        )

        setIniciandoEscaner(true)

        setEscanerActivo(true)

        await new Promise(
          (resolve) =>
            window.setTimeout(
              resolve,
              0
            )
        )

        const scanner =
          new Html5Qrcode(
            'ticket-qr-reader'
          )

        qrScannerRef.current =
          scanner

        await scanner.start(
          {
            facingMode:
              'environment',
          },
          {
            fps: 10,

            qrbox: {
              width: 240,
              height: 240,
            },
          },
          validarTokenEscaneado,
          () => {}
        )

        setMensajeEscaner(
          'Apunta la cámara al código QR del ticket.'
        )
      } catch {
        const scanner =
          qrScannerRef.current

        qrScannerRef.current =
          null

        if (scanner) {
          try {
            scanner.clear()
          } catch {
            // No requiere acción.
          }
        }

        setEscanerActivo(false)

        setMensajeEscaner('')

        setError(
          'No fue posible abrir la cámara. Verifica el permiso del navegador y que la página se abra mediante HTTPS o localhost.'
        )
      } finally {
        setIniciandoEscaner(false)
      }
    }

  const solicitarValidacion =
    (event) => {
      event.preventDefault()

      if (
        !tokenValidacion.trim()
      ) {
        return
      }

      limpiarMensajes()

      setConfirmarValidacion(
        true
      )
    }

  const cerrarConfirmacion =
    () => {
      if (procesando) {
        return
      }

      setConfirmarValidacion(
        false
      )
    }

  const validarTicket =
    async () => {
      if (
        !tokenValidacion.trim()
      ) {
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
                tokenValidacion
                  .trim(),
            }
          )

        setMensaje(
          'Ticket validado correctamente.'
        )

        setTicketSeleccionado(
          respuesta.data.data
        )

        setTokenValidacion('')

        setConfirmarValidacion(
          false
        )

        await cargarTickets()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setConfirmarValidacion(
          false
        )

        setError(
          obtenerPrimerError(
            err
          )
        )

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } finally {
        setProcesando(false)
      }
    }

  const verDetalle =
    async (
      ticket
    ) => {
      try {
        setCargandoDetalle(
          true
        )

        setError('')

        const respuesta =
          await api.get(
            `/tickets/${ticket.id}`
          )

        setTicketSeleccionado(
          respuesta.data.data
        )

        setTimeout(
          () => {
            document
              .getElementById(
                'admin-detalle-ticket'
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
          obtenerPrimerError(
            err
          )
        )
      } finally {
        setCargandoDetalle(
          false
        )
      }
    }

  const obtenerTicketPdf =
    async (
      ticket,
      accion
    ) => {
      if (!ticket?.id) {
        setError(
          'No fue posible identificar el ticket.'
        )

        return
      }

      const clave =
        `${ticket.id}-${accion}`

      setProcesandoPdf(
        clave
      )

      setError('')

      let ventanaPdf =
        null

      if (accion === 'ver') {
        ventanaPdf =
          window.open(
            '',
            '_blank'
          )

        if (ventanaPdf) {
          ventanaPdf.document.title =
            'Cargando ticket...'

          ventanaPdf.document.body.innerHTML =
            '<p style="font-family:Arial;padding:24px;">Cargando ticket de Atlantic Cinema...</p>'
        }
      }

      try {
        const respuesta =
          await api.get(
            `/tickets/${ticket.id}/pdf`,
            {
              params:
                accion === 'descargar'
                  ? {
                      descargar: 1,
                    }
                  : undefined,

              responseType:
                'blob',
            }
          )

        const blob =
          new Blob(
            [
              respuesta.data,
            ],
            {
              type:
                'application/pdf',
            }
          )

        const url =
          window.URL
            .createObjectURL(
              blob
            )

        if (accion === 'ver') {
          if (ventanaPdf) {
            ventanaPdf.location.href =
              url
          } else {
            window.open(
              url,
              '_blank'
            )
          }

          window.setTimeout(
            () => {
              window.URL
                .revokeObjectURL(
                  url
                )
            },
            60000
          )

          return
        }

        const enlace =
          document.createElement(
            'a'
          )

        enlace.href =
          url

        enlace.download =
          `Ticket-Atlantic-Cinema-${ticket.codigo ?? ticket.id}.pdf`

        document.body
          .appendChild(
            enlace
          )

        enlace.click()

        enlace.remove()

        window.setTimeout(
          () => {
            window.URL
              .revokeObjectURL(
                url
              )
          },
          1000
        )
      } catch (err) {
        if (ventanaPdf) {
          ventanaPdf.close()
        }

        let mensajePdf =
          'No fue posible obtener el PDF del ticket.'

        const data =
          err.response
            ?.data

        if (
          data instanceof Blob
        ) {
          try {
            const texto =
              await data.text()

            const json =
              JSON.parse(
                texto
              )

            mensajePdf =
              json.message
              ?? mensajePdf
          } catch {
            // Conservamos mensaje general.
          }
        } else {
          mensajePdf =
            obtenerPrimerError(
              err
            )
        }

        setError(
          mensajePdf
        )
      } finally {
        setProcesandoPdf('')
      }
    }

  const obtenerClaseEstado =
    (estado) => {
      switch (estado) {
        case 'ACTIVO':
          return (
            'admin-estado-activo'
          )

        case 'UTILIZADO':
          return (
            'admin-estado-utilizado'
          )

        case 'CANCELADO':
          return (
            'admin-estado-cancelado'
          )

        case 'INVALIDADO':
          return (
            'admin-estado-invalidado'
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
                Tickets
              </h1>

              <p>
                Consulta, valida y recupera
                los tickets electrónicos
                de Atlantic Cinema.
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
                  Validar ticket
                </h2>

                <p>
                  Registra el ingreso del
                  cliente utilizando el
                  código QR o el token del ticket.
                </p>
              </div>
            </div>

            <div
              className="ticket-ayuda-validacion"
              style={{
                marginBottom: '18px',
              }}
            >
              <strong>
                Escaneo con cámara
              </strong>

              <p>
                Escanea el QR del cliente.
                Al detectarlo, Atlantic Cinema
                validará el ticket automáticamente.
              </p>

              <div
                className="admin-form-acciones"
                style={{
                  marginTop: '12px',
                }}
              >
                {!escanerActivo ? (
                  <button
                    type="button"
                    onClick={
                      iniciarEscaner
                    }
                    disabled={
                      procesando
                      || iniciandoEscaner
                    }
                  >
                    {iniciandoEscaner
                      ? 'Abriendo cámara...'
                      : 'Escanear QR con cámara'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-boton-secundario"
                    onClick={
                      detenerEscaner
                    }
                    disabled={
                      procesando
                    }
                  >
                    Detener cámara
                  </button>
                )}
              </div>

              {escanerActivo && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '460px',
                    margin:
                      '16px auto 0',
                    overflow:
                      'hidden',
                    borderRadius:
                      '12px',
                    background:
                      '#0f141c',
                  }}
                >
                  <div
                    id="ticket-qr-reader"
                    style={{
                      width:
                        '100%',
                    }}
                  />
                </div>
              )}

              {mensajeEscaner && (
                <p
                  style={{
                    marginTop:
                      '12px',
                  }}
                >
                  {mensajeEscaner}
                </p>
              )}

              <p
                style={{
                  marginTop:
                    '10px',
                  opacity: 0.8,
                }}
              >
                En teléfono o tableta,
                permite el acceso a la cámara
                cuando el navegador lo solicite.
              </p>
            </div>

            <div
              style={{
                textAlign:
                  'center',

                margin:
                  '4px 0 18px',

                opacity: 0.7,

                fontSize:
                  '0.85rem',
              }}
            >
              O ingresa el token manualmente
            </div>

            <form
              className="admin-formulario"
              onSubmit={
                solicitarValidacion
              }
            >
              <label>
                Token de validación

                <input
                  type="text"
                  value={
                    tokenValidacion
                  }
                  onChange={(event) =>
                    setTokenValidacion(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ingrese o pegue el token..."
                  required
                />
              </label>

              <div className="ticket-ayuda-validacion">
                <strong>
                  Validación de acceso
                </strong>

                <p>
                  Al validar el ticket,
                  este cambiará a
                  UTILIZADO y la entrada
                  asociada quedará marcada
                  como UTILIZADA.
                </p>
              </div>

              <div className="admin-form-acciones">
                <button
                  type="submit"
                  disabled={
                    procesando
                  }
                >
                  Validar ticket
                </button>
              </div>
            </form>
          </section>

          <section className="admin-seccion">
            <div className="admin-seccion-titulo">
              <div>
                <h2>
                  Tickets registrados
                </h2>

                <p>
                  {paginacion.total}
                  {' '}
                  ticket(s) encontrado(s).
                </p>
              </div>

              <div className="admin-filtros-tickets">
                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Código, venta, cliente..."
                  value={
                    busqueda
                  }
                  onChange={(event) =>
                    setBusqueda(
                      event.target
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
                      event.target
                        .value
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
                  Cargando tickets...
                </p>
              </div>
            ) : tickets.length
              === 0 ? (
                <div className="admin-listado-vacio">
                  <p>
                    No se encontraron
                    tickets con los filtros
                    seleccionados.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="admin-tabla-contenedor"
                    style={{
                      overflowX:
                        'auto',
                    }}
                  >
                    <table
                      className="admin-tabla admin-tabla-tickets"
                      style={{
                        minWidth:
                          '1180px',
                      }}
                    >
                      <thead>
                        <tr>
                          <th>
                            Ticket
                          </th>

                          <th>
                            Cliente
                          </th>

                          <th>
                            Función
                          </th>

                          <th>
                            Asiento
                          </th>

                          <th>
                            Formato
                          </th>

                          <th>
                            Versión
                          </th>

                          <th>
                            Estado
                          </th>

                          <th>
                            Generado
                          </th>

                          <th>
                            Acciones
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {tickets.map(
                          (ticket) => {
                            const asiento =
                              ticket
                                .entrada
                                ?.funcion_asiento
                                ?.asiento

                            const funcion =
                              ticket
                                .entrada
                                ?.funcion_asiento
                                ?.funcion

                            return (
                              <tr
                                key={
                                  ticket.id
                                }
                              >
                                <td>
                                  <div className="ticket-tabla-codigo">
                                    <strong>
                                      {
                                        ticket
                                          .codigo
                                      }
                                    </strong>

                                    <span>
                                      Ticket #
                                      {
                                        ticket.id
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <div className="ticket-tabla-cliente">
                                    <strong>
                                      {
                                        obtenerCliente(
                                          ticket
                                        )
                                      }
                                    </strong>

                                    <span>
                                      {
                                        ticket
                                          .entrada
                                          ?.venta
                                          ?.cliente
                                          ?.correo
                                        ?? '-'
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <div className="ticket-tabla-funcion">
                                    <strong>
                                      {
                                        funcion
                                          ?.pelicula
                                          ?.titulo
                                        ?? '-'
                                      }
                                    </strong>

                                    <span>
                                      {
                                        funcion
                                          ?.sala
                                          ?.nombre
                                        ?? '-'
                                      }

                                      {' · '}

                                      {
                                        funcion
                                          ?.formato
                                          ?.nombre
                                        ?? '-'
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <strong className="ticket-tabla-asiento">
                                    {asiento
                                      ? `${asiento.fila}${asiento.numero}`
                                      : '-'}
                                  </strong>
                                </td>

                                <td>
                                  <span className="ticket-tabla-formato">
                                    {
                                      ticket
                                        .formato
                                    }
                                  </span>
                                </td>

                                <td>
                                  #
                                  {
                                    ticket
                                      .version
                                  }
                                </td>

                                <td>
                                  <span
                                    className={
                                      obtenerClaseEstado(
                                        ticket
                                          .estado
                                      )
                                    }
                                  >
                                    {
                                      ticket
                                        .estado
                                    }
                                  </span>
                                </td>

                                <td>
                                  <span className="ticket-tabla-fecha">
                                    {
                                      formatearFecha(
                                        ticket
                                          .generado_en
                                      )
                                    }
                                  </span>
                                </td>

                                <td>
                                  <div className="admin-tabla-acciones ticket-tabla-acciones">
                                    <button
                                      type="button"
                                      disabled={
                                        cargandoDetalle
                                        || Boolean(
                                          procesandoPdf
                                        )
                                      }
                                      onClick={() =>
                                        verDetalle(
                                          ticket
                                        )
                                      }
                                    >
                                      Ver detalle
                                    </button>

                                    <button
                                      type="button"
                                      className="admin-boton-secundario"
                                      disabled={
                                        Boolean(
                                          procesandoPdf
                                        )
                                      }
                                      onClick={() =>
                                        obtenerTicketPdf(
                                          ticket,
                                          'ver'
                                        )
                                      }
                                    >
                                      {procesandoPdf
                                        === `${ticket.id}-ver`
                                          ? 'Abriendo...'
                                          : 'Ver PDF'}
                                    </button>

                                    <button
                                      type="button"
                                      className="admin-boton-secundario"
                                      disabled={
                                        Boolean(
                                          procesandoPdf
                                        )
                                      }
                                      onClick={() =>
                                        obtenerTicketPdf(
                                          ticket,
                                          'descargar'
                                        )
                                      }
                                    >
                                      {procesandoPdf
                                        === `${ticket.id}-descargar`
                                          ? 'Descargando...'
                                          : 'Descargar PDF'}
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

          {ticketSeleccionado && (
            <section
              className="admin-seccion"
              id="admin-detalle-ticket"
            >
              <div className="admin-seccion-titulo">
                <div>
                  <p className="admin-etiqueta">
                    DETALLE
                  </p>

                  <h2>
                    Ticket
                  </h2>

                  <p>
                    {
                      ticketSeleccionado
                        .codigo
                    }
                  </p>
                </div>

                <span
                  className={
                    obtenerClaseEstado(
                      ticketSeleccionado
                        .estado
                    )
                  }
                >
                  {
                    ticketSeleccionado
                      .estado
                  }
                </span>
              </div>

              <div className="admin-form-acciones">
                <button
                  type="button"
                  className="admin-boton-secundario"
                  disabled={
                    Boolean(
                      procesandoPdf
                    )
                  }
                  onClick={() =>
                    obtenerTicketPdf(
                      ticketSeleccionado,
                      'ver'
                    )
                  }
                >
                  Ver PDF
                </button>

                <button
                  type="button"
                  className="admin-boton-secundario"
                  disabled={
                    Boolean(
                      procesandoPdf
                    )
                  }
                  onClick={() =>
                    obtenerTicketPdf(
                      ticketSeleccionado,
                      'descargar'
                    )
                  }
                >
                  Descargar PDF
                </button>
              </div>

              <div className="admin-resumen-ticket">
                <div>
                  <span>
                    ID
                  </span>

                  <strong>
                    #
                    {ticketSeleccionado.id}
                  </strong>
                </div>

                <div>
                  <span>
                    Venta
                  </span>

                  <strong>
                    {
                      ticketSeleccionado
                        .entrada
                        ?.venta
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
                      obtenerCliente(
                        ticketSeleccionado
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
                      ticketSeleccionado
                        .entrada
                        ?.funcion_asiento
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
                      ticketSeleccionado
                        .entrada
                        ?.funcion_asiento
                        ?.funcion
                        ?.sala
                        ?.nombre
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Formato función
                  </span>

                  <strong>
                    {
                      ticketSeleccionado
                        .entrada
                        ?.funcion_asiento
                        ?.funcion
                        ?.formato
                        ?.nombre
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Asiento
                  </span>

                  <strong className="ticket-detalle-asiento">
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
                  <span>
                    Versión
                  </span>

                  <strong>
                    #
                    {
                      ticketSeleccionado
                        .version
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Formato ticket
                  </span>

                  <strong>
                    {
                      ticketSeleccionado
                        .formato
                    }
                  </strong>
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Trazabilidad
                </h3>

                <div className="admin-resumen-ticket">
                  <div>
                    <span>
                      Generado
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          ticketSeleccionado
                            .generado_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Utilizado
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          ticketSeleccionado
                            .utilizado_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cancelado
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          ticketSeleccionado
                            .cancelado_en
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Invalidado
                    </span>

                    <strong>
                      {
                        formatearFecha(
                          ticketSeleccionado
                            .invalidado_en
                        )
                      }
                    </strong>
                  </div>
                </div>
              </div>

              {ticketSeleccionado
                .motivo_invalidacion
                && (
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
                <h3>
                  Token de validación
                </h3>

                <div className="admin-token-ticket">
                  {
                    ticketSeleccionado
                      .token_validacion
                  }
                </div>

                {ticketSeleccionado
                  .estado
                  === 'ACTIVO'
                  && (
                    <button
                      type="button"
                      className="ticket-usar-token"
                      onClick={() => {
                        setTokenValidacion(
                          ticketSeleccionado
                            .token_validacion
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
                <h3>
                  Notificaciones
                </h3>

                {(
                  ticketSeleccionado
                    .notificaciones
                  ?? []
                ).length
                  === 0 ? (
                    <p>
                      No existen
                      notificaciones
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
                                notificacion
                                  .canal
                              }
                            </strong>

                            <span>
                              {
                                notificacion
                                  .estado
                              }
                            </span>

                            <small>
                              {
                                notificacion
                                  .destinatario
                              }
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            </section>
          )}

          <section className="admin-seccion">
            <div className="admin-seccion-titulo">
              <div>
                <p className="admin-etiqueta">
                  RECUPERACIÓN
                </p>

                <h2>
                  Incidencias de tickets
                </h2>

                <p>
                  Aquí aparecen únicamente
                  ventas pagadas con entradas
                  válidas que todavía no
                  poseen su ticket correspondiente.
                </p>
              </div>

              {ventasDisponibles.length
                > 0 && (
                  <span className="admin-etiqueta">
                    {
                      ventasDisponibles.length
                    }
                    {' '}
                    incidencias pendientes
                  </span>
                )}
            </div>

            {ventasDisponibles.length
              === 0 ? (
                <div className="admin-listado-vacio">
                  <strong>
                    Sin incidencias pendientes
                  </strong>

                  <p>
                    Todas las entradas válidas
                    de las ventas pagadas poseen
                    su ticket correspondiente.
                  </p>
                </div>
              ) : (
                <div
                  className="admin-tabla-contenedor"
                  style={{
                    maxHeight:
                      '430px',

                    overflowY:
                      'auto',

                    overflowX:
                      'auto',
                  }}
                >
                  <table
                    className="admin-tabla"
                    style={{
                      minWidth:
                        '1050px',
                    }}
                  >
                    <thead>
                      <tr>
                        <th>
                          Venta
                        </th>

                        <th>
                          Cliente
                        </th>

                        <th>
                          Película
                        </th>

                        <th>
                          Entradas
                        </th>

                        <th>
                          Faltantes
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {ventasDisponibles.map(
                        (venta) => {
                          const procesandoVenta =
                            procesandoVentaId
                            === venta.id

                          return (
                            <tr
                              key={
                                venta.id
                              }
                            >
                              <td>
                                <strong>
                                  {
                                    venta
                                      .numero_venta
                                  }
                                </strong>
                              </td>

                              <td>
                                <div className="ticket-tabla-cliente">
                                  <strong>
                                    {obtenerClienteVenta(
                                      venta
                                    )}
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
                                <div className="ticket-tabla-funcion">
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
                                </div>
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
                                <span className="admin-estado-pendiente">
                                  {
                                    venta
                                      .tickets_faltantes
                                    ?? 0
                                  }
                                </span>
                              </td>

                              <td>
                                <strong>
                                  {formatearMonto(
                                    venta.total
                                  )}
                                </strong>
                              </td>

                              <td>
                                <div className="admin-tabla-acciones">
                                  <button
                                    type="button"
                                    disabled={
                                      procesandoVentaId
                                      !== null
                                    }
                                    style={{
                                      whiteSpace:
                                        'nowrap',
                                    }}
                                    onClick={() =>
                                      generarTicketsFaltantes(
                                        venta
                                      )
                                    }
                                  >
                                    {procesandoVenta
                                      ? 'Generando...'
                                      : 'Generar tickets faltantes'}
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
              )}
          </section>
        </div>
      </main>

      {confirmarValidacion && (
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
            aria-labelledby="validar-ticket-titulo"
          >
            <div className="confirmacion-icono confirmacion-icono-reserva">
              ✓
            </div>

            <span className="confirmacion-etiqueta">
              VALIDAR TICKET
            </span>

            <h2 id="validar-ticket-titulo">
              ¿Confirmar ingreso?
            </h2>

            <p className="confirmacion-descripcion">
              Esta acción registrará el
              ticket como utilizado.
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Token
                </span>

                <strong className="ticket-confirmacion-token">
                  {
                    tokenValidacion
                      .trim()
                  }
                </strong>
              </div>

              <div>
                <span>
                  Nuevo estado
                </span>

                <strong className="confirmacion-total">
                  UTILIZADO
                </strong>
              </div>
            </div>

            <div className="ticket-validacion-advertencia">
              <strong>
                Validación definitiva
              </strong>

              <p>
                El ticket cambiará a
                UTILIZADO y la entrada
                asociada también quedará
                marcada como UTILIZADA.
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
                className="confirmacion-confirmar"
                onClick={
                  validarTicket
                }
                disabled={
                  procesando
                }
              >
                {procesando
                  ? 'Validando...'
                  : 'Confirmar ingreso'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminTickets