import {

  useEffect,

  useMemo,

  useState,

} from 'react'



import {

  Link,

  useParams,

} from 'react-router-dom'



import api from '../services/api'

import { useAuth } from '../context/AuthContext'

import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'



function TaquillaReservaDetalle() {

  const { id } = useParams()



  const { usuario } =

    useAuth()



  const [

    reserva,

    setReserva,

  ] = useState(null)



  const [

    venta,

    setVenta,

  ] = useState(null)



  const [

    pago,

    setPago,

  ] = useState(null)



  const [

    cargando,

    setCargando,

  ] = useState(true)



  const [

    procesandoVenta,

    setProcesandoVenta,

  ] = useState(false)



  const [

    procesandoPago,

    setProcesandoPago,

  ] = useState(false)



  const [

    confirmacion,

    setConfirmacion,

  ] = useState(null)



  const [

    modalPago,

    setModalPago,

  ] = useState(false)



  const [

    metodoPago,

    setMetodoPago,

  ] = useState('')



  const [

    efectivoRecibido,

    setEfectivoRecibido,

  ] = useState('')



  const [

    proveedorPos,

    setProveedorPos,

  ] = useState('')



  const [

    referenciaPos,

    setReferenciaPos,

  ] = useState('')



  const [

    autorizacionPos,

    setAutorizacionPos,

  ] = useState('')



  const [

    tipoFacturacion,

    setTipoFacturacion,

  ] = useState('CF')



  const [

    nitReceptor,

    setNitReceptor,

  ] = useState('')



  const [

    nombreReceptor,

    setNombreReceptor,

  ] = useState('')



  
  const [
    consultandoNit,
    setConsultandoNit,
  ] = useState(false)

const [

    documentos,

    setDocumentos,

  ] = useState(null)



  const [

    procesandoDocumento,

    setProcesandoDocumento,

  ] = useState('')



  const [

    error,

    setError,

  ] = useState('')



  useEffect(() => {

    const cargarReserva =

      async () => {

        try {

          setError('')



          const response =

            await api.get(

              `/reservas/${id}`

            )



          const data =

            response.data.data

            ?? response.data



          setReserva(data)

        } catch (err) {

          setError(

            err.response?.data

              ?.message

            || 'No fue posible cargar la reserva.'

          )

        } finally {

          setCargando(false)

        }

      }



    cargarReserva()

  }, [id])



  const asientos =

    useMemo(() => {

      if (

        !reserva?.detalles

      ) {

        return []

      }



      return reserva.detalles

        .map(

          (detalle) => {

            const asiento =

              detalle.funcion_asiento

                ?.asiento

              ?? detalle.funcionAsiento

                ?.asiento



            if (!asiento) {

              return null

            }



            return `${asiento.fila}${asiento.numero}`

          }

        )

        .filter(Boolean)

    }, [reserva])



  const formatearFecha = (

    fecha

  ) => {

    if (!fecha) {

      return 'No disponible'

    }



    return new Intl.DateTimeFormat(

      'es-GT',

      {

        timeZone:

          'America/Guatemala',

        dateStyle: 'medium',

        timeStyle: 'short',

      }

    ).format(

      new Date(fecha)

    )

  }



  const formatearMonto = (

    valor

  ) => {

    return `Q${Number(

      valor ?? 0

    ).toFixed(2)}`

  }



  const obtenerErrores = (

    err,

    mensajePredeterminado

  ) => {

    const errores =

      err.response?.data?.errors



    if (errores) {

      return Object.values(

        errores

      )

        .flat()

        .join(' ')

    }



    return (

      err.response?.data?.message

      || mensajePredeterminado

    )

  }



  const obtenerTextoEstadoReserva = (

    estado

  ) => {

    switch (estado) {

      case 'PENDIENTE':

        return 'Pendiente'



      case 'CONVERTIDA':

        return 'Confirmada'



      case 'CANCELADA':

        return 'Cancelada'



      case 'VENCIDA':

      case 'EXPIRADA':

        return 'Vencida'



      default:

        return estado

    }

  }



  const obtenerClaseEstadoReserva = (

    estado

  ) => {

    switch (estado) {

      case 'PENDIENTE':

        return 'taquilla-estado taquilla-estado-pendiente'



      case 'CONVERTIDA':

        return 'taquilla-estado taquilla-estado-confirmada'



      case 'CANCELADA':

        return 'taquilla-estado taquilla-estado-cancelada'



      case 'VENCIDA':

      case 'EXPIRADA':

        return 'taquilla-estado taquilla-estado-vencida'



      default:

        return 'taquilla-estado'

    }

  }



  const cerrarConfirmacion =

    () => {

      if (

        procesandoVenta

        || procesandoPago

      ) {

        return

      }



      setConfirmacion(null)

    }



  const convertirEnVenta =

    async () => {

      setError('')

      setProcesandoVenta(true)



      try {

        const response =

          await api.post(

            '/ventas/desde-reserva',

            {

              reserva_id:

                reserva.id,

            }

          )



        const data =

          response.data.data

          ?? response.data



        setVenta(data)



        setReserva(

          (actual) => ({

            ...actual,

            estado:

              'CONVERTIDA',

          })

        )



        setConfirmacion(null)

      } catch (err) {

        setError(

          obtenerErrores(

            err,

            'No fue posible convertir la reserva en venta.'

          )

        )



        setConfirmacion(null)

      } finally {

        setProcesandoVenta(false)

      }

    }



  const abrirPago =

    () => {

      setMetodoPago('')

      setEfectivoRecibido('')

      setProveedorPos('')

      setReferenciaPos('')

      setAutorizacionPos('')

      setTipoFacturacion('CF')

      setNitReceptor('')

      setNombreReceptor('')

      setError('')

      setModalPago(true)

    }



  const cerrarPago =

    () => {

      if (
      procesandoPago
      || consultandoNit
    ) {
      return
    }



      setModalPago(false)

    }



  const totalVenta =

    Number(

      venta?.total

      ?? reserva?.total

      ?? 0

    )



  const efectivoNumero =

    Number(

      efectivoRecibido

      || 0

    )



  const cambio =

    Math.max(

      0,

      efectivoNumero

      - totalVenta

    )



  const consultarNit =
    async () => {
      const nit =
        nitReceptor.trim()

      if (!nit) {
        setNombreReceptor('')
        setError(
          'Ingresa el NIT para consultar los datos fiscales.'
        )

        return false
      }

      setConsultandoNit(true)
      setError('')
      setNombreReceptor('')

      try {
        const response =
          await api.post(
            '/pagos/consultar-nit',
            {
              nit,
            }
          )

        const data =
          response.data.data
          ?? response.data

        setNitReceptor(
          data.nit
          ?? nit
        )

        setNombreReceptor(
          data.nombre
          ?? ''
        )

        return Boolean(
          data.nombre
        )
      } catch (err) {
        setNombreReceptor('')

        setError(
          obtenerErrores(
            err,
            'No fue posible consultar el NIT.'
          )
        )

        return false
      } finally {
        setConsultandoNit(false)
      }
    }



  const registrarPago =

    async () => {

      if (!venta) {

        setError(

          'Primero debe convertir la reserva en una venta.'

        )



        return

      }



      if (!metodoPago) {

        setError(

          'Selecciona un método de pago.'

        )



        return

      }



      if (

        metodoPago

        === 'EFECTIVO'

        && efectivoNumero

        < totalVenta

      ) {

        setError(

          'El efectivo recibido es menor que el total de la venta.'

        )



        return

      }



      if (

        metodoPago

        === 'TARJETA'

        && !proveedorPos.trim()

      ) {

        setError(

          'Ingresa el proveedor del POS.'

        )



        return

      }



      if (

        metodoPago

        === 'TARJETA'

        && !autorizacionPos.trim()

      ) {

        setError(

          'Ingresa el código de autorización del POS.'

        )



        return

      }



      if (

        tipoFacturacion === 'NIT'

        && !nitReceptor.trim()

      ) {

        setError(

          'Ingresa el NIT para la factura.'

        )



        return

      }



      if (
        tipoFacturacion === 'NIT'
        && !nombreReceptor.trim()
      ) {
        const nitValido =
          await consultarNit()

        if (!nitValido) {
          return
        }
      }



setError('')

      setProcesandoPago(true)



      try {

        const payload = {

          venta_id:

            venta.id,



          metodo:

            metodoPago,



          nit_receptor:

            tipoFacturacion === 'CF'

              ? 'CF'

              : nitReceptor.trim(),

        }



        if (

          metodoPago

          === 'EFECTIVO'

        ) {

          payload.efectivo_recibido =

            efectivoNumero

        }



        if (

          metodoPago

          === 'TARJETA'

        ) {

          payload.proveedor_pos =

            proveedorPos.trim()



          payload.referencia_proveedor =

            referenciaPos.trim()

            || null



          payload.autorizacion_codigo =

            autorizacionPos.trim()

        }



        const response =

          await api.post(

            '/pagos/taquilla',

            payload

          )



        const data =

          response.data.data

          ?? response.data



        setPago(data)

        setDocumentos(

          response.data.documentos

          ?? null

        )



        setVenta(

          (actual) => ({

            ...actual,

            estado:

              'PAGADA',

          })

        )



        setModalPago(false)

      } catch (err) {

        setError(

          obtenerErrores(

            err,

            'No fue posible registrar el pago.'

          )

        )

      } finally {

        setProcesandoPago(false)

      }

    }



  const obtenerDocumento = async (

    ruta,

    nombreArchivo,

    abrir = false

  ) => {

    try {

      setProcesandoDocumento(

        ruta

      )



      setError('')



      const response =

        await api.get(

          ruta,

          {

            responseType:

              'blob',

          }

        )



      const url =

        window.URL.createObjectURL(

          response.data

        )



      if (abrir) {

        window.open(

          url,

          '_blank',

          'noopener,noreferrer'

        )



        window.setTimeout(

          () =>

            window.URL.revokeObjectURL(

              url

            ),

          60000

        )



        return

      }



      const enlace =

        document.createElement(

          'a'

        )



      enlace.href = url

      enlace.download =

        nombreArchivo



      document.body.appendChild(

        enlace

      )



      enlace.click()

      enlace.remove()



      window.URL.revokeObjectURL(

        url

      )

    } catch (err) {

      setError(

        obtenerErrores(

          err,

          'No fue posible obtener el documento.'

        )

      )

    } finally {

      setProcesandoDocumento('')

    }

  }



  if (cargando) {

    return (

      <main className="taquilla-detalle-pagina">

        <div className="taquilla-cargando">

          <div className="cartelera-spinner" />



          <p>

            Cargando reserva...

          </p>

        </div>

      </main>

    )

  }



  if (

    error

    && !reserva

  ) {

    return (

      <main className="taquilla-detalle-pagina">

        <div className="taquilla-error-carga">

          <div className="taquilla-marca">

            <img

              src={logoAtlantic}

              alt="Atlantic Cinema"

              className="taquilla-logo taquilla-logo-imagen"

            />



            <div>

              <strong>

                Atlantic Cinema

              </strong>



              <span>

                Taquilla

              </span>

            </div>

          </div>



          <h1>

            No se pudo cargar la reserva

          </h1>



          <p>

            {error}

          </p>



          <Link

            to="/taquilla/reservas"

            className="taquilla-boton-secundario"

          >

            Volver a taquilla

          </Link>

        </div>

      </main>

    )

  }



  if (!reserva) {

    return null

  }



  const nombreCliente =

    `${reserva.usuario?.nombres ?? ''} ${reserva.usuario?.apellidos ?? ''}`

      .trim()

    || 'Sin cliente'



  const nombreEmpleado =

    [

      usuario?.nombres,

      usuario?.apellidos,

    ]

      .filter(Boolean)

      .join(' ')

      .trim()

    || 'Usuario'



  const puedeConvertir =

    reserva.estado

    === 'PENDIENTE'

    && !venta



  const puedeCobrar =

    venta

    && venta.estado

      === 'PENDIENTE'

    && !pago



  const pasosAtencion = [

    {

      titulo:

        'Reserva registrada',

      descripcion:

        'La reserva fue creada y sus asientos quedaron retenidos.',

      estado:

        'completado',

    },

    {

      titulo:

        'Convertir en venta',

      descripcion:

        'La operación pasa de reserva a venta presencial.',

      estado:

        venta

          ? 'completado'

          : (

            reserva.estado

            === 'PENDIENTE'

              ? 'activo'

              : 'pendiente'

          ),

    },

    {

      titulo:

        'Registrar pago',

      descripcion:

        'Se confirma el pago recibido en caja mediante efectivo o tarjeta POS.',

      estado:

        pago

        || venta?.estado

          === 'PAGADA'

          ? 'completado'

          : (

            venta

              ? 'activo'

              : 'pendiente'

          ),

    },

    {

      titulo:

        'Entrega final',

      descripcion:

        'Los tickets y procesos posteriores continúan después del cobro.',

      estado:

        pago

        || venta?.estado

          === 'PAGADA'

          ? 'activo'

          : 'pendiente',

    },

  ]



  return (

    <main className="taquilla-detalle-pagina">

      <header className="taquilla-navbar">

        <Link

          to="/"

          className="taquilla-marca"

        >

          <img

            src={logoAtlantic}

            alt="Atlantic Cinema"

            className="taquilla-logo taquilla-logo-imagen"

          />



          <div>

            <strong>

              Atlantic Cinema

            </strong>



            <span>

              Taquilla

            </span>

          </div>

        </Link>



        <nav className="funcion-nav">

          <Link

            to="/perfil"

            className="taquilla-volver"

          >

            Mi perfil

          </Link>



          <Link

            to="/taquilla/reservas"

            className="taquilla-volver"

          >

            ← Volver a reservas

          </Link>

        </nav>

      </header>



      <div className="taquilla-detalle-contenido">

        <section className="taquilla-detalle-encabezado taquilla-cabecera-extendida">

          <div className="taquilla-cabecera-principal">

            <p className="taquilla-etiqueta">

              ATENCIÓN EN TAQUILLA

            </p>



            <h1>

              Reserva

            </h1>



            <p>

              Consulta los datos de la

              operación, confirma el cobro

              presencial y continúa el

              flujo de atención del cliente.

            </p>



            <div className="taquilla-accesos">

              <Link

                to="/taquilla/venta"

                className="taquilla-acceso"

              >

                Venta presencial

              </Link>



              <Link

                to="/taquilla/reservas"

                className="taquilla-acceso taquilla-acceso-activo"

              >

                Reservas

              </Link>



              <Link

                to="/taquilla/tickets"

                className="taquilla-acceso"

              >

                Validar tickets

              </Link>

            </div>

          </div>



          <div className="taquilla-encabezado-lateral">

            <div className="taquilla-empleado taquilla-empleado-destacado">

              <span>

                SESIÓN ACTIVA

              </span>



              <strong>

                {nombreEmpleado}

              </strong>



              <small>

                {

                  usuario?.rol

                    ?.nombre

                  ?? '-'

                }

              </small>

            </div>



            <div className="taquilla-panel-mini">

              <span>

                ESTADO DE LA RESERVA

              </span>



              <div className="taquilla-panel-mini-valor">

                <span

                  className={

                    obtenerClaseEstadoReserva(

                      reserva.estado

                    )

                  }

                >

                  {

                    obtenerTextoEstadoReserva(

                      reserva.estado

                    )

                  }

                </span>

              </div>

            </div>

          </div>

        </section>



        {error && (

          <div className="taquilla-mensaje-error">

            {error}

          </div>

        )}



        <div className="taquilla-detalle-grid taquilla-detalle-grid-mejorada">

          <div className="taquilla-detalle-principal">

            <section className="taquilla-panel taquilla-panel-destacado">

              <div className="taquilla-panel-titulo taquilla-panel-titulo-separado">

                <div>

                  <span>

                    CÓDIGO DE RESERVA

                  </span>



                  <h2 className="taquilla-codigo-grande">

                    {reserva.codigo}

                  </h2>

                </div>



                <div className="taquilla-panel-chip">

                  #{reserva.id}

                </div>

              </div>



              <div className="taquilla-resumen-grid">

                <div>

                  <span>

                    Cliente

                  </span>



                  <strong>

                    {nombreCliente}

                  </strong>

                </div>



                <div>

                  <span>

                    Correo

                  </span>



                  <strong>

                    {

                      reserva.usuario

                        ?.correo

                      ?? 'No disponible'

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Película

                  </span>



                  <strong>

                    {

                      reserva.funcion

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

                      reserva.funcion

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

                      reserva.funcion

                        ?.formato

                        ?.nombre

                      ?? '-'

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Función

                  </span>



                  <strong>

                    {

                      formatearFecha(

                        reserva

                          .funcion

                          ?.inicia_en

                      )

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Reservada en

                  </span>



                  <strong>

                    {

                      formatearFecha(

                        reserva.created_at

                      )

                    }

                  </strong>

                </div>



                <div>

                  <span>

                    Vencimiento

                  </span>



                  <strong>

                    {

                      formatearFecha(

                        reserva.expira_en

                      )

                    }

                  </strong>

                </div>

              </div>

            </section>



            <section className="taquilla-panel">

              <div className="taquilla-panel-titulo taquilla-panel-titulo-separado">

                <div>

                  <span>

                    ENTRADAS

                  </span>



                  <h2>

                    Asientos reservados

                  </h2>

                </div>



                <div className="taquilla-panel-resaltado">

                  {asientos.length}

                </div>

              </div>



              <div className="taquilla-detalle-mini-grid">

                <div className="taquilla-mini-card">

                  <span>

                    Cantidad de asientos

                  </span>



                  <strong>

                    {asientos.length}

                  </strong>

                </div>



                <div className="taquilla-mini-card">

                  <span>

                    Total reservado

                  </span>



                  <strong>

                    {

                      formatearMonto(

                        reserva.total

                      )

                    }

                  </strong>

                </div>

              </div>



              <div className="taquilla-tabla-asientos taquilla-tabla-asientos-detalle">

                {asientos.length

                  > 0 ? (

                    asientos.map(

                      (

                        asiento

                      ) => (

                        <span

                          key={

                            asiento

                          }

                        >

                          {

                            asiento

                          }

                        </span>

                      )

                    )

                  ) : (

                    <small>

                      No hay asientos registrados.

                    </small>

                  )}

              </div>

            </section>



            <section className="taquilla-panel">

              <div className="taquilla-panel-titulo">

                <div>

                  <span>

                    SEGUIMIENTO

                  </span>



                  <h2>

                    Flujo de atención

                  </h2>

                </div>

              </div>



              <div className="taquilla-pasos-atencion">

                {pasosAtencion.map(

                  (

                    paso

                  ) => (

                    <article

                      key={

                        paso.titulo

                      }

                      className={`taquilla-paso-atencion taquilla-paso-${paso.estado}`}

                    >

                      <div className="taquilla-paso-indicador">

                        {paso.estado

                        === 'completado'

                          ? '✓'

                          : paso.estado

                            === 'activo'

                            ? '•'

                            : '○'}

                      </div>



                      <div>

                        <strong>

                          {

                            paso.titulo

                          }

                        </strong>



                        <p>

                          {

                            paso.descripcion

                          }

                        </p>

                      </div>

                    </article>

                  )

                )}

              </div>

            </section>



            {venta && (

              <section className="taquilla-panel taquilla-panel-compacto">

                <div className="taquilla-panel-titulo taquilla-panel-titulo-separado">

                  <div>

                    <span>

                      VENTA GENERADA

                    </span>



                    <h2>

                      {

                        venta.numero_venta

                        ?? `Venta #${venta.id}`

                      }

                    </h2>

                  </div>



                  <span

                    className={

                      venta.estado

                      === 'PAGADA'

                        ? 'taquilla-estado taquilla-estado-confirmada'

                        : 'taquilla-estado taquilla-estado-pendiente'

                    }

                  >

                    {venta.estado}

                  </span>

                </div>



                <div className="taquilla-resumen-grid">

                  <div>

                    <span>

                      Total de venta

                    </span>



                    <strong>

                      {

                        formatearMonto(

                          venta.total

                        )

                      }

                    </strong>

                  </div>



                  <div>

                    <span>

                      Origen

                    </span>



                    <strong>

                      Reserva

                    </strong>

                  </div>

                </div>

              </section>

            )}



            {pago && (

              <section className="taquilla-pago-exitoso">

                <div className="taquilla-pago-icono">

                  ✓

                </div>



                <div>

                  <span>

                    PAGO REGISTRADO

                  </span>



                  <h2>

                    Venta completada

                  </h2>



                  <p>

                    El pago fue registrado

                    correctamente y la venta

                    quedó pagada.

                  </p>



                  <div className="taquilla-pago-datos">

                    <div>

                      <span>

                        Estado

                      </span>



                      <strong>

                        {pago.estado}

                      </strong>

                    </div>



                    <div>

                      <span>

                        Método

                      </span>



                      <strong>

                        {

                          pago.metodo_pago

                            ?.nombre

                          ?? metodoPago

                        }

                      </strong>

                    </div>



                    <div>

                      <span>

                        Monto

                      </span>



                      <strong>

                        {

                          formatearMonto(

                            pago.monto

                          )

                        }

                      </strong>

                    </div>

                  </div>

                </div>

              </section>

            )}



            {pago && documentos && (

              <section className="taquilla-panel taquilla-panel-destacado">

                <div className="taquilla-panel-titulo taquilla-panel-titulo-separado">

                  <div>

                    <span>

                      DOCUMENTOS DE VENTA

                    </span>



                    <h2>

                      Documentos disponibles

                    </h2>



                    <p>

                      Los documentos de taquilla no se envían por correo. Puedes verlos en PDF o descargarlos.

                    </p>

                  </div>

                </div>



                {(documentos.tickets ?? []).map(

                  (ticket) => (

                    <div

                      key={ticket.id}

                      className="taquilla-mini-card"

                      style={{

                        marginBottom: '12px',

                      }}

                    >

                      <span>

                        Ticket

                      </span>



                      <strong>

                        {ticket.codigo}

                      </strong>



                      <div

                        className="confirmacion-acciones"

                        style={{

                          marginTop: '12px',

                        }}

                      >

                        <button

                          type="button"

                          onClick={() =>

                            obtenerDocumento(

                              `/tickets/${ticket.id}/pdf`,

                              `Ticket-${ticket.codigo}.pdf`,

                              true

                            )

                          }

                          disabled={

                            Boolean(

                              procesandoDocumento

                            )

                          }

                        >

                          Ver PDF

                        </button>



                        <button

                          type="button"

                          className="confirmacion-cancelar"

                          onClick={() =>

                            obtenerDocumento(

                              `/tickets/${ticket.id}/pdf?descargar=1`,

                              `Ticket-${ticket.codigo}.pdf`

                            )

                          }

                          disabled={

                            Boolean(

                              procesandoDocumento

                            )

                          }

                        >

                          Descargar PDF

                        </button>

                      </div>

                    </div>

                  )

                )}



                {documentos.factura && (

                  <div className="taquilla-mini-card">

                    <span>

                      Factura FEL

                    </span>



                    <strong>

                      {documentos.factura.numero_interno}

                    </strong>



                    <p>

                      Estado: {documentos.factura.estado}

                    </p>



                    {documentos.factura.estado === 'CERTIFICADA' && (

                      <div

                        className="confirmacion-acciones"

                        style={{

                          marginTop: '12px',

                          flexWrap: 'wrap',

                        }}

                      >

                        <button

                          type="button"

                          onClick={() =>

                            obtenerDocumento(

                              `/facturas/${documentos.factura.id}/pdf`,

                              `Factura-${documentos.factura.numero_interno}.pdf`,

                              true

                            )

                          }

                          disabled={

                            Boolean(

                              procesandoDocumento

                            )

                          }

                        >

                          Ver PDF

                        </button>



                        <button

                          type="button"

                          className="confirmacion-cancelar"

                          onClick={() =>

                            obtenerDocumento(

                              `/facturas/${documentos.factura.id}/pdf?descargar=1`,

                              `Factura-${documentos.factura.numero_interno}.pdf`

                            )

                          }

                          disabled={

                            Boolean(

                              procesandoDocumento

                            )

                          }

                        >

                          Descargar PDF

                        </button>



                        <button

                          type="button"

                          className="confirmacion-cancelar"

                          onClick={() =>

                            obtenerDocumento(

                              `/facturas/${documentos.factura.id}/xml`,

                              `Factura-${documentos.factura.numero_interno}.xml`

                            )

                          }

                          disabled={

                            Boolean(

                              procesandoDocumento

                            )

                          }

                        >

                          Descargar XML

                        </button>

                      </div>

                    )}

                  </div>

                )}



                {Object.keys(

                  documentos.errores

                  ?? {}

                ).length > 0 && (

                  <div className="taquilla-mensaje-error">

                    Algún documento no pudo generarse automáticamente. El pago sigue siendo válido y la incidencia puede recuperarse desde administración.

                  </div>

                )}

              </section>

            )}

          </div>



          <aside className="taquilla-cobro taquilla-cobro-expandido">

            <div className="taquilla-cobro-cabecera">

              <span>

                RESUMEN DE COBRO

              </span>



              <h2>

                Total

              </h2>

            </div>



            <div className="taquilla-cobro-linea">

              <span>

                Subtotal

              </span>



              <strong>

                {

                  formatearMonto(

                    reserva.subtotal

                  )

                }

              </strong>

            </div>



            <div className="taquilla-cobro-linea">

              <span>

                Descuento

              </span>



              <strong>

                {

                  formatearMonto(

                    reserva.descuento

                  )

                }

              </strong>

            </div>



            <div className="taquilla-cobro-total">

              <span>

                Total a cobrar

              </span>



              <strong>

                {

                  formatearMonto(

                    reserva.total

                  )

                }

              </strong>

            </div>



            <div className="taquilla-cobro-secundario">

              <div>

                <span>

                  Cliente

                </span>



                <strong>

                  {nombreCliente}

                </strong>

              </div>



              <div>

                <span>

                  Asientos

                </span>



                <strong>

                  {asientos.join(', ') || '-'}

                </strong>

              </div>

            </div>



            {puedeConvertir && (

              <button

                type="button"

                className="taquilla-boton-principal"

                onClick={() =>

                  setConfirmacion(

                    'VENTA'

                  )

                }

                disabled={

                  procesandoVenta

                }

              >

                Convertir reserva en venta

              </button>

            )}



            {puedeCobrar && (

              <>

                <div className="taquilla-metodo-pago">

                  <span>

                    MÉTODO DE PAGO

                  </span>



                  <strong>

                    Efectivo o Tarjeta POS

                  </strong>



                  <p>

                    Selecciona el método

                    de pago al continuar.

                  </p>

                </div>



                <button

                  type="button"

                  className="taquilla-boton-principal"

                  onClick={

                    abrirPago

                  }

                  disabled={

                    procesandoPago

                  }

                >

                  Registrar pago

                </button>

              </>

            )}



            {venta?.estado

              === 'PAGADA'

              && (

                <div className="taquilla-cobro-finalizado">

                  <span>

                    ✓

                  </span>



                  <div>

                    <strong>

                      Cobro finalizado

                    </strong>



                    <p>

                      La venta ya se

                      encuentra pagada.

                    </p>

                  </div>

                </div>

              )}



            <div className="taquilla-panel-mini taquilla-panel-mini-acciones">

              <span>

                ACCESOS RÁPIDOS

              </span>



              <div className="taquilla-accesos taquilla-accesos-columna">

                <Link

                  to="/taquilla/reservas"

                  className="taquilla-acceso"

                >

                  Volver al listado

                </Link>



                <Link

                  to="/taquilla/venta"

                  className="taquilla-acceso"

                >

                  Ir a venta presencial

                </Link>



                <Link

                  to="/taquilla/tickets"

                  className="taquilla-acceso"

                >

                  Validar tickets

                </Link>

              </div>

            </div>

          </aside>

        </div>

      </div>



      {confirmacion && (

        <div

          className="confirmacion-overlay"

          role="presentation"

          onMouseDown={

            (event) => {

              if (

                event.target

                === event.currentTarget

              ) {

                cerrarConfirmacion()

              }

            }

          }

        >

          <section

            className="confirmacion-modal"

            role="dialog"

            aria-modal="true"

          >

            <div className="confirmacion-icono confirmacion-icono-reserva">

              ✓

            </div>



            <span className="confirmacion-etiqueta">

              CREAR VENTA

            </span>



            <h2>

              ¿Convertir reserva en venta?

            </h2>



            <p className="confirmacion-descripcion">

              Se creará una venta a partir

              de esta reserva y los asientos

              quedarán asociados a la nueva

              venta.

            </p>



            <div className="confirmacion-resumen">

              <div>

                <span>

                  Reserva

                </span>



                <strong>

                  {reserva.codigo}

                </strong>

              </div>



              <div>

                <span>

                  Cliente

                </span>



                <strong>

                  {nombreCliente}

                </strong>

              </div>



              <div>

                <span>

                  Asientos

                </span>



                <strong>

                  {

                    asientos.join(

                      ', '

                    )

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

                      reserva.total

                    )

                  }

                </strong>

              </div>

            </div>



            <div className="confirmacion-acciones">

              <button

                type="button"

                className="confirmacion-cancelar"

                onClick={

                  cerrarConfirmacion

                }

                disabled={

                  procesandoVenta

                }

              >

                Volver

              </button>



              <button

                type="button"

                className="confirmacion-confirmar"

                disabled={

                  procesandoVenta

                }

                onClick={

                  convertirEnVenta

                }

              >

                {procesandoVenta

                  ? 'Creando venta...'

                  : 'Crear venta'}

              </button>

            </div>

          </section>

        </div>

      )}



      {modalPago && (

        <div

          className="confirmacion-overlay"

          role="presentation"

          onMouseDown={

            (event) => {

              if (

                event.target

                === event.currentTarget

              ) {

                cerrarPago()

              }

            }

          }

        >

          <section

            className="confirmacion-modal taquilla-pago-modal"

            role="dialog"

            aria-modal="true"

          >

            <span className="confirmacion-etiqueta">

              REGISTRAR PAGO

            </span>



            <h2>

              Completar venta

            </h2>



            <div className="taquilla-pago-total">

              <span>

                Total a cobrar

              </span>



              <strong>

                {

                  formatearMonto(

                    totalVenta

                  )

                }

              </strong>

            </div>



            <div className="taquilla-metodos-pago">

              <button

                type="button"

                className={

                  metodoPago

                  === 'EFECTIVO'

                    ? 'taquilla-metodo activo'

                    : 'taquilla-metodo'

                }

                onClick={() => {

                  setMetodoPago(

                    'EFECTIVO'

                  )



                  setError('')

                }}

              >

                <strong>

                  Efectivo

                </strong>



                <span>

                  Cobro en caja

                </span>

              </button>



              <button

                type="button"

                className={

                  metodoPago

                  === 'TARJETA'

                    ? 'taquilla-metodo activo'

                    : 'taquilla-metodo'

                }

                onClick={() => {

                  setMetodoPago(

                    'TARJETA'

                  )



                  setError('')

                }}

              >

                <strong>

                  Tarjeta POS

                </strong>



                <span>

                  Terminal físico

                </span>

              </button>

            </div>



            {metodoPago

              === 'EFECTIVO'

              && (

                <div className="taquilla-form-pago">

                  <label>

                    Efectivo recibido



                    <input

                      type="number"

                      min="0"

                      step="0.01"

                      value={

                        efectivoRecibido

                      }

                      onChange={

                        (event) =>

                          setEfectivoRecibido(

                            event.target

                              .value

                          )

                      }

                      placeholder="0.00"

                    />

                  </label>



                  <div className="taquilla-cambio">

                    <span>

                      Cambio

                    </span>



                    <strong>

                      {

                        formatearMonto(

                          cambio

                        )

                      }

                    </strong>

                  </div>

                </div>

              )}



            {metodoPago

              === 'TARJETA'

              && (

                <div className="taquilla-form-pago">

                  <div className="confirmacion-aviso">

                    <strong>

                      Confirma primero el cobro

                      en el POS

                    </strong>



                    <p>

                      Atlantic Cinema no almacena

                      datos de tarjeta. Registra

                      únicamente los datos

                      proporcionados por el

                      terminal físico después de

                      aprobar la transacción.

                    </p>

                  </div>



                  <label>

                    Proveedor del POS



                    <input

                      type="text"

                      value={

                        proveedorPos

                      }

                      onChange={

                        (event) =>

                          setProveedorPos(

                            event.target

                              .value

                          )

                      }

                      placeholder="Ej. BAC, Banco Industrial, G&T Continental"

                    />

                  </label>



                  <label>

                    Número de referencia



                    <small>

                      Opcional

                    </small>



                    <input

                      type="text"

                      value={

                        referenciaPos

                      }

                      onChange={

                        (event) =>

                          setReferenciaPos(

                            event.target

                              .value

                          )

                      }

                      placeholder="Ej. 4542935758"

                    />

                  </label>



                  <label>

                    Código de autorización



                    <input

                      type="text"

                      value={

                        autorizacionPos

                      }

                      onChange={

                        (event) =>

                          setAutorizacionPos(

                            event.target

                              .value

                          )

                      }

                      placeholder="Ej. 053290"

                    />

                  </label>

                </div>

              )}



            <div className="taquilla-form-pago">

              <div className="confirmacion-aviso">

                <strong>

                  Datos de facturación

                </strong>



                <p>

                  Selecciona Consumidor Final o ingresa el NIT del cliente. El nombre fiscal se consultará automáticamente.

                </p>

              </div>



              <div className="taquilla-metodos-pago">

                <button

                  type="button"

                  className={

                    tipoFacturacion === 'CF'

                      ? 'taquilla-metodo activo'

                      : 'taquilla-metodo'

                  }

                  onClick={() => {

                    setTipoFacturacion('CF')

                    setNitReceptor('')

                    setNombreReceptor('')

                    setError('')

                  }}

                >

                  <strong>

                    Consumidor Final

                  </strong>



                  <span>

                    NIT CF

                  </span>

                </button>



                <button

                  type="button"

                  className={

                    tipoFacturacion === 'NIT'

                      ? 'taquilla-metodo activo'

                      : 'taquilla-metodo'

                  }

                  onClick={() => {

                    setTipoFacturacion('NIT')

                    setError('')

                  }}

                >

                  <strong>

                    Facturar con NIT

                  </strong>



                  <span>

                    Datos del cliente

                  </span>

                </button>

              </div>



              {tipoFacturacion === 'NIT' && (
                <>
                  <label>
                    NIT

                    <input
                      type="text"
                      value={nitReceptor}
                      onChange={(event) => {
                        setNitReceptor(
                          event.target.value
                        )
                        setNombreReceptor('')
                        setError('')
                      }}
                      onBlur={() => {
                        if (
                          nitReceptor.trim()
                          && !nombreReceptor.trim()
                          && !consultandoNit
                        ) {
                          consultarNit()
                        }
                      }}
                      placeholder="Ej. 1234567-8"
                      disabled={consultandoNit}
                    />
                  </label>



                  <button
                    type="button"
                    className="confirmacion-cancelar"
                    onClick={consultarNit}
                    disabled={
                      consultandoNit
                      || !nitReceptor.trim()
                    }
                  >
                    {consultandoNit
                      ? 'Consultando NIT...'
                      : 'Consultar NIT'}
                  </button>



                  <label>
                    Nombre fiscal

                    <input
                      type="text"
                      value={nombreReceptor}
                      readOnly
                      placeholder="Se completará automáticamente"
                    />
                  </label>
                </>
              )}

            </div>



            <div className="confirmacion-acciones">

              <button

                type="button"

                className="confirmacion-cancelar"

                onClick={

                  cerrarPago

                }

                disabled={

                  procesandoPago

                }

              >

                Volver

              </button>



              <button

                type="button"

                className="confirmacion-confirmar"

                onClick={

                  registrarPago

                }

                disabled={

                  !metodoPago

                  || procesandoPago
                    || consultandoNit

                }

              >

                {procesandoPago

                  ? 'Registrando pago...'

                  : 'Confirmar pago'}

              </button>

            </div>

          </section>

        </div>

      )}

    </main>

  )

}



export default TaquillaReservaDetalle
