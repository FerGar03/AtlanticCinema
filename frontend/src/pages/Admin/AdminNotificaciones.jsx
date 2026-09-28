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



function AdminNotificaciones() {

  const [

    notificaciones,

    setNotificaciones,

  ] = useState([])



  const [

    canalesDisponibles,

    setCanalesDisponibles,

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

    procesandoId,

    setProcesandoId,

  ] = useState(null)



  const [

    notificacionSeleccionada,

    setNotificacionSeleccionada,

  ] = useState(null)



  const [

    notificacionConfirmarProceso,

    setNotificacionConfirmarProceso,

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

    canalFiltro,

    setCanalFiltro,

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



  const cargarNotificaciones =

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

          canalFiltro

          !== 'TODOS'

        ) {

          params.canal =

            canalFiltro

        }



        const respuesta =

          await api.get(

            '/notificaciones',

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



        setNotificaciones(

          respuesta.data.data

          ?? []

        )



        setPaginacion(

          meta

        )



        setCanalesDisponibles(

          respuesta.data

            .filtros

            ?.canales

          ?? []

        )

      } catch (err) {

        setError(

          err.response?.data

            ?.message

          ?? 'No fue posible cargar las notificaciones.'

        )



        setNotificaciones([])



        setPaginacion(

          paginacionInicial

        )

      } finally {

        setCargando(false)

      }

    }



  useEffect(() => {

    cargarNotificaciones()

  }, [

    pagina,

    porPagina,

    busquedaAplicada,

    estadoFiltro,

    canalFiltro,

  ])



  const limpiarMensajes =

    () => {

      setMensaje('')

      setError('')

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



      setNotificacionSeleccionada(

        null

      )

    }



  const cambiarCanalFiltro =

    (valor) => {

      setCanalFiltro(

        valor

      )



      setPagina(1)



      setNotificacionSeleccionada(

        null

      )

    }



  const cambiarPorPagina =

    (valor) => {

      setPorPagina(

        valor

      )



      setPagina(1)



      setNotificacionSeleccionada(

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



      setNotificacionSeleccionada(

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

      setCanalFiltro('TODOS')

      setPagina(1)



      setNotificacionSeleccionada(

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



  const obtenerNombreUsuario =

    (notificacion) => {

      const usuario =

        notificacion.usuario



      if (!usuario) {

        return '-'

      }



      return `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim()

    }



  const obtenerReferencia =

    (notificacion) => {

      if (

        notificacion.ticket

          ?.codigo

      ) {

        return {

          tipo:

            'Ticket',



          valor:

            notificacion

              .ticket

              .codigo,

        }

      }



      if (

        notificacion.factura

          ?.numero_interno

      ) {

        return {

          tipo:

            'Factura',



          valor:

            notificacion

              .factura

              .numero_interno,

        }

      }



      if (

        notificacion.venta

          ?.numero_venta

      ) {

        return {

          tipo:

            'Venta',



          valor:

            notificacion

              .venta

              .numero_venta,

        }

      }



      if (

        notificacion.reserva

          ?.codigo

      ) {

        return {

          tipo:

            'Reserva',



          valor:

            notificacion

              .reserva

              .codigo,

        }

      }



      return {

        tipo:

          'Sin referencia',



        valor:

          '-',

      }

    }



  const solicitarProcesarNotificacion =

    (notificacion) => {

      if (

        ![
          'PENDIENTE',
          'ERROR',
        ].includes(
          notificacion.estado
        )

      ) {

        return

      }



      limpiarMensajes()



      setNotificacionConfirmarProceso(

        notificacion

      )

    }



  const cerrarConfirmacion =

    () => {

      if (procesandoId) {

        return

      }



      setNotificacionConfirmarProceso(

        null

      )

    }



  const procesarNotificacion =

    async () => {

      if (

        !notificacionConfirmarProceso

      ) {

        return

      }



      const notificacion =

        notificacionConfirmarProceso



      try {

        setProcesandoId(

          notificacion.id

        )



        limpiarMensajes()



        const respuesta =

          await api.post(

            '/notificaciones/procesar',

            {

              notificacion_id:

                notificacion.id,

            }

          )



        setMensaje(

          notificacion.estado === 'ERROR'
            ? 'Notificación reenviada correctamente.'
            : 'Notificación procesada correctamente.'

        )



        setNotificacionSeleccionada(

          respuesta.data.data

        )



        setNotificacionConfirmarProceso(

          null

        )



        await cargarNotificaciones()



        window.scrollTo({

          top: 0,

          behavior: 'smooth',

        })

      } catch (err) {

        setNotificacionConfirmarProceso(

          null

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

        setProcesandoId(

          null

        )

      }

    }



  const verDetalle =

    async (notificacion) => {

      try {

        setCargandoDetalle(

          true

        )



        setError('')



        const respuesta =

          await api.get(

            `/notificaciones/${notificacion.id}`

          )



        setNotificacionSeleccionada(

          respuesta.data.data

        )



        setTimeout(

          () => {

            document

              .getElementById(

                'admin-detalle-notificacion'

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

          ?? 'No fue posible cargar el detalle de la notificación.'

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



        case 'ENVIADA':

          return (

            'admin-estado-enviada'

          )



        case 'ERROR':

          return (

            'admin-estado-error'

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

    || canalFiltro

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

                Notificaciones

              </h1>



              <p>

                Consulta y procesa las

                notificaciones generadas

                por Atlantic Cinema.

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

                  Notificaciones registradas

                </h2>



                <p>

                  {paginacion.total}

                  {' '}

                  notificación(es)

                  encontrada(s).

                </p>

              </div>



              <div className="admin-filtros-notificaciones">

                <input

                  className="admin-buscador"

                  type="search"

                  placeholder="Usuario, destinatario, referencia..."

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



                  <option value="ENVIADA">

                    ENVIADA

                  </option>



                  <option value="ERROR">

                    ERROR

                  </option>

                </select>



                <select

                  value={

                    canalFiltro

                  }

                  onChange={(event) =>

                    cambiarCanalFiltro(

                      event

                        .target

                        .value

                    )

                  }

                >

                  <option value="TODOS">

                    Todos los canales

                  </option>



                  {canalesDisponibles.map(

                    (canal) => (

                      <option

                        key={

                          canal

                        }

                        value={

                          canal

                        }

                      >

                        {canal}

                      </option>

                    )

                  )}

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

                  Cargando notificaciones...

                </p>

              </div>

            ) : notificaciones.length

              === 0 ? (

                <div className="admin-listado-vacio">

                  <p>

                    No se encontraron

                    notificaciones con los

                    filtros seleccionados.

                  </p>

                </div>

              ) : (

                <>

                  <div className="admin-tabla-contenedor">

                    <table className="admin-tabla admin-tabla-notificaciones">

                      <thead>

                        <tr>

                          <th>

                            Notificación

                          </th>



                          <th>

                            Usuario

                          </th>



                          <th>

                            Canal

                          </th>



                          <th>

                            Destinatario

                          </th>



                          <th>

                            Asunto

                          </th>



                          <th>

                            Referencia

                          </th>



                          <th>

                            Estado

                          </th>



                          <th>

                            Enviada

                          </th>



                          <th>

                            Acciones

                          </th>

                        </tr>

                      </thead>



                      <tbody>

                        {notificaciones.map(

                          (notificacion) => {

                            const filaProcesando =

                              procesandoId

                              === notificacion.id



                            const referencia =

                              obtenerReferencia(

                                notificacion

                              )



                            return (

                              <tr

                                key={

                                  notificacion.id

                                }

                              >

                                <td>

                                  <div className="notificacion-tabla-id">

                                    <strong>

                                      #

                                      {

                                        notificacion

                                          .id

                                      }

                                    </strong>



                                    <span>

                                      {

                                        notificacion

                                          .tipo

                                        ?? 'Notificación'

                                      }

                                    </span>

                                  </div>

                                </td>



                                <td>

                                  <div className="notificacion-tabla-usuario">

                                    <strong>

                                      {

                                        obtenerNombreUsuario(

                                          notificacion

                                        )

                                      }

                                    </strong>



                                    <span>

                                      {

                                        notificacion

                                          .usuario

                                          ?.correo

                                        ?? '-'

                                      }

                                    </span>

                                  </div>

                                </td>



                                <td>

                                  <span className="notificacion-tabla-canal">

                                    {

                                      notificacion

                                        .canal

                                    }

                                  </span>

                                </td>



                                <td>

                                  <span className="notificacion-tabla-destinatario">

                                    {

                                      notificacion

                                        .destinatario

                                    }

                                  </span>

                                </td>



                                <td>

                                  <span className="notificacion-tabla-asunto">

                                    {

                                      notificacion

                                        .asunto

                                      ?? '-'

                                    }

                                  </span>

                                </td>



                                <td>

                                  <div className="notificacion-tabla-referencia">

                                    <strong>

                                      {

                                        referencia

                                          .tipo

                                      }

                                    </strong>



                                    <span>

                                      {

                                        referencia

                                          .valor

                                      }

                                    </span>

                                  </div>

                                </td>



                                <td>

                                  <span

                                    className={

                                      obtenerClaseEstado(

                                        notificacion

                                          .estado

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

                                  <span className="notificacion-tabla-fecha">

                                    {

                                      formatearFecha(

                                        notificacion

                                          .enviada_en

                                      )

                                    }

                                  </span>

                                </td>



                                <td>

                                  <div className="admin-tabla-acciones notificacion-tabla-acciones">

                                    <button

                                      type="button"

                                      disabled={

                                        filaProcesando

                                        || cargandoDetalle

                                      }

                                      onClick={() =>

                                        verDetalle(

                                          notificacion

                                        )

                                      }

                                    >

                                      Ver detalle

                                    </button>



                                    {[
                                      'PENDIENTE',
                                      'ERROR',
                                    ].includes(
                                      notificacion.estado
                                    ) && (

                                      <button

                                        type="button"

                                        className="notificacion-boton-procesar"

                                        disabled={

                                          filaProcesando

                                        }

                                        onClick={() =>

                                          solicitarProcesarNotificacion(

                                            notificacion

                                          )

                                        }

                                      >

                                        {filaProcesando
                                          ? 'Procesando...'
                                          : notificacion.estado === 'ERROR'
                                            ? 'Reintentar envío'
                                            : 'Procesar'}

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



          {notificacionSeleccionada && (

            <section

              className="admin-seccion"

              id="admin-detalle-notificacion"

            >

              <div className="admin-seccion-titulo">

                <div>

                  <p className="admin-etiqueta">

                    DETALLE

                  </p>



                  <h2>

                    Notificación

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

                        .estado

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

                  <span>

                    Usuario

                  </span>



                  <strong>

                    {

                      obtenerNombreUsuario(

                        notificacionSeleccionada

                      )

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Canal

                  </span>



                  <strong>

                    {

                      notificacionSeleccionada

                        .canal

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Destinatario

                  </span>



                  <strong className="notificacion-detalle-destinatario">

                    {

                      notificacionSeleccionada

                        .destinatario

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Estado

                  </span>



                  <strong>

                    {

                      notificacionSeleccionada

                        .estado

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Enviada

                  </span>



                  <strong>

                    {

                      formatearFecha(

                        notificacionSeleccionada

                          .enviada_en

                      )

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Leída

                  </span>



                  <strong>

                    {

                      formatearFecha(

                        notificacionSeleccionada

                          .leida_en

                      )

                    }

                  </strong>

                </div>

              </div>



              <div className="admin-detalle-bloque">

                <h3>

                  Contenido

                </h3>



                <div className="admin-contenido-notificacion">

                  <span className="notificacion-contenido-etiqueta">

                    ASUNTO

                  </span>



                  <strong>

                    {

                      notificacionSeleccionada

                        .asunto

                      ?? 'Sin asunto'

                    }

                  </strong>



                  <span className="notificacion-contenido-etiqueta">

                    MENSAJE

                  </span>



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

                    <span>

                      Venta

                    </span>



                    <strong>

                      {

                        notificacionSeleccionada

                          .venta

                          ?.numero_venta

                        ?? '-'

                      }

                    </strong>

                  </div>



                  <div>

                    <span>

                      Reserva

                    </span>



                    <strong>

                      {

                        notificacionSeleccionada

                          .reserva

                          ?.codigo

                        ?? '-'

                      }

                    </strong>

                  </div>



                  <div>

                    <span>

                      Factura

                    </span>



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

                    <span>

                      Ticket

                    </span>



                    <strong>

                      {

                        notificacionSeleccionada

                          .ticket

                          ?.codigo

                        ?? '-'

                      }

                    </strong>

                  </div>

                </div>

              </div>



              {[
                'PENDIENTE',
                'ERROR',
              ].includes(
                notificacionSeleccionada.estado
              ) && (

                <div className="notificacion-procesar-contenedor">

                  <div>

                    <strong>

                      {notificacionSeleccionada.estado === 'ERROR'
                        ? 'Error en el envío'
                        : 'Notificación pendiente'}

                    </strong>



                    <p>

                      {notificacionSeleccionada.estado === 'ERROR'
                        ? 'El envío anterior no pudo completarse. Puedes volver a intentarlo.'
                        : 'Esta notificación todavía no ha sido procesada por el sistema.'}

                    </p>

                  </div>



                  <button

                    type="button"

                    className="notificacion-boton-procesar-principal"

                    disabled={

                      procesandoId

                      === notificacionSeleccionada

                        .id

                    }

                    onClick={() =>

                      solicitarProcesarNotificacion(

                        notificacionSeleccionada

                      )

                    }

                  >

                    {procesandoId

                      === notificacionSeleccionada

                        .id

                      ? 'Procesando...'

                      : notificacionSeleccionada.estado === 'ERROR'
                        ? 'Reintentar envío'
                        : 'Procesar notificación'}

                  </button>

                </div>

              )}

            </section>

          )}

        </div>

      </main>



      {notificacionConfirmarProceso && (

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

            aria-labelledby="procesar-notificacion-titulo"

          >

            <div className="confirmacion-icono confirmacion-icono-reserva">

              ✓

            </div>



            <span className="confirmacion-etiqueta">

              {notificacionConfirmarProceso.estado === 'ERROR'
                ? 'REINTENTAR ENVÍO'
                : 'PROCESAR NOTIFICACIÓN'}

            </span>



            <h2 id="procesar-notificacion-titulo">

              {notificacionConfirmarProceso.estado === 'ERROR'
                ? '¿Reintentar el envío?'
                : '¿Procesar esta notificación?'}

            </h2>



            <p className="confirmacion-descripcion">

              {notificacionConfirmarProceso.estado === 'ERROR'
                ? 'Se volverá a intentar el envío de esta notificación.'
                : 'Se ejecutará el envío configurado para esta notificación.'}

            </p>



            <div className="confirmacion-resumen">

              <div>

                <span>

                  Notificación

                </span>



                <strong>

                  #

                  {

                    notificacionConfirmarProceso

                      .id

                  }

                </strong>

              </div>



              <div>

                <span>

                  Canal

                </span>



                <strong>

                  {

                    notificacionConfirmarProceso

                      .canal

                  }

                </strong>

              </div>



              <div>

                <span>

                  Destinatario

                </span>



                <strong className="notificacion-confirmacion-destinatario">

                  {

                    notificacionConfirmarProceso

                      .destinatario

                  }

                </strong>

              </div>



              <div>

                <span>

                  Estado actual

                </span>



                <strong>

                  {

                    notificacionConfirmarProceso

                      .estado

                  }

                </strong>

              </div>

            </div>



            <div className="notificacion-proceso-advertencia">

              <strong>

                Procesamiento de envío

              </strong>



              <p>

                {notificacionConfirmarProceso.estado === 'ERROR'
                  ? 'La notificación pasará de ERROR a ENVIADA si el reintento finaliza correctamente.'
                  : 'La notificación pasará de PENDIENTE a ENVIADA si el procesamiento finaliza correctamente.'}

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

                  procesarNotificacion

                }

                disabled={

                  procesando

                }

              >

                {procesando
                  ? 'Procesando...'
                  : notificacionConfirmarProceso.estado === 'ERROR'
                    ? 'Reintentar envío'
                    : 'Procesar notificación'}

              </button>

            </div>

          </section>

        </div>

      )}

    </div>

  )

}



export default AdminNotificaciones