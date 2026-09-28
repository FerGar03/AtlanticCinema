import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import api from '../services/api'

import logoAtlantic
  from '../assets/branding/atlantic-cinema-logo.png'

function PagoExitoso() {
  const [
    venta,
    setVenta,
  ] = useState(null)

  const [
    tickets,
    setTickets,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    procesandoDocumento,
    setProcesandoDocumento,
  ] = useState('')

  const [
    numeroCopiado,
    setNumeroCopiado,
  ] = useState(false)

  const [ventaId] =
    useState(() =>
      sessionStorage.getItem(
        'atlanticCinemaVentaPago'
      )
    )

  const pagoConfirmado =
    venta?.estado === 'PAGADA'

  const factura =
    venta?.factura ?? null

  const facturaCertificada =
    factura?.estado === 'CERTIFICADA'

  const entradasDisponibles =
    pagoConfirmado
    && Array.isArray(
      venta?.entradas
    )
    && venta.entradas.length > 0

  const ticketsDisponibles =
    entradasDisponibles
    && tickets.length
      >= venta.entradas.length

  const procesoCompleto =
    pagoConfirmado
    && entradasDisponibles
    && facturaCertificada
    && ticketsDisponibles

  const titulo =
    procesoCompleto
      ? '¡Compra confirmada!'
      : '¡Pago recibido!'

  const etiqueta =
    procesoCompleto
      ? 'COMPRA COMPLETADA'
      : 'PAGO PROCESADO'

  const descripcion =
    procesoCompleto
      ? 'Tu pago fue confirmado correctamente. Tus tickets están disponibles y tu factura electrónica ya fue certificada.'
      : 'Recurrente procesó correctamente tu pago. Estamos confirmando la operación con Atlantic Cinema.'

  const nombreReceptor =
    useMemo(
      () => {
        const nombre =
          factura?.nombre_receptor
          ?? venta?.nombre_facturacion
          ?? ''

        const partes =
          String(nombre)
            .split(',')

        if (
          partes.length >= 5
          && partes[3]?.trim()
        ) {
          return [
            partes[3],
            partes[4],
            partes[0],
            partes[1],
          ]
            .map(
              (parte) =>
                parte?.trim()
            )
            .filter(Boolean)
            .join(' ')
        }

        return String(nombre)
          .replaceAll(',', ' ')
          .replace(/\s+/g, ' ')
          .trim()
      },
      [
        factura,
        venta,
      ]
    )

  useEffect(
    () => {
      if (!ventaId) {
        setCargando(false)

        setError(
          'No fue posible identificar la compra que debe confirmarse.'
        )

        return undefined
      }

      let activo = true
      let temporizador = null

      const consultarVenta =
        async () => {
          try {
            const response =
              await api.get(
                `/ventas/${ventaId}`
              )

            if (!activo) {
              return
            }

            const ventaActual =
              response.data?.data
              ?? null

            setVenta(
              ventaActual
            )

            let ticketsActuales = []

            if (
              ventaActual?.estado
              === 'PAGADA'
            ) {
              try {
                const responseTickets =
                  await api.get(
                    '/tickets'
                  )

                const listado =
                  Array.isArray(
                    responseTickets
                      .data
                      ?.data
                  )
                    ? responseTickets
                      .data
                      .data
                    : []

                ticketsActuales =
                  listado.filter(
                    (ticket) =>
                      Number(
                        ticket
                          ?.entrada
                          ?.venta_id
                        ?? ticket
                          ?.entrada
                          ?.venta
                          ?.id
                      )
                      === Number(
                        ventaId
                      )
                  )

                if (activo) {
                  setTickets(
                    ticketsActuales
                  )
                }
              } catch {
                if (activo) {
                  setTickets([])
                }
              }
            }

            setError('')

            const cantidadEntradas =
              Array.isArray(
                ventaActual?.entradas
              )
                ? ventaActual
                  .entradas
                  .length
                : 0

            const ticketsCompletos =
              cantidadEntradas > 0
              && ticketsActuales.length
                >= cantidadEntradas

            const terminada =
              ventaActual?.estado
              === 'PAGADA'
              && ventaActual
                ?.factura
                ?.estado
              === 'CERTIFICADA'
              && ticketsCompletos

            if (terminada) {
              setCargando(false)

              sessionStorage.removeItem(
                'atlanticCinemaVentaPago'
              )

              return
            }

            temporizador =
              window.setTimeout(
                consultarVenta,
                2500
              )
          } catch (err) {
            if (!activo) {
              return
            }

            setError(
              err.response
                ?.data
                ?.message
              ?? 'No fue posible consultar el estado actualizado de la compra.'
            )

            temporizador =
              window.setTimeout(
                consultarVenta,
                4000
              )
          } finally {
            if (activo) {
              setCargando(false)
            }
          }
        }

      consultarVenta()

      return () => {
        activo = false

        if (temporizador) {
          window.clearTimeout(
            temporizador
          )
        }
      }
    },
    [
      ventaId,
    ]
  )

  const copiarNumeroVenta =
    async () => {
      if (!venta?.numero_venta) {
        return
      }

      try {
        await navigator.clipboard.writeText(
          venta.numero_venta
        )

        setNumeroCopiado(true)

        window.setTimeout(
          () => {
            setNumeroCopiado(false)
          },
          2200
        )
      } catch {
        setNumeroCopiado(false)
      }
    }

  const nombreArchivoFactura = (
    extension
  ) => {
    const identificador =
      factura?.serie
      && factura?.numero_documento
        ? `${factura.serie}-${factura.numero_documento}`
        : factura?.numero_interno
          ?? 'Factura'

    return (
      `Factura-Atlantic-Cinema-${identificador}.${extension}`
    )
  }

  const obtenerDocumento =
    async (
      tipo,
      accion
    ) => {
      if (!factura?.id) {
        setError(
          'No fue posible identificar la factura certificada.'
        )

        return
      }

      const clave =
        `${tipo}-${accion}`

      setProcesandoDocumento(
        clave
      )

      setError('')

      let ventanaPdf = null

      if (
        tipo === 'pdf'
        && accion === 'ver'
      ) {
        ventanaPdf =
          window.open(
            '',
            '_blank'
          )

        if (ventanaPdf) {
          ventanaPdf.document.title =
            'Cargando factura...'

          ventanaPdf.document.body.innerHTML =
            '<p style="font-family:Arial;padding:24px;">Cargando factura certificada...</p>'
        }
      }

      try {
        const response =
          await api.get(
            `/facturas/${factura.id}/${tipo}`,
            {
              params:
                tipo === 'pdf'
                && accion === 'descargar'
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
              response.data,
            ],
            {
              type:
                tipo === 'pdf'
                  ? 'application/pdf'
                  : 'application/xml',
            }
          )

        const url =
          window.URL
            .createObjectURL(
              blob
            )

        if (
          tipo === 'pdf'
          && accion === 'ver'
        ) {
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

        enlace.href = url

        enlace.download =
          nombreArchivoFactura(
            tipo
          )

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

        let mensaje =
          'No fue posible obtener el documento de la factura.'

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

            mensaje =
              json.message
              ?? mensaje
          } catch {
            // Conservamos mensaje predeterminado.
          }
        } else {
          mensaje =
            err.response
              ?.data
              ?.message
            ?? mensaje
        }

        setError(
          mensaje
        )
      } finally {
        setProcesandoDocumento('')
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
        `ticket-${ticket.id}-${accion}`

      setProcesandoDocumento(
        clave
      )

      setError('')

      let ventanaPdf = null

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
        const response =
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
              response.data,
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

        enlace.href = url

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

        let mensaje =
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

            mensaje =
              json.message
              ?? mensaje
          } catch {
            // Conservamos mensaje predeterminado.
          }
        } else {
          mensaje =
            err.response
              ?.data
              ?.message
            ?? mensaje
        }

        setError(
          mensaje
        )
      } finally {
        setProcesandoDocumento('')
      }
    }

  return (
    <main className="pago-resultado-pagina pago-resultado-pagina-final">
      <header className="pago-resultado-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="pago-resultado-logo">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <small>
              Vive la experiencia
            </small>
          </div>
        </Link>

        <div className="pago-resultado-navbar-links">
          <Link to="/mis-operaciones">
            Mis operaciones
          </Link>

          <Link to="/">
            ← Cartelera
          </Link>
        </div>
      </header>

      <section className="pago-resultado-card">
        <div className="pago-resultado-icono pago-resultado-icono-exito">
          ✓
        </div>

        <span className="pago-resultado-etiqueta">
          {etiqueta}
        </span>

        <h1>
          {titulo}
        </h1>

        <p className="pago-resultado-descripcion">
          {descripcion}
        </p>

        {venta?.numero_venta && (
          <div className="pago-exitoso-numero">
            <div>
              <span>
                NÚMERO DE VENTA
              </span>

              <strong>
                {venta.numero_venta}
              </strong>
            </div>

            <button
              type="button"
              onClick={
                copiarNumeroVenta
              }
            >
              {numeroCopiado
                ? '✓ Copiado'
                : 'Copiar número'}
            </button>
          </div>
        )}

        {procesoCompleto ? (
          <div className="pago-resultado-aviso">
            <strong>
              Compra confirmada
            </strong>

            <p>
              Atlantic Cinema recibió la
              confirmación final del pago.
              Tus tickets ya están disponibles
              y la factura FEL fue certificada
              correctamente.
            </p>
          </div>
        ) : (
          <div className="pago-resultado-aviso">
            <strong>
              Confirmación en proceso
            </strong>

            <p>
              El pago fue recibido por
              Recurrente. Atlantic Cinema
              está procesando la confirmación
              final de la compra.
            </p>
          </div>
        )}

        {error && (
          <div className="pago-resultado-aviso">
            <strong>
              Estado de la operación
            </strong>

            <p>
              {error}
            </p>
          </div>
        )}

        <div className="pago-resultado-pasos">
          <div className="pago-paso pago-paso-completo">
            <span>
              ✓
            </span>

            <div>
              <strong>
                Pago recibido
              </strong>

              <small>
                Recurrente recibió la operación.
              </small>
            </div>
          </div>

          <div
            className={
              pagoConfirmado
                ? 'pago-paso pago-paso-completo'
                : 'pago-paso pago-paso-pendiente'
            }
          >
            <span>
              {pagoConfirmado
                ? '✓'
                : '2'}
            </span>

            <div>
              <strong>
                {pagoConfirmado
                  ? 'Compra confirmada'
                  : 'Confirmando compra'}
              </strong>

              <small>
                {pagoConfirmado
                  ? 'Atlantic Cinema confirmó el pago.'
                  : 'Atlantic Cinema espera la confirmación final.'}
              </small>
            </div>
          </div>

          <div
            className={
              entradasDisponibles
                ? 'pago-paso pago-paso-completo'
                : 'pago-paso'
            }
          >
            <span>
              {entradasDisponibles
                ? '✓'
                : '3'}
            </span>

            <div>
              <strong>
                Entradas disponibles
              </strong>

              <small>
                {entradasDisponibles
                  ? `${venta.entradas.length} entrada(s) disponibles.`
                  : 'Al confirmar el pago se habilitarán tus entradas.'}
              </small>
            </div>
          </div>

          <div
            className={
              ticketsDisponibles
                ? 'pago-paso pago-paso-completo'
                : 'pago-paso'
            }
          >
            <span>
              {ticketsDisponibles
                ? '✓'
                : '4'}
            </span>

            <div>
              <strong>
                Tickets electrónicos
              </strong>

              <small>
                {ticketsDisponibles
                  ? `${tickets.length} ticket(s) generado(s).`
                  : 'Los tickets se generarán después de confirmar la compra.'}
              </small>
            </div>
          </div>

          <div
            className={
              facturaCertificada
                ? 'pago-paso pago-paso-completo'
                : 'pago-paso'
            }
          >
            <span>
              {facturaCertificada
                ? '✓'
                : '5'}
            </span>

            <div>
              <strong>
                Factura electrónica
              </strong>

              <small>
                {facturaCertificada
                  ? 'Factura FEL certificada correctamente.'
                  : 'La factura se certificará después de confirmar el pago.'}
              </small>
            </div>
          </div>
        </div>

        {tickets.length > 0 && (
          <section className="pago-factura-certificada">
            <div className="pago-factura-certificada-cabecera">
              <div>
                <span>
                  TICKETS ELECTRÓNICOS
                </span>

                <h2>
                  Tus entradas
                </h2>
              </div>

              <strong>
                {tickets.length}
              </strong>
            </div>

            {tickets.map(
              (
                ticket,
                indice
              ) => {
                const asiento =
                  ticket
                    ?.entrada
                    ?.funcion_asiento
                    ?.asiento
                  ?? ticket
                    ?.entrada
                    ?.funcionAsiento
                    ?.asiento
                  ?? null

                const funcion =
                  ticket
                    ?.entrada
                    ?.funcion_asiento
                    ?.funcion
                  ?? ticket
                    ?.entrada
                    ?.funcionAsiento
                    ?.funcion
                  ?? null

                return (
                  <div
                    key={ticket.id}
                    className="pago-factura-certificada"
                  >
                    <div className="pago-factura-certificada-cabecera">
                      <div>
                        <span>
                          TICKET {indice + 1}
                        </span>

                        <h2>
                          {funcion
                            ?.pelicula
                            ?.titulo
                            ?? 'Entrada Atlantic Cinema'}
                        </h2>
                      </div>

                      <strong>
                        {ticket.estado}
                      </strong>
                    </div>

                    <div className="pago-factura-datos">
                      <div>
                        <span>
                          Sala
                        </span>

                        <strong>
                          {funcion
                            ?.sala
                            ?.nombre
                            ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Fila
                        </span>

                        <strong>
                          {asiento
                            ?.fila
                            ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Asiento
                        </span>

                        <strong>
                          {asiento
                            ?.numero
                            ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Formato
                        </span>

                        <strong>
                          {funcion
                            ?.formato
                            ?.nombre
                            ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Código
                        </span>

                        <strong>
                          {ticket.codigo}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Estado
                        </span>

                        <strong>
                          {ticket.estado}
                        </strong>
                      </div>
                    </div>

                    <div className="pago-factura-acciones">
                      <button
                        type="button"
                        className="pago-factura-boton-principal"
                        onClick={() =>
                          obtenerTicketPdf(
                            ticket,
                            'ver'
                          )
                        }
                        disabled={
                          Boolean(
                            procesandoDocumento
                          )
                        }
                      >
                        {procesandoDocumento
                          === `ticket-${ticket.id}-ver`
                            ? 'Abriendo ticket...'
                            : 'Ver ticket'}
                      </button>

                      <button
                        type="button"
                        className="pago-factura-boton-secundario"
                        onClick={() =>
                          obtenerTicketPdf(
                            ticket,
                            'descargar'
                          )
                        }
                        disabled={
                          Boolean(
                            procesandoDocumento
                          )
                        }
                      >
                        {procesandoDocumento
                          === `ticket-${ticket.id}-descargar`
                            ? 'Descargando...'
                            : 'Descargar ticket PDF'}
                      </button>
                    </div>
                  </div>
                )
              }
            )}
          </section>
        )}

        {facturaCertificada && (
          <section className="pago-factura-certificada">
            <div className="pago-factura-certificada-cabecera">
              <div>
                <span>
                  FACTURA ELECTRÓNICA
                </span>

                <h2>
                  Factura FEL certificada
                </h2>
              </div>

              <strong>
                CERTIFICADA
              </strong>
            </div>

            <div className="pago-factura-datos">
              <div>
                <span>
                  Receptor
                </span>

                <strong>
                  {nombreReceptor
                    || 'Consumidor Final'}
                </strong>
              </div>

              <div>
                <span>
                  NIT
                </span>

                <strong>
                  {factura.nit_receptor
                    ?? venta?.nit_facturacion
                    ?? 'CF'}
                </strong>
              </div>

              <div>
                <span>
                  Serie
                </span>

                <strong>
                  {factura.serie
                    ?? '—'}
                </strong>
              </div>

              <div>
                <span>
                  Número FEL
                </span>

                <strong>
                  {factura.numero_documento
                    ?? '—'}
                </strong>
              </div>

              <div>
                <span>
                  UUID
                </span>

                <strong>
                  {factura.uuid
                    ?? '—'}
                </strong>
              </div>

              <div>
                <span>
                  Total
                </span>

                <strong>
                  Q
                  {Number(
                    factura.total
                    ?? venta?.total
                    ?? 0
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="pago-factura-acciones">
              <button
                type="button"
                className="pago-factura-boton-principal"
                onClick={() =>
                  obtenerDocumento(
                    'pdf',
                    'ver'
                  )
                }
                disabled={
                  Boolean(
                    procesandoDocumento
                  )
                }
              >
                {procesandoDocumento
                  === 'pdf-ver'
                    ? 'Abriendo PDF...'
                    : 'Ver factura PDF'}
              </button>

              <button
                type="button"
                className="pago-factura-boton-secundario"
                onClick={() =>
                  obtenerDocumento(
                    'pdf',
                    'descargar'
                  )
                }
                disabled={
                  Boolean(
                    procesandoDocumento
                  )
                }
              >
                {procesandoDocumento
                  === 'pdf-descargar'
                    ? 'Descargando...'
                    : 'Descargar PDF'}
              </button>

              <button
                type="button"
                className="pago-factura-boton-secundario"
                onClick={() =>
                  obtenerDocumento(
                    'xml',
                    'descargar'
                  )
                }
                disabled={
                  Boolean(
                    procesandoDocumento
                  )
                }
              >
                {procesandoDocumento
                  === 'xml-descargar'
                    ? 'Descargando...'
                    : 'Descargar XML'}
              </button>
            </div>
          </section>
        )}

        {cargando && (
          <p className="pago-resultado-nota">
            Consultando el estado actualizado
            de tu compra...
          </p>
        )}

        <div className="pago-resultado-acciones pago-resultado-acciones-finales">
          <Link
            to="/mis-operaciones"
            className="pago-resultado-boton-secundario"
          >
            Ver mis compras
          </Link>

          <Link
            to="/"
            className="pago-resultado-boton-principal"
          >
            Volver a la cartelera
          </Link>
        </div>

        {!procesoCompleto && (
          <p className="pago-resultado-nota">
            Puedes permanecer en esta página
            mientras Atlantic Cinema recibe
            la confirmación. No repitas el pago.
          </p>
        )}
      </section>
    </main>
  )
}

export default PagoExitoso