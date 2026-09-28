import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import api from '../../services/api'

import AdminSidebar
  from '../../components/Admin/AdminSidebar'

function AdminFacturas() {
  const [facturas, setFacturas] =
    useState([])

  const [
    ventasSinFactura,
    setVentasSinFactura,
  ] = useState([])

  const [cargando, setCargando] =
    useState(true)

  const [
    procesandoId,
    setProcesandoId,
  ] = useState(null)

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false)

  const [
    procesandoDocumento,
    setProcesandoDocumento,
  ] = useState(false)

  const [
    facturaSeleccionada,
    setFacturaSeleccionada,
  ] = useState(null)

  const [busqueda, setBusqueda] =
    useState('')

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState('TODOS')

  const [mensaje, setMensaje] =
    useState('')

  const [error, setError] =
    useState('')

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
  }

  const obtenerPrimerError = (
    err
  ) => {
    const errores =
      err.response?.data?.errors

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
      err.response?.data?.message
      ?? 'Ocurrió un error al procesar la solicitud.'
    )
  }

  const cargarDatos =
    async (
      mostrarCarga = true
    ) => {
      try {
        if (mostrarCarga) {
          setCargando(true)
        }

        setError('')

        const [
          facturasRespuesta,
          ventasRespuesta,
        ] = await Promise.all([
          api.get(
            '/facturas'
          ),

          api.get(
            '/facturas/ventas-disponibles'
          ),
        ])

        setFacturas(
          facturasRespuesta
            .data.data
          ?? []
        )

        setVentasSinFactura(
          ventasRespuesta
            .data.data
          ?? []
        )
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )
      } finally {
        if (mostrarCarga) {
          setCargando(false)
        }
      }
    }

  useEffect(() => {
    cargarDatos()
  }, [])

  const formatearMonto = (
    valor
  ) => {
    return `Q${Number(
      valor ?? 0
    ).toFixed(2)}`
  }

  const formatearFecha = (
    fecha
  ) => {
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

  const obtenerNombreCliente = (
    registro
  ) => {
    const cliente =
      registro.venta?.cliente
      ?? registro.cliente

    if (!cliente) {
      return '-'
    }

    return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`
      .trim()
      || '-'
  }

  const obtenerClaseEstado = (
    estado
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'admin-estado-pendiente'

      case 'CERTIFICADA':
        return 'admin-estado-certificada'

      case 'ERROR':
        return 'admin-estado-error'

      default:
        return ''
    }
  }

  const obtenerClaseIntento = (
    estado
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'admin-intento-pendiente'

      case 'EXITOSO':
        return 'admin-intento-exitoso'

      case 'ERROR':
        return 'admin-intento-error'

      default:
        return ''
    }
  }

  const facturasFiltradas =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLowerCase()

      return facturas.filter(
        (factura) => {
          if (
            estadoFiltro
              !== 'TODOS'
            && factura.estado
              !== estadoFiltro
          ) {
            return false
          }

          if (!termino) {
            return true
          }

          const valores = [
            factura.numero_interno,
            factura.serie,
            factura.numero_documento,
            factura.uuid,
            factura.nombre_receptor,
            factura.nit_receptor,
            factura.venta
              ?.numero_venta,
            factura.venta
              ?.funcion
              ?.pelicula
              ?.titulo,
            obtenerNombreCliente(
              factura
            ),
            factura.venta
              ?.cliente
              ?.correo,
          ]

          return valores.some(
            (valor) =>
              String(
                valor ?? ''
              )
                .toLowerCase()
                .includes(
                  termino
                )
          )
        }
      )
    }, [
      facturas,
      busqueda,
      estadoFiltro,
    ])

  const verDetalle =
    async (
      factura,
      hacerScroll = true
    ) => {
      try {
        setCargandoDetalle(
          true
        )

        setError('')

        const respuesta =
          await api.get(
            `/facturas/${factura.id}`
          )

        setFacturaSeleccionada(
          respuesta.data.data
        )

        if (hacerScroll) {
          setTimeout(() => {
            document
              .getElementById(
                'admin-detalle-factura'
              )
              ?.scrollIntoView({
                behavior:
                  'smooth',

                block:
                  'start',
              })
          }, 0)
        }

        return respuesta
          .data.data
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )

        return null
      } finally {
        setCargandoDetalle(
          false
        )
      }
    }

  const reintentarFactura =
    async (
      factura
    ) => {
      try {
        setProcesandoId(
          `reintento-${factura.id}`
        )

        limpiarMensajes()

        const respuesta =
          await api.post(
            `/facturas/${factura.id}/reintentar`
          )

        setMensaje(
          respuesta.data
            ?.message
          ?? 'La factura fue certificada correctamente.'
        )

        await cargarDatos(
          false
        )

        await verDetalle(
          respuesta.data.data,
          false
        )

        setTimeout(() => {
          document
            .getElementById(
              'admin-detalle-factura'
            )
            ?.scrollIntoView({
              behavior:
                'smooth',

              block:
                'start',
            })
        }, 0)
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )

        await cargarDatos(
          false
        )

        await verDetalle(
          factura,
          false
        )
      } finally {
        setProcesandoId(
          null
        )
      }
    }

  const obtenerDatosFiscalVenta = (
    venta
  ) => {
    const nit =
      String(
        venta.nit_facturacion
        ?? ''
      )
        .trim()
        .toUpperCase()

    const nombre =
      String(
        venta.nombre_facturacion
        ?? ''
      ).trim()

    return {
      nit_receptor:
        nit || 'CF',

      nombre_receptor:
        nombre
        || (
          nit
          && nit !== 'CF'
            ? obtenerNombreCliente(
                venta
              )
            : 'Consumidor Final'
        ),
    }
  }

  const generarFacturaFaltante =
    async (
      venta
    ) => {
      try {
        setProcesandoId(
          `faltante-${venta.id}`
        )

        limpiarMensajes()

        const datosFiscales =
          obtenerDatosFiscalVenta(
            venta
          )

        const respuesta =
          await api.post(
            '/facturas',
            {
              venta_id:
                Number(
                  venta.id
                ),

              nit_receptor:
                datosFiscales
                  .nit_receptor,

              nombre_receptor:
                datosFiscales
                  .nombre_receptor,
            }
          )

        setMensaje(
          respuesta.data
            ?.message
          ?? 'La factura faltante fue generada correctamente.'
        )

        await cargarDatos(
          false
        )

        await verDetalle(
          respuesta.data.data,
          false
        )

        setTimeout(() => {
          document
            .getElementById(
              'admin-detalle-factura'
            )
            ?.scrollIntoView({
              behavior:
                'smooth',

              block:
                'start',
            })
        }, 0)
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )

        await cargarDatos(
          false
        )
      } finally {
        setProcesandoId(
          null
        )
      }
    }

  const descargarDocumento =
    async (
      factura,
      tipo,
      descargar = true
    ) => {
      try {
        setProcesandoDocumento(
          true
        )

        limpiarMensajes()

        const parametros =
          tipo === 'pdf'
          && descargar
            ? {
                descargar: 1,
              }
            : undefined

        const respuesta =
          await api.get(
            `/facturas/${factura.id}/${tipo}`,
            {
              params:
                parametros,

              responseType:
                'blob',
            }
          )

        const contentType =
          tipo === 'pdf'
            ? 'application/pdf'
            : 'application/xml'

        const blob =
          new Blob(
            [
              respuesta.data,
            ],
            {
              type:
                contentType,
            }
          )

        const url =
          window.URL
            .createObjectURL(
              blob
            )

        if (
          tipo === 'pdf'
          && !descargar
        ) {
          window.open(
            url,
            '_blank',
            'noopener,noreferrer'
          )

          setTimeout(() => {
            window.URL
              .revokeObjectURL(
                url
              )
          }, 60000)

          return
        }

        const enlace =
          document
            .createElement(
              'a'
            )

        enlace.href =
          url

        const identificador =
          factura.serie
          && factura
            .numero_documento
            ? `${factura.serie}-${factura.numero_documento}`
            : factura
              .numero_interno

        enlace.download =
          `Factura-Atlantic-Cinema-${identificador}.${tipo}`

        document.body
          .appendChild(
            enlace
          )

        enlace.click()
        enlace.remove()

        window.URL
          .revokeObjectURL(
            url
          )
      } catch (err) {
        let mensajeError =
          'No fue posible obtener el documento.'

        const data =
          err.response?.data

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

            mensajeError =
              json.message
              ?? mensajeError
          } catch {
            // Se conserva el mensaje general.
          }
        } else {
          mensajeError =
            obtenerPrimerError(
              err
            )
        }

        setError(
          mensajeError
        )
      } finally {
        setProcesandoDocumento(
          false
        )
      }
    }

  if (cargando) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <main className="admin-contenido">
          <div className="admin-cargando">
            <div className="cartelera-spinner" />

            <p>
              Cargando facturas...
            </p>
          </div>
        </main>
      </div>
    )
  }

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
                Facturas
              </h1>

              <p>
                Consulta la facturación
                electrónica y recupera
                únicamente las operaciones
                que presenten incidencias.
              </p>
            </div>
          </div>

          {mensaje && (
            <div
              className="
                admin-mensaje
                admin-mensaje-exito
              "
            >
              {mensaje}
            </div>
          )}

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
                  Facturas registradas
                </h2>

                <p>
                  {
                    facturasFiltradas
                      .length
                  }
                  {' '}
                  factura(s) mostrada(s).
                </p>
              </div>

              <div className="admin-filtros-facturas">
                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Factura, NIT, receptor..."
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
                    setEstadoFiltro(
                      event.target
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

                  <option value="CERTIFICADA">
                    CERTIFICADA
                  </option>

                  <option value="ERROR">
                    ERROR
                  </option>
                </select>

                <button
                  type="button"
                  className="admin-boton-secundario"
                  onClick={() => {
                    setBusqueda('')
                    setEstadoFiltro(
                      'TODOS'
                    )
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {facturasFiltradas
              .length === 0 ? (
                <p>
                  No se encontraron
                  facturas.
                </p>
              ) : (
                <div
                  className="admin-tabla-contenedor"
                  style={{
                    overflowX:
                      'auto',
                  }}
                >
                  <table
                    className="admin-tabla admin-tabla-facturas"
                    style={{
                      minWidth:
                        '1180px',
                    }}
                  >
                    <thead>
                      <tr>
                        <th>
                          Factura
                        </th>

                        <th>
                          Venta
                        </th>

                        <th>
                          Receptor
                        </th>

                        <th>
                          NIT
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Estado
                        </th>

                        <th>
                          Certificada
                        </th>

                        <th>
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {facturasFiltradas.map(
                        (factura) => {
                          const reintentando =
                            procesandoId
                            === `reintento-${factura.id}`

                          return (
                            <tr
                              key={
                                factura.id
                              }
                            >
                              <td>
                                <div className="factura-tabla-identificacion">
                                  <strong>
                                    {
                                      factura
                                        .numero_interno
                                    }
                                  </strong>

                                  {factura
                                    .serie && (
                                      <span>
                                        {
                                          factura
                                            .serie
                                        }
                                        {' '}
                                        {
                                          factura
                                            .numero_documento
                                        }
                                      </span>
                                    )}
                                </div>
                              </td>

                              <td>
                                <div className="factura-tabla-venta">
                                  <strong>
                                    {
                                      factura
                                        .venta
                                        ?.numero_venta
                                      ?? '-'
                                    }
                                  </strong>

                                  <span>
                                    {
                                      factura
                                        .venta
                                        ?.funcion
                                        ?.pelicula
                                        ?.titulo
                                      ?? '-'
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="factura-tabla-receptor">
                                  <strong>
                                    {
                                      factura
                                        .nombre_receptor
                                    }
                                  </strong>

                                  <span>
                                    {obtenerNombreCliente(
                                      factura
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span className="factura-tabla-nit">
                                  {
                                    factura
                                      .nit_receptor
                                  }
                                </span>
                              </td>

                              <td>
                                <strong className="factura-tabla-total">
                                  {formatearMonto(
                                    factura
                                      .total
                                  )}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={
                                    obtenerClaseEstado(
                                      factura
                                        .estado
                                    )
                                  }
                                >
                                  {
                                    factura
                                      .estado
                                  }
                                </span>
                              </td>

                              <td>
                                <span className="factura-tabla-fecha">
                                  {formatearFecha(
                                    factura
                                      .certificada_en
                                  )}
                                </span>
                              </td>

                              <td>
                                <div className="admin-tabla-acciones factura-tabla-acciones">
                                  <button
                                    type="button"
                                    disabled={
                                      cargandoDetalle
                                      || procesandoId
                                        !== null
                                    }
                                    onClick={() =>
                                      verDetalle(
                                        factura
                                      )
                                    }
                                  >
                                    Ver detalle
                                  </button>

                                  {factura
                                    .estado
                                    === 'ERROR' && (
                                      <button
                                        type="button"
                                        disabled={
                                          procesandoId
                                          !== null
                                        }
                                        onClick={() =>
                                          reintentarFactura(
                                            factura
                                          )
                                        }
                                      >
                                        {reintentando
                                          ? 'Reintentando...'
                                          : 'Reintentar facturación'}
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
              )}
          </section>

          {facturaSeleccionada && (
            <section
              className="admin-seccion"
              id="admin-detalle-factura"
            >
              <div className="admin-seccion-titulo">
                <div>
                  <p className="admin-etiqueta">
                    DETALLE
                  </p>

                  <h2>
                    Factura
                  </h2>

                  <p>
                    {
                      facturaSeleccionada
                        .numero_interno
                    }
                  </p>
                </div>

                <span
                  className={
                    obtenerClaseEstado(
                      facturaSeleccionada
                        .estado
                    )
                  }
                >
                  {
                    facturaSeleccionada
                      .estado
                  }
                </span>
              </div>

              {facturaSeleccionada
                .estado
                === 'ERROR' && (
                  <div
                    className="
                      admin-mensaje
                      admin-mensaje-error
                    "
                  >
                    La certificación FEL
                    presentó un error.
                    Puedes revisar los
                    intentos registrados y
                    volver a solicitar la
                    certificación a Digifact.

                    <div className="admin-form-acciones">
                      <button
                        type="button"
                        disabled={
                          procesandoId
                          !== null
                        }
                        onClick={() =>
                          reintentarFactura(
                            facturaSeleccionada
                          )
                        }
                      >
                        {procesandoId
                          === `reintento-${facturaSeleccionada.id}`
                          ? 'Reintentando...'
                          : 'Reintentar facturación'}
                      </button>
                    </div>
                  </div>
                )}

              {facturaSeleccionada
                .estado
                === 'CERTIFICADA' && (
                  <div className="admin-form-acciones">
                    <button
                      type="button"
                      disabled={
                        procesandoDocumento
                      }
                      onClick={() =>
                        descargarDocumento(
                          facturaSeleccionada,
                          'pdf',
                          false
                        )
                      }
                    >
                      Ver PDF
                    </button>

                    <button
                      type="button"
                      disabled={
                        procesandoDocumento
                      }
                      onClick={() =>
                        descargarDocumento(
                          facturaSeleccionada,
                          'pdf',
                          true
                        )
                      }
                    >
                      Descargar PDF
                    </button>

                    <button
                      type="button"
                      disabled={
                        procesandoDocumento
                      }
                      onClick={() =>
                        descargarDocumento(
                          facturaSeleccionada,
                          'xml',
                          true
                        )
                      }
                    >
                      Descargar XML
                    </button>
                  </div>
                )}

              <div className="admin-resumen-factura">
                <div>
                  <span>
                    Venta
                  </span>

                  <strong>
                    {
                      facturaSeleccionada
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
                    {obtenerNombreCliente(
                      facturaSeleccionada
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Receptor
                  </span>

                  <strong>
                    {
                      facturaSeleccionada
                        .nombre_receptor
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    NIT
                  </span>

                  <strong>
                    {
                      facturaSeleccionada
                        .nit_receptor
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Serie
                  </span>

                  <strong>
                    {
                      facturaSeleccionada
                        .serie
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Número FEL
                  </span>

                  <strong>
                    {
                      facturaSeleccionada
                        .numero_documento
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    UUID
                  </span>

                  <strong className="factura-detalle-uuid">
                    {
                      facturaSeleccionada
                        .uuid
                      ?? '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Certificada
                  </span>

                  <strong>
                    {formatearFecha(
                      facturaSeleccionada
                        .certificada_en
                    )}
                  </strong>
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Información económica
                </h3>

                <div className="admin-resumen-factura">
                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatearMonto(
                        facturaSeleccionada
                          .subtotal
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Descuento
                    </span>

                    <strong>
                      {formatearMonto(
                        facturaSeleccionada
                          .descuento
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Impuestos
                    </span>

                    <strong>
                      {formatearMonto(
                        facturaSeleccionada
                          .impuestos
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total
                    </span>

                    <strong className="factura-detalle-total">
                      {formatearMonto(
                        facturaSeleccionada
                          .total
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Detalle facturado
                </h3>

                <div className="admin-factura-lineas">
                  {(
                    facturaSeleccionada
                      .detalles
                    ?? []
                  ).map(
                    (detalle) => (
                      <div
                        key={
                          detalle.id
                        }
                        className="admin-factura-linea"
                      >
                        <div className="factura-linea-cabecera">
                          <strong>
                            Línea #
                            {
                              detalle
                                .numero_linea
                            }
                          </strong>

                          <strong>
                            {formatearMonto(
                              detalle
                                .total_linea
                            )}
                          </strong>
                        </div>

                        <p>
                          {
                            detalle
                              .descripcion
                          }
                        </p>

                        <span>
                          {
                            detalle
                              .cantidad
                          }
                          {' × '}
                          {formatearMonto(
                            detalle
                              .precio_unitario
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="admin-detalle-bloque">
                <h3>
                  Intentos FEL
                </h3>

                {(
                  facturaSeleccionada
                    .intentos
                  ?? []
                ).length === 0 ? (
                  <p>
                    No hay intentos
                    registrados.
                  </p>
                ) : (
                  <div className="admin-factura-intentos">
                    {[
                      ...(
                        facturaSeleccionada
                          .intentos
                        ?? []
                      ),
                    ]
                      .sort(
                        (
                          a,
                          b
                        ) =>
                          Number(
                            b.numero_intento
                          )
                          - Number(
                            a.numero_intento
                          )
                      )
                      .map(
                        (intento) => (
                          <div
                            key={
                              intento.id
                            }
                            className="admin-factura-intento"
                          >
                            <div className="factura-intento-cabecera">
                              <strong>
                                Intento #
                                {
                                  intento
                                    .numero_intento
                                }
                              </strong>

                              <span
                                className={
                                  obtenerClaseIntento(
                                    intento
                                      .estado
                                  )
                                }
                              >
                                {
                                  intento
                                    .estado
                                }
                              </span>
                            </div>

                            <div className="factura-intento-datos">
                              <p>
                                <span>
                                  Operación
                                </span>

                                <strong>
                                  {
                                    intento
                                      .operacion
                                  }
                                </strong>
                              </p>

                              <p>
                                <span>
                                  Código
                                </span>

                                <strong>
                                  {
                                    intento
                                      .codigo_respuesta
                                    ?? '-'
                                  }
                                </strong>
                              </p>

                              <p>
                                <span>
                                  Mensaje
                                </span>

                                <strong>
                                  {
                                    intento
                                      .mensaje_respuesta
                                    ?? 'Sin mensaje'
                                  }
                                </strong>
                              </p>

                              <p>
                                <span>
                                  Procesado
                                </span>

                                <strong>
                                  {formatearFecha(
                                    intento
                                      .procesado_en
                                  )}
                                </strong>
                              </p>
                            </div>
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
                  Incidencias de facturación
                </h2>

                <p>
                  Las facturas se generan
                  automáticamente después
                  de confirmar el pago.
                  Aquí únicamente aparecen
                  ventas pagadas que todavía
                  no poseen una factura
                  registrada.
                </p>
              </div>

              {ventasSinFactura.length
                > 0 && (
                  <span className="admin-etiqueta">
                    {
                      ventasSinFactura.length
                    }
                    {' '}
                    incidencias pendientes
                  </span>
                )}
            </div>

            {ventasSinFactura.length
              === 0 ? (
                <div className="factura-sin-pendientes">
                  <strong>
                    Sin incidencias pendientes
                  </strong>

                  <p>
                    Todas las ventas pagadas
                    poseen una factura
                    registrada.
                  </p>
                </div>
              ) : (
                <div
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
                        '980px',
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
                          Total
                        </th>

                        <th>
                          Datos fiscales
                        </th>

                        <th>
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {ventasSinFactura.map(
                        (venta) => {
                          const datosFiscales =
                            obtenerDatosFiscalVenta(
                              venta
                            )

                          const procesando =
                            procesandoId
                            === `faltante-${venta.id}`

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
                                <div className="factura-tabla-receptor">
                                  <strong>
                                    {obtenerNombreCliente(
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
                                {
                                  venta
                                    .funcion
                                    ?.pelicula
                                    ?.titulo
                                  ?? '-'
                                }
                              </td>

                              <td>
                                <strong className="factura-tabla-total">
                                  {formatearMonto(
                                    venta.total
                                  )}
                                </strong>
                              </td>

                              <td>
                                <div className="factura-tabla-receptor">
                                  <strong>
                                    {
                                      datosFiscales
                                        .nit_receptor
                                    }
                                  </strong>

                                  <span>
                                    {
                                      datosFiscales
                                        .nombre_receptor
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="admin-tabla-acciones">
                                  <button
                                    type="button"
                                    disabled={
                                      procesandoId
                                      !== null
                                    }
                                    style={{
                                      whiteSpace:
                                        'nowrap',
                                    }}
                                    onClick={() =>
                                      generarFacturaFaltante(
                                        venta
                                      )
                                    }
                                  >
                                    {procesando
                                      ? 'Generando...'
                                      : 'Generar factura faltante'}
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
    </div>
  )
}

export default AdminFacturas