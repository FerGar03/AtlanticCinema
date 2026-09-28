import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import api from '../services/api'
import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

const ELEMENTOS_POR_PAGINA = 8

function MisOperaciones() {
  const [
    pestana,
    setPestana,
  ] = useState('RESERVAS')

  const [
    reservas,
    setReservas,
  ] = useState([])

  const [
    ventas,
    setVentas,
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
    busqueda,
    setBusqueda,
  ] = useState('')

  const [
    estado,
    setEstado,
  ] = useState('TODOS')

  const [
    periodo,
    setPeriodo,
  ] = useState('TODAS')

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1)

  useEffect(() => {
    const cargarOperaciones =
      async () => {
        try {
          setCargando(true)
          setError('')

          const [
            respuestaReservas,
            respuestaVentas,
          ] = await Promise.all([
            api.get('/reservas'),
            api.get('/ventas'),
          ])

          const normalizarListado = (
            respuesta
          ) => {
            const contenido =
              respuesta?.data?.data
              ?? respuesta?.data
              ?? []

            if (Array.isArray(contenido)) {
              return contenido
            }

            if (
              Array.isArray(
                contenido?.data
              )
            ) {
              return contenido.data
            }

            return []
          }

          setReservas(
            normalizarListado(
              respuestaReservas
            )
          )

          setVentas(
            normalizarListado(
              respuestaVentas
            )
          )
        } catch (err) {
          setError(
            err.response?.data?.message
            || 'No fue posible cargar tus operaciones.'
          )
        } finally {
          setCargando(false)
        }
      }

    cargarOperaciones()
  }, [])

  useEffect(() => {
    setPaginaActual(1)
  }, [
    pestana,
    busqueda,
    estado,
    periodo,
  ])

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
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    ).format(
      new Date(fecha)
    )
  }

  const formatearMonto = (
    monto
  ) => {
    return `Q${Number(
      monto ?? 0
    ).toFixed(2)}`
  }

  const obtenerTextoReserva = (
    estadoReserva
  ) => {
    switch (estadoReserva) {
      case 'PENDIENTE':
        return 'Pendiente'

      case 'CONVERTIDA':
        return 'Confirmada'

      case 'VENCIDA':
        return 'Vencida'

      case 'CANCELADA':
        return 'Cancelada'

      default:
        return estadoReserva
          ?? 'Sin estado'
    }
  }

  const obtenerTextoVenta = (
    estadoVenta
  ) => {
    switch (estadoVenta) {
      case 'PENDIENTE':
        return 'Pendiente'

      case 'PAGADA':
        return 'Pagada'

      case 'CANCELADA':
        return 'Cancelada'

      case 'FALLIDA':
        return 'Fallida'

      default:
        return estadoVenta
          ?? 'Sin estado'
    }
  }

  const obtenerAsientosReserva = (
    reserva
  ) => {
    const detalles =
      reserva?.detalles
      ?? []

    return detalles
      .map((detalle) => {
        const asiento =
          detalle
            ?.funcion_asiento
            ?.asiento
          ?? detalle
            ?.funcionAsiento
            ?.asiento

        if (!asiento) {
          return null
        }

        return `${asiento.fila}${asiento.numero}`
      })
      .filter(Boolean)
  }

  const obtenerAsientosVenta = (
    venta
  ) => {
    const entradas =
      venta?.entradas
      ?? []

    return entradas
      .map((entrada) => {
        const asiento =
          entrada
            ?.funcion_asiento
            ?.asiento
          ?? entrada
            ?.funcionAsiento
            ?.asiento

        if (!asiento) {
          return null
        }

        return `${asiento.fila}${asiento.numero}`
      })
      .filter(Boolean)
  }

  const fechaDentroPeriodo = (
    fecha
  ) => {
    if (
      periodo === 'TODAS'
      || !fecha
    ) {
      return true
    }

    const fechaOperacion =
      new Date(fecha)

    const ahora =
      new Date()

    if (
      Number.isNaN(
        fechaOperacion.getTime()
      )
    ) {
      return false
    }

    if (periodo === '7_DIAS') {
      const limite =
        new Date()

      limite.setDate(
        ahora.getDate() - 7
      )

      return (
        fechaOperacion >= limite
      )
    }

    if (periodo === '30_DIAS') {
      const limite =
        new Date()

      limite.setDate(
        ahora.getDate() - 30
      )

      return (
        fechaOperacion >= limite
      )
    }

    if (periodo === 'ESTE_ANIO') {
      return (
        fechaOperacion.getFullYear()
        === ahora.getFullYear()
      )
    }

    return true
  }

  const reservasFiltradas =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLowerCase()

      return [...reservas]
        .filter((reserva) => {
          if (
            estado !== 'TODOS'
            && reserva.estado
              !== estado
          ) {
            return false
          }

          if (
            !fechaDentroPeriodo(
              reserva.reservada_en
              ?? reserva.created_at
            )
          ) {
            return false
          }

          if (!termino) {
            return true
          }

          const codigo =
            String(
              reserva.codigo
              ?? ''
            ).toLowerCase()

          const pelicula =
            String(
              reserva.funcion
                ?.pelicula
                ?.titulo
              ?? ''
            ).toLowerCase()

          return (
            codigo.includes(
              termino
            )
            || pelicula.includes(
              termino
            )
          )
        })
        .sort(
          (a, b) =>
            new Date(
              b.reservada_en
              ?? b.created_at
              ?? 0
            )
            - new Date(
              a.reservada_en
              ?? a.created_at
              ?? 0
            )
        )
    }, [
      reservas,
      busqueda,
      estado,
      periodo,
    ])

  const ventasFiltradas =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLowerCase()

      return [...ventas]
        .filter((venta) => {
          if (
            estado !== 'TODOS'
            && venta.estado
              !== estado
          ) {
            return false
          }

          if (
            !fechaDentroPeriodo(
              venta.pagada_en
              ?? venta.created_at
            )
          ) {
            return false
          }

          if (!termino) {
            return true
          }

          const codigo =
            String(
              venta.numero_venta
              ?? ''
            ).toLowerCase()

          const pelicula =
            String(
              venta.funcion
                ?.pelicula
                ?.titulo
              ?? ''
            ).toLowerCase()

          return (
            codigo.includes(
              termino
            )
            || pelicula.includes(
              termino
            )
          )
        })
        .sort(
          (a, b) =>
            new Date(
              b.pagada_en
              ?? b.created_at
              ?? 0
            )
            - new Date(
              a.pagada_en
              ?? a.created_at
              ?? 0
            )
        )
    }, [
      ventas,
      busqueda,
      estado,
      periodo,
    ])

  const listadoActual =
    pestana === 'RESERVAS'
      ? reservasFiltradas
      : ventasFiltradas

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        listadoActual.length
        / ELEMENTOS_POR_PAGINA
      )
    )

  const inicio =
    (
      paginaActual - 1
    )
    * ELEMENTOS_POR_PAGINA

  const fin =
    inicio
    + ELEMENTOS_POR_PAGINA

  const elementosPagina =
    listadoActual.slice(
      inicio,
      fin
    )

  const primerElemento =
    listadoActual.length === 0
      ? 0
      : inicio + 1

  const ultimoElemento =
    Math.min(
      fin,
      listadoActual.length
    )

  const cambiarPestana = (
    nuevaPestana
  ) => {
    setPestana(
      nuevaPestana
    )

    setEstado('TODOS')
    setPeriodo('TODAS')
    setBusqueda('')
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setEstado('TODOS')
    setPeriodo('TODAS')
    setPaginaActual(1)
  }

  const estadosDisponibles =
    pestana === 'RESERVAS'
      ? [
          {
            valor: 'TODOS',
            texto: 'Todos',
          },
          {
            valor: 'PENDIENTE',
            texto: 'Pendiente',
          },
          {
            valor: 'CONVERTIDA',
            texto: 'Confirmada',
          },
          {
            valor: 'VENCIDA',
            texto: 'Vencida',
          },
          {
            valor: 'CANCELADA',
            texto: 'Cancelada',
          },
        ]
      : [
          {
            valor: 'TODOS',
            texto: 'Todos',
          },
          {
            valor: 'PENDIENTE',
            texto: 'Pendiente',
          },
          {
            valor: 'PAGADA',
            texto: 'Pagada',
          },
          {
            valor: 'CANCELADA',
            texto: 'Cancelada',
          },
          {
            valor: 'FALLIDA',
            texto: 'Fallida',
          },
        ]

  if (cargando) {
    return (
      <main className="operaciones-cargando">
        <div className="cartelera-spinner" />

        <p>
          Cargando tus operaciones...
        </p>
      </main>
    )
  }

  return (
    <main className="operaciones-pagina">
      <header className="operaciones-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="operaciones-logo">
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

        <div className="operaciones-nav">
          <Link to="/perfil">
            Mi perfil
          </Link>

          <Link to="/">
            ← Cartelera
          </Link>
        </div>
      </header>

      <section className="operaciones-contenido">
        <header className="operaciones-cabecera">
          <span>
            MI CUENTA
          </span>

          <h1>
            Mis operaciones
          </h1>

          <p>
            Consulta tus reservas y compras
            realizadas en Atlantic Cinema.
          </p>
        </header>

        <div className="operaciones-resumen">
          <div>
            <span>
              Reservas
            </span>

            <strong>
              {reservas.length}
            </strong>
          </div>

          <div>
            <span>
              Compras
            </span>

            <strong>
              {ventas.length}
            </strong>
          </div>

          <div>
            <span>
              Compras pagadas
            </span>

            <strong>
              {
                ventas.filter(
                  (venta) =>
                    venta.estado
                    === 'PAGADA'
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="operaciones-tabs">
          <button
            type="button"
            className={
              pestana === 'RESERVAS'
                ? 'activo'
                : ''
            }
            onClick={() =>
              cambiarPestana(
                'RESERVAS'
              )
            }
          >
            Mis reservas

            <span>
              {reservas.length}
            </span>
          </button>

          <button
            type="button"
            className={
              pestana === 'COMPRAS'
                ? 'activo'
                : ''
            }
            onClick={() =>
              cambiarPestana(
                'COMPRAS'
              )
            }
          >
            Mis compras

            <span>
              {ventas.length}
            </span>
          </button>
        </div>

        {error && (
          <div className="operaciones-error">
            {error}
          </div>
        )}

        <section className="operaciones-filtros">
          <div className="operaciones-filtros-cabecera">
            <div>
              <span>
                FILTROS
              </span>

              <strong>
                Encuentra una operación
              </strong>
            </div>

            <button
              type="button"
              onClick={
                limpiarFiltros
              }
            >
              Limpiar filtros
            </button>
          </div>

          <div className="operaciones-filtros-grid">
            <label className="operaciones-filtro-busqueda">
              <span>
                Buscar
              </span>

              <input
                type="search"
                value={
                  busqueda
                }
                onChange={(
                  event
                ) =>
                  setBusqueda(
                    event.target
                      .value
                  )
                }
                placeholder={
                  pestana
                  === 'RESERVAS'
                    ? 'Código o película'
                    : 'Número de venta o película'
                }
              />
            </label>

            <label>
              <span>
                Estado
              </span>

              <select
                value={estado}
                onChange={(
                  event
                ) =>
                  setEstado(
                    event.target
                      .value
                  )
                }
              >
                {estadosDisponibles.map(
                  (opcion) => (
                    <option
                      key={
                        opcion.valor
                      }
                      value={
                        opcion.valor
                      }
                    >
                      {
                        opcion.texto
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>
                Fecha
              </span>

              <select
                value={periodo}
                onChange={(
                  event
                ) =>
                  setPeriodo(
                    event.target
                      .value
                  )
                }
              >
                <option value="TODAS">
                  Todas
                </option>

                <option value="7_DIAS">
                  Últimos 7 días
                </option>

                <option value="30_DIAS">
                  Últimos 30 días
                </option>

                <option value="ESTE_ANIO">
                  Este año
                </option>
              </select>
            </label>
          </div>
        </section>

        <div className="operaciones-resultados-info">
          <span>
            Mostrando{' '}
            <strong>
              {primerElemento}
              –
              {ultimoElemento}
            </strong>{' '}
            de{' '}
            <strong>
              {
                listadoActual.length
              }
            </strong>
          </span>

          <span>
            8 por página
          </span>
        </div>

        {pestana === 'RESERVAS' && (
          <section className="operaciones-listado">
            <div className="operaciones-seccion-cabecera">
              <div>
                <h2>
                  Mis reservas
                </h2>

                <p>
                  Consulta códigos,
                  vencimientos y estados
                  de tus reservas.
                </p>
              </div>
            </div>

            {elementosPagina.length
              === 0 ? (
              <div className="operaciones-vacio">
                <strong>
                  No encontramos reservas
                </strong>

                <p>
                  Prueba modificando los
                  filtros o consulta la
                  cartelera.
                </p>

                <button
                  type="button"
                  onClick={
                    limpiarFiltros
                  }
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="operaciones-grid">
                {elementosPagina.map(
                  (reserva) => {
                    const asientos =
                      obtenerAsientosReserva(
                        reserva
                      )

                    return (
                      <article
                        className="operacion-card"
                        key={
                          reserva.id
                        }
                      >
                        <div className="operacion-card-cabecera">
                          <div>
                            <span className="operacion-tipo">
                              RESERVA
                            </span>

                            <strong className="operacion-codigo">
                              {
                                reserva.codigo
                                ?? `Reserva #${reserva.id}`
                              }
                            </strong>
                          </div>

                          <span
                            className={`operacion-estado operacion-estado-${String(
                              reserva.estado
                              ?? ''
                            ).toLowerCase()}`}
                          >
                            {
                              obtenerTextoReserva(
                                reserva.estado
                              )
                            }
                          </span>
                        </div>

                        <h3>
                          {
                            reserva.funcion
                              ?.pelicula
                              ?.titulo
                            ?? 'Película'
                          }
                        </h3>

                        <div className="operacion-datos">
                          <div>
                            <span>
                              Función
                            </span>

                            <strong>
                              {
                                formatearFecha(
                                  reserva.funcion
                                    ?.inicia_en
                                )
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
                                ?? 'No disponible'
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Asientos
                            </span>

                            <strong>
                              {
                                asientos.length
                                  > 0
                                  ? asientos.join(
                                      ', '
                                    )
                                  : 'No disponible'
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Total
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

                        {reserva.estado
                          === 'PENDIENTE'
                          && (
                          <div className="operacion-vencimiento">
                            <span>
                              Vence
                            </span>

                            <strong>
                              {
                                formatearFecha(
                                  reserva.expira_en
                                )
                              }
                            </strong>
                          </div>
                        )}

                        <Link
                          to={
                            `/reservas/${reserva.id}`
                          }
                          className="operacion-boton"
                        >
                          Ver reserva
                          <span>→</span>
                        </Link>
                      </article>
                    )
                  }
                )}
              </div>
            )}
          </section>
        )}

        {pestana === 'COMPRAS' && (
          <section className="operaciones-listado">
            <div className="operaciones-seccion-cabecera">
              <div>
                <h2>
                  Mis compras
                </h2>

                <p>
                  Consulta el historial de
                  compras realizadas con
                  tu cuenta.
                </p>
              </div>
            </div>

            {elementosPagina.length
              === 0 ? (
              <div className="operaciones-vacio">
                <strong>
                  No encontramos compras
                </strong>

                <p>
                  Prueba modificando los
                  filtros o consulta la
                  cartelera.
                </p>

                <button
                  type="button"
                  onClick={
                    limpiarFiltros
                  }
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="operaciones-grid">
                {elementosPagina.map(
                  (venta) => {
                    const asientos =
                      obtenerAsientosVenta(
                        venta
                      )

                    return (
                      <article
                        className="operacion-card"
                        key={
                          venta.id
                        }
                      >
                        <div className="operacion-card-cabecera">
                          <div>
                            <span className="operacion-tipo">
                              COMPRA
                            </span>

                            <strong className="operacion-codigo">
                              {
                                venta.numero_venta
                                ?? `Venta #${venta.id}`
                              }
                            </strong>
                          </div>

                          <span
                            className={`operacion-estado operacion-estado-${String(
                              venta.estado
                              ?? ''
                            ).toLowerCase()}`}
                          >
                            {
                              obtenerTextoVenta(
                                venta.estado
                              )
                            }
                          </span>
                        </div>

                        <h3>
                          {
                            venta.funcion
                              ?.pelicula
                              ?.titulo
                            ?? 'Película'
                          }
                        </h3>

                        <div className="operacion-datos">
                          <div>
                            <span>
                              Fecha
                            </span>

                            <strong>
                              {
                                formatearFecha(
                                  venta.pagada_en
                                  ?? venta.created_at
                                )
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Sala
                            </span>

                            <strong>
                              {
                                venta.funcion
                                  ?.sala
                                  ?.nombre
                                ?? 'No disponible'
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Asientos
                            </span>

                            <strong>
                              {
                                asientos.length
                                  > 0
                                  ? asientos.join(
                                      ', '
                                    )
                                  : `${venta.cantidad_entradas ?? venta.entradas?.length ?? 0} entrada(s)`
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Total
                            </span>

                            <strong>
                              {
                                formatearMonto(
                                  venta.total
                                )
                              }
                            </strong>
                          </div>
                        </div>

                        {venta.origen && (
                          <div className="operacion-origen">
                            <span>
                              Origen
                            </span>

                            <strong>
                              {
                                venta.origen
                                  .replaceAll(
                                    '_',
                                    ' '
                                  )
                              }
                            </strong>
                          </div>
                        )}

                        <Link
                          to={
                            `/compras/${venta.id}/pago`
                          }
                          className="operacion-boton"
                        >
                          {
                            venta.estado
                            === 'PENDIENTE'
                              ? 'Continuar compra'
                              : 'Ver compra'
                          }

                          <span>→</span>
                        </Link>
                      </article>
                    )
                  }
                )}
              </div>
            )}
          </section>
        )}

        {listadoActual.length > 0 && (
          <nav
            className="operaciones-paginacion"
            aria-label="Paginación de operaciones"
          >
            <button
              type="button"
              disabled={
                paginaActual === 1
              }
              onClick={() =>
                setPaginaActual(
                  (actual) =>
                    Math.max(
                      1,
                      actual - 1
                    )
                )
              }
            >
              ← Anterior
            </button>

            <span>
              Página{' '}
              <strong>
                {paginaActual}
              </strong>{' '}
              de{' '}
              <strong>
                {totalPaginas}
              </strong>
            </span>

            <button
              type="button"
              disabled={
                paginaActual
                >= totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  (actual) =>
                    Math.min(
                      totalPaginas,
                      actual + 1
                    )
                )
              }
            >
              Siguiente →
            </button>
          </nav>
        )}
      </section>

      <footer className="cartelera-footer">
        <div className="cartelera-footer-marca">
          <div className="operaciones-logo operaciones-logo-footer">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
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

export default MisOperaciones