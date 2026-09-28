import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function FuncionDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    autenticado,
    usuario,
    logout,
  } = useAuth()

  const [funcion, setFuncion] =
    useState(null)

  const [
    seleccionados,
    setSeleccionados,
  ] = useState([])

  const [cargando, setCargando] =
    useState(true)

  const [
    creandoReserva,
    setCreandoReserva,
  ] = useState(false)

  const [
    creandoCompra,
    setCreandoCompra,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [
    confirmacion,
    setConfirmacion,
  ] = useState(null)

  const cargarFuncion =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            `/funciones/${id}`
          )

        const data =
          response.data.data
          ?? response.data

        setFuncion(data)
      } catch (err) {
        setError(
          err.response?.data?.message
          || 'No fue posible cargar la información de la función.'
        )
      } finally {
        setCargando(false)
      }
    }, [id])

  useEffect(() => {
    cargarFuncion()
  }, [cargarFuncion])

  const asientos =
    useMemo(() => {
      if (!funcion) {
        return []
      }

      return (
        funcion.funcion_asientos
        ?? funcion.asientos
        ?? []
      )
    }, [funcion])

  const filas =
    useMemo(() => {
      const agrupadas = {}

      asientos.forEach(
        (funcionAsiento) => {
          const asiento =
            funcionAsiento.asiento

          if (!asiento) {
            return
          }

          const fila =
            asiento.fila

          if (!agrupadas[fila]) {
            agrupadas[fila] = []
          }

          agrupadas[fila].push(
            funcionAsiento
          )
        }
      )

      Object.values(
        agrupadas
      ).forEach((fila) => {
        fila.sort((a, b) => {
          const numeroA =
            Number(a.asiento?.numero)

          const numeroB =
            Number(b.asiento?.numero)

          if (
            !Number.isNaN(numeroA)
            && !Number.isNaN(numeroB)
          ) {
            return numeroA - numeroB
          }

          return String(
            a.asiento?.numero
          ).localeCompare(
            String(
              b.asiento?.numero
            ),
            undefined,
            {
              numeric: true,
            }
          )
        })
      })

      return Object.entries(
        agrupadas
      ).sort(
        ([filaA], [filaB]) =>
          filaA.localeCompare(
            filaB
          )
      )
    }, [asientos])

  const estaSeleccionado = (
    idFuncionAsiento
  ) =>
    seleccionados.includes(
      idFuncionAsiento
    )

  const asientoDisponible = (
    funcionAsiento
  ) =>
    funcionAsiento.estado
    === 'DISPONIBLE'

  const alternarAsiento = (
    funcionAsiento
  ) => {
    if (
      !asientoDisponible(
        funcionAsiento
      )
    ) {
      return
    }

    setError('')

    setSeleccionados(
      (actuales) => {
        if (
          actuales.includes(
            funcionAsiento.id
          )
        ) {
          return actuales.filter(
            (idSeleccionado) =>
              idSeleccionado
              !== funcionAsiento.id
          )
        }

        if (
          actuales.length >= 5
        ) {
          setError(
            'Solo puedes seleccionar hasta cinco asientos por operación.'
          )

          return actuales
        }

        return [
          ...actuales,
          funcionAsiento.id,
        ]
      }
    )
  }

  const asientosSeleccionados =
    useMemo(() => {
      return seleccionados
        .map(
          (idSeleccionado) =>
            asientos.find(
              (item) =>
                item.id
                === idSeleccionado
            )
        )
        .filter(Boolean)
    }, [
      seleccionados,
      asientos,
    ])

  const total =
    useMemo(() => {
      return asientosSeleccionados.reduce(
        (
          acumulado,
          asientoSeleccionado
        ) => {
          const precio =
            Number(
              asientoSeleccionado
                ?.precio
              ?? funcion?.precio_base
              ?? 0
            )

          return acumulado + precio
        },
        0
      )
    }, [
      asientosSeleccionados,
      funcion,
    ])

  const obtenerMensajeError = (
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

  const obtenerNombresAsientos =
    () =>
      asientosSeleccionados
        .map(
          (item) =>
            `${item.asiento?.fila}${item.asiento?.numero}`
        )
        .join(', ')

  const abrirConfirmacionReserva =
    () => {
      if (!autenticado) {
        navigate('/login')
        return
      }

      if (
        seleccionados.length === 0
      ) {
        setError(
          'Selecciona al menos un asiento para continuar.'
        )

        return
      }

      setConfirmacion(
        'RESERVA'
      )
    }

  const abrirConfirmacionCompra =
    () => {
      if (!autenticado) {
        navigate('/login')
        return
      }

      if (
        seleccionados.length === 0
      ) {
        setError(
          'Selecciona al menos un asiento para continuar.'
        )

        return
      }

      setConfirmacion(
        'COMPRA'
      )
    }

  const cerrarConfirmacion =
    () => {
      if (
        creandoReserva
        || creandoCompra
      ) {
        return
      }

      setConfirmacion(null)
    }

  const continuarReserva =
    async () => {
      setError('')
      setCreandoReserva(true)

      try {
        const response =
          await api.post(
            '/reservas',
            {
              funcion_id:
                Number(id),

              funcion_asiento_ids:
                seleccionados,
            }
          )

        const data =
          response.data.data
          ?? response.data

        setConfirmacion(null)

        navigate(
          `/reservas/${data.id}`
        )
      } catch (err) {
        setConfirmacion(null)

        setError(
          obtenerMensajeError(
            err,
            'No fue posible crear la reserva.'
          )
        )
      } finally {
        setCreandoReserva(false)
      }
    }

  const comprarAhora =
    async () => {
      setError('')
      setCreandoCompra(true)

      try {
        const response =
          await api.post(
            '/ventas/directa',
            {
              funcion_id:
                Number(id),

              funcion_asiento_ids:
                seleccionados,
            }
          )

        const data =
          response.data.data
          ?? response.data

        setConfirmacion(null)

        navigate(
          `/compras/${data.id}/pago`
        )
      } catch (err) {
        setConfirmacion(null)

        setError(
          obtenerMensajeError(
            err,
            'No fue posible iniciar la compra.'
          )
        )
      } finally {
        setCreandoCompra(false)
      }
    }

  const obtenerClaseAsiento = (
    funcionAsiento
  ) => {
    if (
      estaSeleccionado(
        funcionAsiento.id
      )
    ) {
      return (
        'asiento asiento-seleccionado'
      )
    }

    switch (
      funcionAsiento.estado
    ) {
      case 'DISPONIBLE':
        return (
          'asiento asiento-disponible'
        )

      case 'RESERVADO':
        return (
          'asiento asiento-reservado'
        )

      case 'VENDIDO':
      case 'COMPRADO':
        return (
          'asiento asiento-vendido'
        )

      case 'BLOQUEADO':
        return (
          'asiento asiento-bloqueado'
        )

      default:
        return (
          'asiento asiento-no-disponible'
        )
    }
  }

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

        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    ).format(
      new Date(fecha)
    )
  }

  const formatearHora = (
    fecha
  ) => {
    if (!fecha) {
      return '--:--'
    }

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        timeZone:
          'America/Guatemala',

        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    ).format(
      new Date(fecha)
    )
  }

  const cerrarSesion =
    async () => {
      await logout()
      navigate('/')
    }

  if (cargando) {
    return (
      <main className="funcion-cargando">
        <div className="cartelera-spinner" />

        <p>
          Preparando sala...
        </p>
      </main>
    )
  }

  if (
    error
    && !funcion
  ) {
    return (
      <main className="funcion-error-pagina">
        <div className="funcion-error-card">
          <span className="funcion-error-icono">
            !
          </span>

          <h1>
            No pudimos cargar la función
          </h1>

          <p>
            {error}
          </p>

          <Link
            to="/"
            className="funcion-boton-volver"
          >
            Volver a cartelera
          </Link>
        </div>
      </main>
    )
  }

  if (!funcion) {
    return null
  }

  const procesando =
    creandoReserva
    || creandoCompra

  const nombresAsientos =
    obtenerNombresAsientos()

  return (
    <main className="funcion-pagina">
      <header className="funcion-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="funcion-logo-contenedor">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="funcion-logo-imagen"
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

        <nav className="funcion-nav">
          <Link
            to="/"
            className="funcion-nav-volver"
          >
            ← Cartelera
          </Link>

          {autenticado ? (
            <>
              <div className="funcion-nav-usuario">
                <span>
                  Bienvenido
                </span>

                <strong>
                  {usuario?.nombres}
                </strong>
              </div>

              <button
                type="button"
                onClick={
                  cerrarSesion
                }
                className="funcion-nav-sesion"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="funcion-nav-login"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </header>

      <section className="funcion-encabezado funcion-encabezado-final">
        {funcion.pelicula
          ?.imagen_url && (
          <div
            className="funcion-encabezado-fondo"
            aria-hidden="true"
          >
            <img
              src={
                funcion.pelicula
                  .imagen_url
              }
              alt=""
            />

            <div className="funcion-encabezado-fondo-overlay" />
          </div>
        )}

        <div className="funcion-pelicula-info">
          <span className="funcion-etiqueta">
            SELECCIÓN DE ASIENTOS
          </span>

          <h1>
            {funcion.pelicula?.titulo
              ?? 'Película'}
          </h1>

          {funcion.pelicula
            ?.sinopsis && (
            <p className="funcion-sinopsis">
              {
                funcion.pelicula
                  .sinopsis
              }
            </p>
          )}

          <div className="funcion-meta">
            <span>
              <strong>
                {funcion.sala?.nombre
                  ?? 'Sala'}
              </strong>
            </span>

            <span>
              <strong>
                {funcion.formato?.nombre
                  ?? 'Formato'}
              </strong>
            </span>

            <span>
              <strong>
                {
                  formatearHora(
                    funcion.inicia_en
                  )
                }
              </strong>
            </span>

            <span>
              <strong>
                Q
                {Number(
                  funcion.precio_base
                ).toFixed(2)}
              </strong>
            </span>
          </div>
        </div>

        <aside className="funcion-fecha-card">
          <span>
            FUNCIÓN
          </span>

          <strong>
            {
              formatearFecha(
                funcion.inicia_en
              )
            }
          </strong>

          <div>
            <span>
              Inicio

              <strong>
                {
                  formatearHora(
                    funcion.inicia_en
                  )
                }
              </strong>
            </span>

            <span>
              Finaliza

              <strong>
                {
                  formatearHora(
                    funcion.finaliza_en
                  )
                }
              </strong>
            </span>
          </div>
        </aside>
      </section>

      <section className="funcion-contenido">
        <div className="funcion-sala-panel">
          <div className="funcion-sala-cabecera">
            <div>
              <span className="funcion-etiqueta">
                {
                  funcion.sala?.nombre
                  ?? 'SALA'
                }
              </span>

              <h2>
                Selecciona tus asientos
              </h2>

              <p>
                Puedes seleccionar hasta
                cinco asientos por operación.
              </p>
            </div>

            <div className="funcion-contador-asientos">
              <strong>
                {seleccionados.length}
              </strong>

              <span>
                de 5 seleccionados
              </span>
            </div>
          </div>

          <div className="leyenda-asientos">
            <span>
              <i className="leyenda-color leyenda-disponible" />
              Disponible
            </span>

            <span>
              <i className="leyenda-color leyenda-seleccionado" />
              Seleccionado
            </span>

            <span>
              <i className="leyenda-color leyenda-reservado" />
              Reservado
            </span>

            <span>
              <i className="leyenda-color leyenda-vendido" />
              Vendido
            </span>

            <span
              title="Asiento retenido temporalmente mientras otro usuario completa su compra."
            >
              <i className="leyenda-color leyenda-bloqueado" />
              En proceso de compra
            </span>
          </div>

          <div className="pantalla-contenedor">
            <div className="pantalla-luz" />

            <div className="pantalla-cine">
              PANTALLA
            </div>

            <span>
              Todos los asientos miran
              hacia la pantalla
            </span>
          </div>

          <div className="mapa-asientos-contenedor">
            <div className="mapa-asientos">
              {filas.map(
                ([
                  fila,
                  asientosFila,
                ]) => (
                  <div
                    className="fila-asientos"
                    key={fila}
                  >
                    <span className="nombre-fila">
                      {fila}
                    </span>

                    <div className="asientos-fila">
                      {asientosFila.map(
                        (
                          funcionAsiento
                        ) => (
                          <button
                            key={
                              funcionAsiento.id
                            }
                            type="button"
                            className={
                              obtenerClaseAsiento(
                                funcionAsiento
                              )
                            }
                            disabled={
                              !asientoDisponible(
                                funcionAsiento
                              )
                              || procesando
                            }
                            onClick={() =>
                              alternarAsiento(
                                funcionAsiento
                              )
                            }
                            title={
                              `Asiento ${
                                funcionAsiento
                                  .asiento
                                  ?.fila
                              }${
                                funcionAsiento
                                  .asiento
                                  ?.numero
                              }`
                            }
                          >
                            {
                              funcionAsiento
                                .asiento
                                ?.numero
                            }
                          </button>
                        )
                      )}
                    </div>

                    <span className="nombre-fila">
                      {fila}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <aside className="resumen-seleccion">
          <div className="resumen-cabecera">
            <span className="funcion-etiqueta">
              TU SELECCIÓN
            </span>

            <h2>
              Resumen
            </h2>
          </div>

          <div className="resumen-funcion-datos">
            <div>
              <span>
                Película
              </span>

              <strong>
                {funcion.pelicula?.titulo
                  ?? 'Película'}
              </strong>
            </div>

            <div>
              <span>
                Sala
              </span>

              <strong>
                {funcion.sala?.nombre
                  ?? 'No disponible'}
              </strong>
            </div>

            <div>
              <span>
                Formato
              </span>

              <strong>
                {funcion.formato?.nombre
                  ?? 'No disponible'}
              </strong>
            </div>

            <div>
              <span>
                Hora
              </span>

              <strong>
                {
                  formatearHora(
                    funcion.inicia_en
                  )
                }
              </strong>
            </div>
          </div>

          <div className="resumen-asientos">
            <div className="resumen-linea">
              <span>
                Asientos
              </span>

              <strong>
                {seleccionados.length}
              </strong>
            </div>

            {asientosSeleccionados.length
              > 0 ? (
              <div className="resumen-asientos-lista">
                {asientosSeleccionados.map(
                  (item) => (
                    <span
                      key={item.id}
                    >
                      {
                        item.asiento?.fila
                      }
                      {
                        item.asiento?.numero
                      }
                    </span>
                  )
                )}
              </div>
            ) : (
              <p className="resumen-sin-asientos">
                Aún no has seleccionado
                ningún asiento.
              </p>
            )}
          </div>

          <div className="resumen-total">
            <span>
              Total
            </span>

            <strong>
              Q{total.toFixed(2)}
            </strong>
          </div>

          {error && (
            <div className="funcion-mensaje-error">
              {error}
            </div>
          )}

          {!autenticado && (
            <div className="funcion-aviso-login">
              <strong>
                Inicia sesión para continuar
              </strong>

              <p>
                Puedes seleccionar tus
                asientos antes de ingresar.
              </p>
            </div>
          )}

          <div className="acciones-compra">
            <button
              type="button"
              className="boton-reservar"
              onClick={
                abrirConfirmacionReserva
              }
              disabled={
                seleccionados.length
                === 0
                || procesando
              }
            >
              Reservar asientos
            </button>

            <button
              type="button"
              className="boton-comprar"
              onClick={
                abrirConfirmacionCompra
              }
              disabled={
                seleccionados.length
                === 0
                || procesando
              }
            >
              Comprar ahora
            </button>
          </div>

          <small className="resumen-nota">
            Al continuar, los asientos
            seleccionados serán retenidos
            temporalmente durante el proceso.
          </small>
        </aside>
      </section>

      <footer className="cartelera-footer">
        <div className="cartelera-footer-marca">
          <div className="funcion-logo-contenedor funcion-logo-footer">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="funcion-logo-imagen"
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

      {confirmacion && (
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
            className="confirmacion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmacion-titulo"
          >
            <div
              className={`confirmacion-icono ${
                confirmacion === 'COMPRA'
                  ? 'confirmacion-icono-compra'
                  : 'confirmacion-icono-reserva'
              }`}
            >
              {confirmacion === 'COMPRA'
                ? '✓'
                : 'R'}
            </div>

            <span className="confirmacion-etiqueta">
              {confirmacion === 'COMPRA'
                ? 'CONFIRMAR COMPRA'
                : 'CONFIRMAR RESERVA'}
            </span>

            <h2 id="confirmacion-titulo">
              {confirmacion === 'COMPRA'
                ? '¿Listo para continuar con tu compra?'
                : '¿Deseas reservar estos asientos?'}
            </h2>

            <p className="confirmacion-descripcion">
              {confirmacion === 'COMPRA'
                ? 'Revisa los datos antes de continuar al proceso de pago.'
                : 'Revisa los datos antes de confirmar tu reserva.'}
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Película
                </span>

                <strong>
                  {funcion.pelicula?.titulo}
                </strong>
              </div>

              <div>
                <span>
                  Función
                </span>

                <strong>
                  {formatearHora(
                    funcion.inicia_en
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Asientos
                </span>

                <strong>
                  {nombresAsientos}
                </strong>
              </div>

              <div>
                <span>
                  Total
                </span>

                <strong className="confirmacion-total">
                  Q{total.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="confirmacion-aviso">
              {confirmacion
              === 'COMPRA' ? (
                <>
                  <strong>
                    Los asientos serán retenidos
                  </strong>

                  <p>
                    Tendrás un tiempo limitado
                    para completar el pago.
                    Mientras tanto, otros
                    usuarios no podrán
                    seleccionar estos asientos.
                  </p>
                </>
              ) : (
                <>
                  <strong>
                    La reserva es temporal
                  </strong>

                  <p>
                    Los asientos quedarán
                    reservados durante el
                    período establecido por
                    Atlantic Cinema.
                  </p>
                </>
              )}
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
                  confirmacion
                  === 'COMPRA'
                    ? comprarAhora
                    : continuarReserva
                }
                disabled={
                  procesando
                }
              >
                {confirmacion
                === 'COMPRA'
                  ? (
                    creandoCompra
                      ? 'Iniciando compra...'
                      : 'Confirmar compra'
                  )
                  : (
                    creandoReserva
                      ? 'Creando reserva...'
                      : 'Confirmar reserva'
                  )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default FuncionDetalle