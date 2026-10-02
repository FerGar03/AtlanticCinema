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
import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function PagoCompra() {
  const { ventaId } = useParams()

  const [venta, setVenta] =
    useState(null)

  const [pago, setPago] =
    useState(null)

  const [cargando, setCargando] =
    useState(true)

  const [
    iniciandoPago,
    setIniciandoPago,
  ] = useState(false)

  const [
    confirmandoPago,
    setConfirmandoPago,
  ] = useState(false)

  const [
    tipoFacturacion,
    setTipoFacturacion,
  ] = useState('CF')

  const [nit, setNit] =
    useState('')

  const [
    verificandoNit,
    setVerificandoNit,
  ] = useState(false)

  const [
    nitVerificado,
    setNitVerificado,
  ] = useState(false)

  const [
    nitVerificadoValor,
    setNitVerificadoValor,
  ] = useState('')

  const [
    nombreFacturacion,
    setNombreFacturacion,
  ] = useState(
    'Consumidor Final'
  )

  const [
    numeroCopiado,
    setNumeroCopiado,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [
    politicaAceptada,
    setPoliticaAceptada,
  ] = useState(false)

  useEffect(() => {
    const cargarVenta =
      async () => {
        try {
          const response =
            await api.get(
              `/ventas/${ventaId}`
            )

          const data =
            response.data.data
            ?? response.data

          setVenta(data)

          if (
            data.nit_facturacion
            && data.nit_facturacion
            !== 'CF'
          ) {
            setTipoFacturacion(
              'NIT'
            )

            setNit(
              data.nit_facturacion
            )

            setNitVerificadoValor(
              data.nit_facturacion
            )

            setNitVerificado(true)

            setNombreFacturacion(
              data.nombre_facturacion
              ?? ''
            )
          } else {
            setTipoFacturacion(
              'CF'
            )

            setNombreFacturacion(
              'Consumidor Final'
            )
          }
        } catch (err) {
          setError(
            err.response
              ?.data
              ?.message
            || 'No fue posible cargar la compra.'
          )
        } finally {
          setCargando(false)
        }
      }

    cargarVenta()
  }, [ventaId])

  const asientos =
    useMemo(() => {
      if (!venta?.entradas) {
        return []
      }

      return venta.entradas
        .map((entrada) => {
          const asiento =
            entrada.funcion_asiento
              ?.asiento
            ?? entrada.funcionAsiento
              ?.asiento

          if (!asiento) {
            return null
          }

          return `${asiento.fila}${asiento.numero}`
        })
        .filter(Boolean)
    }, [venta])

  const obtenerMensajeError = (
    err,
    mensajePredeterminado
  ) => {
    const errores =
      err.response
        ?.data
        ?.errors

    if (errores) {
      return Object
        .values(errores)
        .flat()
        .join(' ')
    }

    return (
      err.response
        ?.data
        ?.message
      || mensajePredeterminado
    )
  }

  const formatearNombreFiscal = (
    nombre
  ) => {
    if (!nombre) {
      return ''
    }

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
  }

  const cambiarTipoFacturacion = (
    tipo
  ) => {
    setTipoFacturacion(
      tipo
    )

    setError('')

    if (tipo === 'CF') {
      setNit('')
      setNitVerificado(false)
      setNitVerificadoValor('')

      setNombreFacturacion(
        'Consumidor Final'
      )

      return
    }

    setNitVerificado(false)
    setNitVerificadoValor('')
    setNombreFacturacion('')
  }

  const cambiarNit = (
    event
  ) => {
    const valor =
      event.target.value
        .replace(/\s+/g, '')
        .toUpperCase()

    setNit(valor)

    if (
      valor
      !== nitVerificadoValor
    ) {
      setNitVerificado(false)
      setNombreFacturacion('')
    }
  }

  const verificarNit =
    async () => {
      if (!nit.trim()) {
        setError(
          'Ingresa un NIT para verificarlo.'
        )

        return
      }

      setError('')
      setVerificandoNit(true)

      try {
        const response =
          await api.patch(
            `/ventas/${ventaId}/facturacion`,
            {
              tipo_facturacion:
                'NIT',

              nit:
                nit.trim(),
            }
          )

        const data =
          response.data.data
          ?? response.data

        const nitConfirmado =
          data.nit_facturacion
          ?? nit.trim()

        const nombre =
          data.nombre_facturacion
          ?? ''

        setVenta(data)

        setNit(
          nitConfirmado
        )

        setNitVerificadoValor(
          nitConfirmado
        )

        setNombreFacturacion(
          nombre
        )

        setNitVerificado(true)
      } catch (err) {
        setNitVerificado(false)
        setNitVerificadoValor('')
        setNombreFacturacion('')

        setError(
          obtenerMensajeError(
            err,
            'No fue posible verificar el NIT.'
          )
        )
      } finally {
        setVerificandoNit(false)
      }
    }

  const configurarConsumidorFinal =
    async () => {
      const response =
        await api.patch(
          `/ventas/${ventaId}/facturacion`,
          {
            tipo_facturacion:
              'CF',
          }
        )

      const data =
        response.data.data
        ?? response.data

      setVenta(data)

      setNombreFacturacion(
        'Consumidor Final'
      )

      return data
    }

  const iniciarPago =
    async () => {
      if (!politicaAceptada) {
        setError(
          'Debes aceptar la política de compra antes de continuar con el pago.'
        )

        return
      }

      setError('')
      setIniciandoPago(true)

      try {
        if (
          tipoFacturacion
          === 'NIT'
        ) {
          if (!nit.trim()) {
            throw new Error(
              'Ingresa el NIT para la factura.'
            )
          }

          if (
            !nitVerificado
            || nit.trim()
              !== nitVerificadoValor
          ) {
            throw new Error(
              'Debes verificar el NIT antes de continuar con el pago.'
            )
          }
        } else {
          await configurarConsumidorFinal()
        }

        const response =
          await api.post(
            '/pagos',
            {
              venta_id:
                Number(ventaId),

              metodo_pago_id:
                2,

              descripcion:
                'Pago con tarjeta iniciado desde compra web.',
            }
          )

        const data =
          response.data.data
          ?? response.data

        setPago(data)

        if (
          data.proveedor
          === 'RECURRENTE'
        ) {
          if (
            !data.client_secret
          ) {
            throw new Error(
              'Recurrente no devolvió la URL del checkout.'
            )
          }

          sessionStorage.setItem(
            'atlanticCinemaVentaPago',
            String(ventaId)
          )

          window.location.href =
            data.client_secret

          return
        }
      } catch (err) {
        if (err.response) {
          setError(
            obtenerMensajeError(
              err,
              'No fue posible iniciar el pago con tarjeta.'
            )
          )
        } else {
          setError(
            err.message
            || 'No fue posible iniciar el pago con tarjeta.'
          )
        }
      } finally {
        setIniciandoPago(false)
      }
    }

  const confirmarPago =
    async (
      resultado
    ) => {
      if (!pago) {
        return
      }

      setError('')
      setConfirmandoPago(true)

      try {
        const response =
          await api.post(
            `/pagos/${pago.id}/confirmar-simulacion`,
            {
              resultado,
            }
          )

        const data =
          response.data.data
          ?? response.data

        setPago(data)

        if (
          resultado
          === 'APROBADO'
        ) {
          setVenta(
            (actual) => ({
              ...actual,

              estado:
                'PAGADA',

              pagada_en:
                data.venta
                  ?.pagada_en
                ?? new Date()
                  .toISOString(),
            })
          )
        } else {
          setVenta(
            (actual) => ({
              ...actual,

              estado:
                'FALLIDA',
            })
          )
        }
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            'No fue posible confirmar el pago.'
          )
        )
      } finally {
        setConfirmandoPago(false)
      }
    }

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

  const formatearFecha = (
    fecha
  ) => {
    if (!fecha) {
      return 'No disponible'
    }

    return new Intl
      .DateTimeFormat(
        'es-GT',
        {
          timeZone:
            'America/Guatemala',

          weekday:
            'long',

          day:
            'numeric',

          month:
            'long',

          year:
            'numeric',

          hour:
            'numeric',

          minute:
            '2-digit',

          hour12:
            true,
        }
      )
      .format(
        new Date(fecha)
      )
  }

  const obtenerClaseEstado = (
    estado
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'pago-estado pago-estado-pendiente'

      case 'PAGADA':
        return 'pago-estado pago-estado-pagada'

      case 'FALLIDA':
        return 'pago-estado pago-estado-fallida'

      case 'CANCELADA':
        return 'pago-estado pago-estado-cancelada'

      default:
        return 'pago-estado'
    }
  }

  if (cargando) {
    return (
      <main className="pago-pagina-cargando">
        <div className="cartelera-spinner" />

        <p>
          Preparando tu compra...
        </p>
      </main>
    )
  }

  if (
    error
    && !venta
  ) {
    return (
      <main className="pago-error-pagina">
        <section className="pago-error-card">
          <div className="pago-error-icono">
            !
          </div>

          <span className="pago-etiqueta">
            COMPRA
          </span>

          <h1>
            No pudimos cargar tu compra
          </h1>

          <p>
            {error}
          </p>

          <Link
            to="/"
            className="pago-boton-principal"
          >
            Volver a la cartelera
          </Link>
        </section>
      </main>
    )
  }

  if (!venta) {
    return null
  }

  const funcion =
    venta.funcion

  const pelicula =
    funcion?.pelicula

  const sala =
    funcion?.sala

  const formato =
    funcion?.formato

  const pagoPendiente =
    pago?.estado
    === 'PENDIENTE'

  const puedePagarConNit =
    tipoFacturacion
    !== 'NIT'
    || (
      nitVerificado
      && nit.trim()
        === nitVerificadoValor
    )

  const imagenPelicula =
    pelicula?.imagen_url

  return (
    <main className="pago-compra-pagina">
      <header className="pago-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="pago-logo-contenedor">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="pago-logo-imagen"
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

        <Link
          to="/"
          className="pago-volver"
        >
          ← Volver a cartelera
        </Link>
      </header>

      <section className="pago-compra-contenido-nuevo">
        <div className="pago-compra-cabecera">
          <div>
            <span className="pago-etiqueta">
              COMPLETAR COMPRA
            </span>

            <h1>
              {venta.estado
                === 'PAGADA'
                ? 'Compra completada'
                : 'Revisa tu compra'}
            </h1>

            <p>
              {venta.estado
                === 'PAGADA'
                ? 'Tu pago fue confirmado correctamente.'
                : 'Verifica los datos antes de continuar al pago seguro.'}
            </p>
          </div>

          <span
            className={
              obtenerClaseEstado(
                venta.estado
              )
            }
          >
            {venta.estado}
          </span>
        </div>

        {error && (
          <div className="pago-mensaje-error">
            {error}
          </div>
        )}

        <div className="pago-layout">
          <section className="pago-resumen-card">
            <div className="pago-numero-venta pago-numero-venta-final">
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
                className="pago-copiar-numero"
                onClick={
                  copiarNumeroVenta
                }
              >
                {numeroCopiado
                  ? '✓ Copiado'
                  : 'Copiar número'}
              </button>
            </div>

            <div className="pago-pelicula-bloque pago-pelicula-final">
              {imagenPelicula && (
                <>
                  <img
                    src={
                      imagenPelicula
                    }
                    alt=""
                    className="pago-pelicula-fondo"
                  />

                  <div className="pago-pelicula-overlay" />
                </>
              )}

              <div className="pago-pelicula-contenido">
                <span>
                  PELÍCULA
                </span>

                <h2>
                  {pelicula?.titulo
                    ?? 'Película'}
                </h2>
              </div>
            </div>

            <div className="pago-datos-grid">
              <div>
                <span>
                  Sala
                </span>

                <strong>
                  {sala?.nombre
                    ?? 'No disponible'}
                </strong>
              </div>

              <div>
                <span>
                  Formato
                </span>

                <strong>
                  {formato?.nombre
                    ?? 'No disponible'}
                </strong>
              </div>

              <div>
                <span>
                  Función
                </span>

                <strong>
                  {formatearFecha(
                    funcion?.inicia_en
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Entradas
                </span>

                <strong>
                  {
                    venta.entradas
                      ?.length
                    ?? 0
                  }
                </strong>
              </div>
            </div>

            <div className="pago-asientos-seccion">
              <div className="pago-seccion-titulo">
                <span>
                  Asientos
                </span>

                <strong>
                  {asientos.length}
                </strong>
              </div>

              {asientos.length > 0 ? (
                <div className="pago-asientos-lista">
                  {asientos.map(
                    (asiento) => (
                      <span
                        key={asiento}
                      >
                        {asiento}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p>
                  Sin información de
                  asientos.
                </p>
              )}
            </div>

            {venta.estado ===
              'PENDIENTE' && (
                <div className="pago-bloqueo-aviso">
                  <strong>
                    Asientos retenidos
                    temporalmente
                  </strong>

                  <p>
                    Mientras completas el
                    pago, otros usuarios no
                    podrán seleccionar estos
                    asientos.
                  </p>
                </div>
              )}
          </section>

          <aside className="pago-panel">
            <span className="pago-etiqueta">
              RESUMEN
            </span>

            <h2>
              {venta.estado
                === 'PAGADA'
                ? 'Compra confirmada'
                : 'Total a pagar'}
            </h2>

            <div className="pago-total pago-total-final">
              <span>
                Total
              </span>

              <strong>
                Q
                {Number(
                  venta.total ?? 0
                ).toFixed(2)}
              </strong>
            </div>

            {venta.estado ===
              'PENDIENTE' && (
                <>
                  {!pago && (
                    <section className="pago-facturacion">
                      <div className="pago-facturacion-cabecera">
                        <strong>
                          Datos de facturación
                        </strong>

                        <span>
                          Selecciona cómo deseas
                          emitir tu factura FEL.
                        </span>
                      </div>

                      <label
                        className={`pago-facturacion-opcion ${
                          tipoFacturacion
                          === 'CF'
                            ? 'pago-facturacion-opcion-activa'
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipoFacturacion"
                          value="CF"
                          checked={
                            tipoFacturacion
                            === 'CF'
                          }
                          onChange={() =>
                            cambiarTipoFacturacion(
                              'CF'
                            )
                          }
                        />

                        <div>
                          <strong>
                            Consumidor Final
                          </strong>

                          <small>
                            La factura se emitirá
                            con NIT CF.
                          </small>
                        </div>
                      </label>

                      <label
                        className={`pago-facturacion-opcion ${
                          tipoFacturacion
                          === 'NIT'
                            ? 'pago-facturacion-opcion-activa'
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipoFacturacion"
                          value="NIT"
                          checked={
                            tipoFacturacion
                            === 'NIT'
                          }
                          onChange={() =>
                            cambiarTipoFacturacion(
                              'NIT'
                            )
                          }
                        />

                        <div>
                          <strong>
                            Factura con NIT
                          </strong>

                          <small>
                            Digifact verificará
                            automáticamente tus
                            datos fiscales.
                          </small>
                        </div>
                      </label>

                      {tipoFacturacion ===
                        'NIT' && (
                          <div className="pago-facturacion-nit">
                            <label
                              htmlFor="nitFacturacion"
                            >
                              NIT
                            </label>

                            <div className="pago-facturacion-nit-fila">
                              <input
                                id="nitFacturacion"
                                type="text"
                                value={nit}
                                onChange={
                                  cambiarNit
                                }
                                placeholder="Ej. 110666992"
                                autoComplete="off"
                                disabled={
                                  verificandoNit
                                  || iniciandoPago
                                }
                              />

                              <button
                                type="button"
                                onClick={
                                  verificarNit
                                }
                                disabled={
                                  verificandoNit
                                  || iniciandoPago
                                  || !nit.trim()
                                }
                              >
                                {verificandoNit
                                  ? 'Verificando...'
                                  : 'Verificar NIT'}
                              </button>
                            </div>

                            {nitVerificado && (
                              <div className="pago-nit-verificado">
                                <strong>
                                  ✓ NIT verificado
                                </strong>

                                <span>
                                  {
                                    formatearNombreFiscal(
                                      nombreFacturacion
                                    )
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                      {tipoFacturacion ===
                        'CF' && (
                          <div className="pago-nit-verificado">
                            <strong>
                              Consumidor Final
                            </strong>

                            <span>
                              NIT CF · Consumidor Final
                            </span>
                          </div>
                        )}
                    </section>
                  )}

                  <section className="pago-metodo pago-metodo-final">
                    {!pago && (
                      <>
                        <div className="pago-metodo-cabecera">
                          <div className="pago-tarjeta-icono pago-tarjeta-icono-final">
                            <span>
                              ▰
                            </span>
                          </div>

                          <div>
                            <strong>
                              Pago con tarjeta
                            </strong>

                            <span>
                              Procesado de forma
                              segura por Recurrente
                            </span>
                          </div>
                        </div>

                        <div className="pago-proveedor">
                          <div>
                            <span>
                              PROVEEDOR DE PAGO
                            </span>

                            <strong>
                              Recurrente
                            </strong>
                          </div>

                          <span className="pago-proveedor-seguro">
                            Pago seguro
                          </span>
                        </div>

                        <div className="pago-seguridad">
                          <strong>
                            Tus datos están protegidos
                          </strong>

                          <p>
                            Atlantic Cinema no
                            almacena los datos de
                            tu tarjeta. Serás
                            redirigido a Recurrente
                            para completar la
                            transacción.
                          </p>
                        </div>

                        <div className="pago-politica-compra">
                          <div className="pago-politica-cabecera">
                            <strong>
                              Política de compra
                            </strong>

                            <span>
                              IMPORTANTE
                            </span>
                          </div>

                          <p>
                            Las entradas adquiridas
                            no admiten cambios ni
                            reembolsos una vez
                            confirmado el pago.
                            Verifica la película,
                            fecha, horario, sala y
                            asientos antes de
                            continuar.
                          </p>

                          <label className="pago-politica-aceptacion">
                            <input
                              type="checkbox"
                              checked={
                                politicaAceptada
                              }
                              onChange={(event) =>
                                setPoliticaAceptada(
                                  event.target.checked
                                )
                              }
                              disabled={
                                iniciandoPago
                                || verificandoNit
                              }
                            />

                            <span>
                              He revisado los datos
                              de mi compra y acepto
                              la política de compra.
                            </span>
                          </label>
                        </div>

                        <button
                          type="button"
                          className="pago-boton-principal pago-boton-pagar-final"
                          onClick={
                            iniciarPago
                          }
                          disabled={
                            iniciandoPago
                            || verificandoNit
                            || !puedePagarConNit
                            || !politicaAceptada
                          }
                        >
                          {iniciandoPago
                            ? 'Conectando con Recurrente...'
                            : `Pagar Q${Number(
                                venta.total
                                ?? 0
                              ).toFixed(2)}`
                          }
                        </button>

                        {tipoFacturacion ===
                          'NIT'
                          && !nitVerificado && (
                            <small className="pago-nota">
                              Verifica el NIT antes
                              de continuar con el
                              pago.
                            </small>
                          )}
                      </>
                    )}

                    {pago && (
                      <div className="pago-intento">
                        <span>
                          INTENTO DE PAGO
                        </span>

                        <div>
                          <small>
                            Proveedor
                          </small>

                          <strong>
                            {pago.proveedor}
                          </strong>
                        </div>

                        <div>
                          <small>
                            Estado
                          </small>

                          <strong>
                            {pago.estado}
                          </strong>
                        </div>

                        {pago
                          .referencia_proveedor && (
                            <div>
                              <small>
                                Referencia
                              </small>

                              <strong className="pago-referencia">
                                {
                                  pago
                                    .referencia_proveedor
                                }
                              </strong>
                            </div>
                          )}
                      </div>
                    )}

                    {pago?.proveedor ===
                      'SIMULADOR'
                      && pagoPendiente && (
                        <div className="pago-simulador">
                          <span>
                            MODO DE PRUEBA
                          </span>

                          <p>
                            Selecciona el resultado
                            que deseas simular.
                          </p>

                          <button
                            type="button"
                            className="pago-simulador-aprobar"
                            onClick={() =>
                              confirmarPago(
                                'APROBADO'
                              )
                            }
                            disabled={
                              confirmandoPago
                            }
                          >
                            {confirmandoPago
                              ? 'Procesando...'
                              : 'Simular aprobado'}
                          </button>

                          <button
                            type="button"
                            className="pago-simulador-rechazar"
                            onClick={() =>
                              confirmarPago(
                                'RECHAZADO'
                              )
                            }
                            disabled={
                              confirmandoPago
                            }
                          >
                            {confirmandoPago
                              ? 'Procesando...'
                              : 'Simular rechazado'}
                          </button>
                        </div>
                      )}
                  </section>
                </>
              )}

            {venta.estado ===
              'PAGADA' && (
                <div className="pago-resultado-estado pago-resultado-pagada pago-resultado-final">
                  <div className="pago-resultado-icono">
                    ✓
                  </div>

                  <strong>
                    Compra pagada
                  </strong>

                  <p>
                    El pago fue confirmado
                    correctamente. Tus documentos
                    electrónicos serán asociados
                    a esta compra.
                  </p>

                  <div className="pago-resultado-acciones">
                    <Link
                      to="/mis-operaciones"
                      className="pago-boton-principal"
                    >
                      Ver mis compras
                    </Link>

                    <Link
                      to="/"
                      className="pago-boton-secundario"
                    >
                      Volver a cartelera
                    </Link>
                  </div>
                </div>
              )}

            {venta.estado ===
              'FALLIDA' && (
                <div className="pago-resultado-estado pago-resultado-fallida">
                  <strong>
                    Pago no completado
                  </strong>

                  <p>
                    La compra no pudo ser
                    completada.
                  </p>

                  <Link
                    to="/"
                    className="pago-boton-secundario"
                  >
                    Volver a cartelera
                  </Link>
                </div>
              )}

            {venta.estado ===
              'CANCELADA' && (
                <div className="pago-resultado-estado pago-resultado-fallida">
                  <strong>
                    Compra cancelada
                  </strong>

                  <p>
                    Esta compra ya no está
                    disponible para recibir
                    pagos.
                  </p>

                  <Link
                    to="/"
                    className="pago-boton-secundario"
                  >
                    Volver a cartelera
                  </Link>
                </div>
              )}

            {venta.estado ===
              'PENDIENTE' && (
                <small className="pago-nota">
                  No cierres la ventana durante
                  el proceso de redirección al
                  proveedor de pagos.
                </small>
              )}
          </aside>
        </div>
      </section>

      <footer className="cartelera-footer">
        <div className="cartelera-footer-marca">
          <div className="pago-logo-contenedor pago-logo-footer">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="pago-logo-imagen"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <span>
              Tu cine, tu experiencia.
            </span>
          </div>
        </div>

        <small>
          © 2026 Atlantic Cinema
        </small>
      </footer>
    </main>
  )
}

export default PagoCompra
