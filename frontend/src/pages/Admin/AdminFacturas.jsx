import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

const formularioInicial = {
  venta_id: '',
  nit_receptor: 'CF',
  nombre_receptor: 'Consumidor Final',
}

function AdminFacturas() {
  const [facturas, setFacturas] = useState([])
  const [ventas, setVentas] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false)

  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] =
    useState('TODOS')

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')

      const [
        facturasRespuesta,
        ventasRespuesta,
      ] = await Promise.all([
        api.get('/facturas'),
        api.get('/ventas'),
      ])

      setFacturas(
        facturasRespuesta.data.data ?? [],
      )

      setVentas(
        ventasRespuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar la información de facturación.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
  }

  const obtenerPrimerError = (err) => {
    const errores =
      err.response?.data?.errors

    if (errores) {
      const primerError =
        Object.values(errores)?.[0]?.[0]

      if (primerError) {
        return primerError
      }
    }

    return (
      err.response?.data?.message
      ?? 'Ocurrió un error al procesar la solicitud.'
    )
  }

  const formatearMonto = (valor) => {
    return `Q${Number(valor ?? 0).toFixed(2)}`
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

  const obtenerNombreCliente = (factura) => {
    const cliente =
      factura.venta?.cliente

    if (!cliente) {
      return '-'
    }

    return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim()
  }

  const ventasFacturadas = useMemo(() => {
    return new Set(
      facturas.map(
        (factura) =>
          Number(factura.venta_id),
      ),
    )
  }, [facturas])

  const ventasDisponibles = useMemo(() => {
    return ventas.filter(
      (venta) =>
        venta.estado === 'PAGADA'
        && !ventasFacturadas.has(
          Number(venta.id),
        ),
    )
  }, [
    ventas,
    ventasFacturadas,
  ])

  const facturasFiltradas = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase()

    return facturas.filter((factura) => {
      if (
        estadoFiltro !== 'TODOS'
        && factura.estado !== estadoFiltro
      ) {
        return false
      }

      if (!termino) {
        return true
      }

      const numeroInterno =
        (factura.numero_interno ?? '')
          .toLowerCase()

      const serie =
        (factura.serie ?? '')
          .toLowerCase()

      const numeroDocumento =
        (factura.numero_documento ?? '')
          .toLowerCase()

      const uuid =
        (factura.uuid ?? '')
          .toLowerCase()

      const receptor =
        (factura.nombre_receptor ?? '')
          .toLowerCase()

      const nit =
        (factura.nit_receptor ?? '')
          .toLowerCase()

      const venta =
        (factura.venta?.numero_venta ?? '')
          .toLowerCase()

      const cliente =
        obtenerNombreCliente(factura)
          .toLowerCase()

      return (
        numeroInterno.includes(termino)
        || serie.includes(termino)
        || numeroDocumento.includes(termino)
        || uuid.includes(termino)
        || receptor.includes(termino)
        || nit.includes(termino)
        || venta.includes(termino)
        || cliente.includes(termino)
      )
    })
  }, [
    facturas,
    busqueda,
    estadoFiltro,
  ])

  const manejarCambio = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }))
  }

  const cambiarNit = (event) => {
    const valor = event.target.value

    setFormulario((anterior) => ({
      ...anterior,
      nit_receptor: valor,
      nombre_receptor:
        valor.trim().toUpperCase() === 'CF'
          && (
            !anterior.nombre_receptor
            || anterior.nombre_receptor
              === 'Consumidor Final'
          )
          ? 'Consumidor Final'
          : anterior.nombre_receptor,
    }))
  }

  const generarFactura = async (event) => {
    event.preventDefault()

    try {
      setGuardando(true)
      limpiarMensajes()

      const respuesta =
        await api.post(
          '/facturas',
          {
            venta_id:
              Number(formulario.venta_id),

            nit_receptor:
              formulario.nit_receptor
                .trim()
                .toUpperCase(),

            nombre_receptor:
              formulario.nombre_receptor
                .trim(),
          },
        )

      setMensaje(
        'Factura generada y certificada correctamente.',
      )

      setFacturaSeleccionada(
        respuesta.data.data,
      )

      setFormulario(
        formularioInicial,
      )

      await cargarDatos()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(
        obtenerPrimerError(err),
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setGuardando(false)
    }
  }

  const verDetalle = async (factura) => {
    try {
      setCargandoDetalle(true)
      setError('')

      const respuesta =
        await api.get(
          `/facturas/${factura.id}`,
        )

      setFacturaSeleccionada(
        respuesta.data.data,
      )

      setTimeout(() => {
        document
          .getElementById(
            'admin-detalle-factura',
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 0)
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar el detalle de la factura.',
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

  const obtenerClaseEstado = (estado) => {
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

  const obtenerClaseIntento = (estado) => {
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

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando facturas...</p>
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

          <h1>Facturas</h1>

          <p>
            Genera y consulta la facturación
            electrónica de Atlantic Cinema.
          </p>
        </div>

        <Link
          to="/admin"
          className="admin-volver"
        >
          ← Volver al panel
        </Link>
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
              Generar factura
            </h2>

            <p>
              Solo aparecen ventas pagadas
              que todavía no poseen factura.
            </p>
          </div>
        </div>

        {ventasDisponibles.length === 0 ? (
          <p>
            No hay ventas pendientes de
            facturación.
          </p>
        ) : (
          <form
            className="admin-formulario"
            onSubmit={generarFactura}
          >
            <div className="admin-form-grid">
              <label>
                Venta
                <select
                  name="venta_id"
                  value={
                    formulario.venta_id
                  }
                  onChange={manejarCambio}
                  required
                >
                  <option value="">
                    Seleccionar
                  </option>

                  {ventasDisponibles.map(
                    (venta) => (
                      <option
                        key={venta.id}
                        value={venta.id}
                      >
                        {venta.numero_venta}
                        {' · '}
                        {formatearMonto(
                          venta.total,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                NIT receptor
                <input
                  type="text"
                  name="nit_receptor"
                  value={
                    formulario.nit_receptor
                  }
                  onChange={cambiarNit}
                  required
                />
              </label>

              <label>
                Nombre receptor
                <input
                  type="text"
                  name="nombre_receptor"
                  value={
                    formulario.nombre_receptor
                  }
                  onChange={manejarCambio}
                  required
                />
              </label>
            </div>

            <p className="admin-ayuda">
              Para consumidor final utiliza
              NIT CF y nombre Consumidor Final.
            </p>

            <div className="admin-form-acciones">
              <button
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? 'Generando...'
                  : 'Generar factura'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="admin-seccion">
        <div className="admin-seccion-titulo">
          <div>
            <h2>
              Facturas registradas
            </h2>

            <p>
              {facturasFiltradas.length}
              {' '}
              factura(s) mostrada(s).
            </p>
          </div>

          <div className="admin-filtros-facturas">
            <input
              className="admin-buscador"
              type="search"
              placeholder="Factura, NIT, receptor..."
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

              <option value="CERTIFICADA">
                CERTIFICADA
              </option>

              <option value="ERROR">
                ERROR
              </option>
            </select>
          </div>
        </div>

        {facturasFiltradas.length === 0 ? (
          <p>
            No se encontraron facturas.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-facturas">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Venta</th>
                  <th>Receptor</th>
                  <th>NIT</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Certificada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {facturasFiltradas.map(
                  (factura) => (
                    <tr key={factura.id}>
                      <td>
                        <strong>
                          {
                            factura.numero_interno
                          }
                        </strong>

                        {factura.serie && (
                          <small>
                            {factura.serie}
                            {' '}
                            {
                              factura
                                .numero_documento
                            }
                          </small>
                        )}
                      </td>

                      <td>
                        {
                          factura.venta
                            ?.numero_venta
                          ?? '-'
                        }
                      </td>

                      <td>
                        {
                          factura.nombre_receptor
                        }
                      </td>

                      <td>
                        {
                          factura.nit_receptor
                        }
                      </td>

                      <td>
                        {formatearMonto(
                          factura.total,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            obtenerClaseEstado(
                              factura.estado,
                            )
                          }
                        >
                          {factura.estado}
                        </span>
                      </td>

                      <td>
                        {formatearFecha(
                          factura.certificada_en,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          disabled={
                            cargandoDetalle
                          }
                          onClick={() =>
                            verDetalle(
                              factura,
                            )
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

      {facturaSeleccionada && (
        <section
          className="admin-seccion"
          id="admin-detalle-factura"
        >
          <div className="admin-seccion-titulo">
            <div>
              <h2>
                Detalle de factura
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
                  facturaSeleccionada.estado,
                )
              }
            >
              {
                facturaSeleccionada.estado
              }
            </span>
          </div>

          <div className="admin-resumen-factura">
            <div>
              <span>Venta</span>

              <strong>
                {
                  facturaSeleccionada.venta
                    ?.numero_venta
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Cliente</span>

              <strong>
                {obtenerNombreCliente(
                  facturaSeleccionada,
                )}
              </strong>
            </div>

            <div>
              <span>Receptor</span>

              <strong>
                {
                  facturaSeleccionada
                    .nombre_receptor
                }
              </strong>
            </div>

            <div>
              <span>NIT</span>

              <strong>
                {
                  facturaSeleccionada
                    .nit_receptor
                }
              </strong>
            </div>

            <div>
              <span>Serie</span>

              <strong>
                {
                  facturaSeleccionada.serie
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Número FEL</span>

              <strong>
                {
                  facturaSeleccionada
                    .numero_documento
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>UUID</span>

              <strong>
                {
                  facturaSeleccionada.uuid
                  ?? '-'
                }
              </strong>
            </div>

            <div>
              <span>Certificada</span>

              <strong>
                {formatearFecha(
                  facturaSeleccionada
                    .certificada_en,
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
                <span>Subtotal</span>

                <strong>
                  {formatearMonto(
                    facturaSeleccionada
                      .subtotal,
                  )}
                </strong>
              </div>

              <div>
                <span>Descuento</span>

                <strong>
                  {formatearMonto(
                    facturaSeleccionada
                      .descuento,
                  )}
                </strong>
              </div>

              <div>
                <span>Impuestos</span>

                <strong>
                  {formatearMonto(
                    facturaSeleccionada
                      .impuestos,
                  )}
                </strong>
              </div>

              <div>
                <span>Total</span>

                <strong>
                  {formatearMonto(
                    facturaSeleccionada
                      .total,
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
                facturaSeleccionada.detalles
                ?? []
              ).map((detalle) => (
                <div
                  key={detalle.id}
                  className="admin-factura-linea"
                >
                  <strong>
                    Línea #
                    {
                      detalle.numero_linea
                    }
                  </strong>

                  <p>
                    {
                      detalle.descripcion
                    }
                  </p>

                  <span>
                    {
                      detalle.cantidad
                    }
                    {' × '}
                    {formatearMonto(
                      detalle.precio_unitario,
                    )}
                  </span>

                  <strong>
                    {formatearMonto(
                      detalle.total_linea,
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-detalle-bloque">
            <h3>
              Intentos FEL
            </h3>

            {(
              facturaSeleccionada.intentos
              ?? []
            ).length === 0 ? (
              <p>
                No hay intentos registrados.
              </p>
            ) : (
              <div className="admin-factura-intentos">
                {(
                  facturaSeleccionada
                    .intentos
                  ?? []
                ).map((intento) => (
                  <div
                    key={intento.id}
                    className="admin-factura-intento"
                  >
                    <div>
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
                            intento.estado,
                          )
                        }
                      >
                        {intento.estado}
                      </span>
                    </div>

                    <p>
                      Operación:
                      {' '}
                      {intento.operacion}
                    </p>

                    <p>
                      Código:
                      {' '}
                      {
                        intento
                          .codigo_respuesta
                        ?? '-'
                      }
                    </p>

                    <p>
                      {
                        intento
                          .mensaje_respuesta
                        ?? 'Sin mensaje'
                      }
                    </p>

                    <small>
                      Procesado:
                      {' '}
                      {formatearFecha(
                        intento
                          .procesado_en,
                      )}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AdminFacturas