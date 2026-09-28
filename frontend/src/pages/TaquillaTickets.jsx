import {

  useEffect,

  useRef,

  useState,

} from 'react'



import {

  Link,

} from 'react-router-dom'



import {

  Html5Qrcode,

} from 'html5-qrcode'



import api

  from '../services/api'



import {

  useAuth,

} from '../context/AuthContext'



import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function TaquillaTickets() {

  const {

    usuario,

  } = useAuth()



  const [

    tokenValidacion,

    setTokenValidacion,

  ] = useState('')



  const [

    procesando,

    setProcesando,

  ] = useState(false)



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



  const [

    mensaje,

    setMensaje,

  ] = useState('')



  const [

    error,

    setError,

  ] = useState('')



  const [

    ticketValidado,

    setTicketValidado,

  ] = useState(null)



  const qrScannerRef =

    useRef(null)



  const procesandoEscaneoRef =

    useRef(false)



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

        ?? 'No fue posible validar el ticket.'

      )

    }



  const limpiarMensajes =

    () => {

      setMensaje('')

      setError('')

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

    (ticket) => {

      const cliente =

        ticket

          ?.entrada

          ?.venta

          ?.cliente



      if (!cliente) {

        return '-'

      }



      return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`

        .trim()

        || '-'

    }



  const obtenerAsiento =

    (ticket) => {

      const asiento =

        ticket

          ?.entrada

          ?.funcion_asiento

          ?.asiento



      if (!asiento) {

        return '-'

      }



      return `${asiento.fila}${asiento.numero}`

    }



  const detenerEscaner =

    async () => {

      const scanner =

        qrScannerRef.current



      qrScannerRef.current =

        null



      if (scanner) {

        try {

          if (

            scanner.isScanning

          ) {

            await scanner.stop()

          }

        } catch {

          // Puede haberse detenido antes.

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



  useEffect(() => {

    return () => {

      const scanner =

        qrScannerRef.current



      if (!scanner) {

        return

      }



      if (

        scanner.isScanning

      ) {

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



  const ejecutarValidacion =

    async (

      token

    ) => {

      const tokenLimpio =

        String(

          token ?? ''

        ).trim()



      if (!tokenLimpio) {

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

                tokenLimpio,

            }

          )



        setTicketValidado(

          respuesta.data.data

        )



        setTokenValidacion('')



        setMensaje(

          'Ticket validado correctamente. Acceso autorizado.'

        )



        return true

      } catch (err) {

        setTicketValidado(null)



        setError(

          obtenerPrimerError(

            err

          )

        )



        return false

      } finally {

        setProcesando(false)

      }

    }



  const validarTokenEscaneado =

    async (

      textoQr

    ) => {

      const token =

        String(

          textoQr ?? ''

        ).trim()



      if (

        !token

        || procesandoEscaneoRef

          .current

      ) {

        return

      }



      procesandoEscaneoRef.current =

        true



      setMensajeEscaner(

        'QR detectado. Validando ticket...'

      )



      const correcto =

        await ejecutarValidacion(

          token

        )



      if (correcto) {

        setMensajeEscaner(

          'Acceso autorizado.'

        )

      } else {

        setMensajeEscaner(

          'El QR fue leído, pero el ticket no pudo validarse.'

        )

      }



      await detenerEscaner()

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



        setTicketValidado(null)



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

            'taquilla-ticket-qr-reader'

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

          () => {

            /*

             * El lector ejecuta

             * continuamente este callback

             * mientras busca un QR.

             */

          }

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

          'No fue posible abrir la cámara. Verifica el permiso del navegador y que la página utilice HTTPS o localhost.'

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



      setTicketValidado(null)



      setConfirmarValidacion(

        true

      )

    }



  const validarManual =

    async () => {

      const correcto =

        await ejecutarValidacion(

          tokenValidacion

        )



      if (correcto) {

        setConfirmarValidacion(

          false

        )

      }

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



  const funcion =

    ticketValidado

      ?.entrada

      ?.funcion_asiento

      ?.funcion



  return (
    <main className="taquilla-reservas-pagina">
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
            to="/"
            className="taquilla-volver"
          >
            ← Volver a cartelera
          </Link>

          <Link
            to="/perfil"
            className="taquilla-volver"
          >
            Mi perfil
          </Link>
        </nav>
      </header>

      <div className="taquilla-reservas-contenido">
        <section className="taquilla-listado-encabezado taquilla-cabecera-extendida">
          <div className="taquilla-cabecera-principal">
            <p className="taquilla-etiqueta">
              CONTROL DE ACCESO
            </p>

            <h1>
              Validar tickets
            </h1>

            <p>
              Escanea el código QR del cliente o utiliza el token de validación para registrar su ingreso.
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
                className="taquilla-acceso"
              >
                Reservas
              </Link>

              <Link
                to="/taquilla/tickets"
                className="taquilla-acceso taquilla-acceso-activo"
              >
                Validar tickets
              </Link>
            </div>
          </div>

          <div className="taquilla-empleado taquilla-empleado-destacado">
            <span>
              SESIÓN ACTIVA
            </span>

            <strong>
              {`${usuario?.nombres ?? ''} ${usuario?.apellidos ?? ''}`.trim() || 'Usuario'}
            </strong>

            <small>
              {usuario?.rol?.nombre ?? '-'}
            </small>
          </div>
        </section>

        {mensaje && (
          <div className="taquilla-mensaje-exito">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="taquilla-mensaje-error">
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          <section className="taquilla-panel taquilla-panel-destacado">
            <div className="taquilla-panel-titulo taquilla-panel-titulo-separado">
              <div>
                <span>
                  MÉTODO PRINCIPAL
                </span>

                <h2>
                  Escanear código QR
                </h2>

                <p>
                  Utiliza la cámara del dispositivo para validar rápidamente el ingreso del cliente.
                </p>
              </div>

              <div className="taquilla-panel-chip">
                QR
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              {!escanerActivo ? (
                <button
                  type="button"
                  className="taquilla-boton-principal"
                  onClick={iniciarEscaner}
                  disabled={procesando || iniciandoEscaner}
                >
                  {iniciandoEscaner
                    ? 'Abriendo cámara...'
                    : 'Escanear QR con cámara'}
                </button>
              ) : (
                <button
                  type="button"
                  className="taquilla-boton-principal"
                  onClick={detenerEscaner}
                  disabled={procesando}
                >
                  Detener cámara
                </button>
              )}
            </div>

            {escanerActivo && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  margin: '20px auto 0',
                  overflow: 'hidden',
                  borderRadius: '16px',
                  background: '#0f141c',
                  border: '1px solid rgba(76, 215, 222, 0.18)',
                }}
              >
                <div id="taquilla-ticket-qr-reader" style={{ width: '100%' }} />
              </div>
            )}

            <div
              style={{
                marginTop: '18px',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1px solid rgba(76, 215, 222, 0.12)',
                background: 'rgba(76, 215, 222, 0.04)',
              }}
            >
              <strong>
                {mensajeEscaner || 'Cámara lista para iniciar'}
              </strong>

              <p style={{ margin: '6px 0 0', opacity: 0.72 }}>
                En teléfono o tableta, permite el acceso a la cámara cuando el navegador lo solicite.
              </p>
            </div>
          </section>

          <section className="taquilla-panel">
            <div className="taquilla-panel-titulo taquilla-panel-titulo-separado">
              <div>
                <span>
                  MÉTODO ALTERNATIVO
                </span>

                <h2>
                  Validación manual
                </h2>

                <p>
                  Utiliza esta opción cuando no sea posible leer el código QR del ticket.
                </p>
              </div>

              <div className="taquilla-panel-chip">
                TOKEN
              </div>
            </div>

            <form onSubmit={solicitarValidacion} style={{ marginTop: '20px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span>
                  Token de validación
                </span>

                <input
                  type="text"
                  value={tokenValidacion}
                  onChange={(event) => setTokenValidacion(event.target.value)}
                  placeholder="Ingrese o pegue el token..."
                  required
                  style={{ width: '100%', minHeight: '48px' }}
                />
              </label>

              <div style={{ marginTop: '18px' }}>
                <button
                  type="submit"
                  className="taquilla-boton-principal"
                  disabled={procesando}
                >
                  {procesando ? 'Validando...' : 'Validar ticket'}
                </button>
              </div>
            </form>

            <div
              style={{
                marginTop: '18px',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <strong>
                ¿Qué ocurre al validar?
              </strong>

              <p style={{ margin: '6px 0 0', opacity: 0.72 }}>
                El ticket cambia a UTILIZADO y la entrada asociada queda registrada como UTILIZADA.
              </p>
            </div>
          </section>
        </div>

        {ticketValidado && (
          <section className="taquilla-panel taquilla-panel-destacado" style={{ marginTop: '20px' }}>
            <div className="taquilla-panel-titulo taquilla-panel-titulo-separado">
              <div>
                <span>
                  ACCESO AUTORIZADO
                </span>

                <h2>
                  Ticket válido
                </h2>

                <p>
                  El ticket y la entrada fueron registrados correctamente como utilizados.
                </p>
              </div>

              <span className="taquilla-estado taquilla-estado-confirmada">
                UTILIZADO
              </span>
            </div>

            <div className="taquilla-resumen-grid">
              <div><span>Ticket</span><strong>{ticketValidado.codigo}</strong></div>
              <div><span>Cliente</span><strong>{obtenerNombreCliente(ticketValidado)}</strong></div>
              <div><span>Película</span><strong>{funcion?.pelicula?.titulo ?? '-'}</strong></div>
              <div><span>Sala</span><strong>{funcion?.sala?.nombre ?? '-'}</strong></div>
              <div><span>Formato</span><strong>{funcion?.formato?.nombre ?? '-'}</strong></div>
              <div><span>Asiento</span><strong>{obtenerAsiento(ticketValidado)}</strong></div>
              <div><span>Estado</span><strong>{ticketValidado.estado}</strong></div>
              <div><span>Utilizado</span><strong>{formatearFecha(ticketValidado.utilizado_en)}</strong></div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="taquilla-boton-principal"
                onClick={() => {
                  setTicketValidado(null)
                  setMensaje('')
                  setError('')
                  setMensajeEscaner('')
                }}
              >
                Validar otro ticket
              </button>
            </div>
          </section>
        )}
      </div>

      {confirmarValidacion && (
        <div
          className="confirmacion-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarConfirmacion()
            }
          }}
        >
          <section
            className="confirmacion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="taquilla-validar-ticket-titulo"
          >
            <div className="confirmacion-icono confirmacion-icono-reserva">
              ✓
            </div>

            <span className="confirmacion-etiqueta">
              VALIDAR TICKET
            </span>

            <h2 id="taquilla-validar-ticket-titulo">
              ¿Confirmar ingreso?
            </h2>

            <p className="confirmacion-descripcion">
              Esta acción marcará el ticket y la entrada como utilizados.
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>Token</span>
                <strong>{tokenValidacion.trim()}</strong>
              </div>

              <div>
                <span>Nuevo estado</span>
                <strong className="confirmacion-total">UTILIZADO</strong>
              </div>
            </div>

            <div className="confirmacion-acciones">
              <button
                type="button"
                className="confirmacion-cancelar"
                onClick={cerrarConfirmacion}
                disabled={procesando}
              >
                Volver
              </button>

              <button
                type="button"
                className="confirmacion-confirmar"
                onClick={validarManual}
                disabled={procesando}
              >
                {procesando ? 'Validando...' : 'Confirmar ingreso'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default TaquillaTickets
