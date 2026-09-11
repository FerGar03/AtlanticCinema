import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function AdminReportes() {
  const { usuario, logout } = useAuth()

  const [resumen, setResumen] = useState(null)

  const [periodo, setPeriodo] = useState({
    desde: null,
    hasta: null,
  })

  const [ventasPorPelicula, setVentasPorPelicula] = useState([])
  const [reservasPorEstado, setReservasPorEstado] = useState({})
  const [pagosPorMetodo, setPagosPorMetodo] = useState([])
  const [ocupacionFunciones, setOcupacionFunciones] = useState([])

  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
  })

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarResumen = async (parametros = {}) => {
    try {
      setCargando(true)
      setError('')

      const respuesta = await api.get(
        '/reportes/resumen',
        {
          params: parametros,
        }
      )

      setResumen(respuesta.data.resumen)

      setPeriodo(
        respuesta.data.periodo || {
          desde: null,
          hasta: null,
        }
      )

      setVentasPorPelicula(
        respuesta.data.ventas_por_pelicula || []
      )

      setReservasPorEstado(
        respuesta.data.reservas_por_estado || {}
      )

      setPagosPorMetodo(
        respuesta.data.pagos_por_metodo || []
      )

      setOcupacionFunciones(
        respuesta.data.ocupacion_funciones || []
      )
    } catch (err) {
      console.error(err)

      const erroresValidacion = err.response?.data?.errors

      if (erroresValidacion) {
        const primerError = Object.values(
          erroresValidacion
        )[0]?.[0]

        setError(
          primerError
          || 'No fue posible aplicar los filtros.'
        )

        return
      }

      setError(
        err.response?.data?.message
        || 'No fue posible cargar los reportes.'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarResumen()
  }, [])

  const manejarCambioFiltro = (event) => {
    const {
      name,
      value,
    } = event.target

    setFiltros((anterior) => ({
      ...anterior,
      [name]: value,
    }))
  }

  const aplicarFiltros = async (event) => {
    event.preventDefault()

    const parametros = {}

    if (filtros.desde) {
      parametros.desde = filtros.desde
    }

    if (filtros.hasta) {
      parametros.hasta = filtros.hasta
    }

    await cargarResumen(parametros)
  }

  const limpiarFiltros = async () => {
    setFiltros({
      desde: '',
      hasta: '',
    })

    await cargarResumen()
  }

  const obtenerFechaLocal = (fecha) => {
    const year = fecha.getFullYear()

    const month = String(
      fecha.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
      fecha.getDate()
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const aplicarRangoRapido = async (tipo) => {
    const hoy = new Date()

    let desde
    let hasta

    if (tipo === 'hoy') {
      desde = new Date(hoy)
      hasta = new Date(hoy)
    }

    if (tipo === 'semana') {
      desde = new Date(hoy)

      const diaSemana = hoy.getDay()

      const diferenciaLunes =
        diaSemana === 0
          ? -6
          : 1 - diaSemana

      desde.setDate(
        hoy.getDate() + diferenciaLunes
      )

      hasta = new Date(hoy)
    }

    if (tipo === 'mes') {
      desde = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      )

      hasta = new Date(hoy)
    }

    const fechaDesde = obtenerFechaLocal(desde)
    const fechaHasta = obtenerFechaLocal(hasta)

    setFiltros({
      desde: fechaDesde,
      hasta: fechaHasta,
    })

    await cargarResumen({
      desde: fechaDesde,
      hasta: fechaHasta,
    })
  }

  const cerrarSesion = async () => {
    await logout()
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(Number(valor || 0))
  }

  const formatearPorcentaje = (valor) => {
    return `${Number(valor || 0).toFixed(2)}%`
  }

  const formatearFechaHora = (valor) => {
    if (!valor) {
      return '-'
    }

    return new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(valor))
  }

  const indicadores = resumen
    ? [
        {
          titulo: 'Ingresos',
          valor: formatearMoneda(resumen.ingresos),
          descripcion:
            'Ingresos correspondientes a ventas pagadas.',
        },
        {
          titulo: 'Ventas pagadas',
          valor: resumen.ventas_pagadas,
          descripcion:
            'Cantidad de ventas completadas.',
        },
        {
          titulo: 'Entradas vendidas',
          valor: resumen.entradas_vendidas,
          descripcion:
            'Entradas asociadas a ventas pagadas.',
        },
        {
          titulo: 'Reservas',
          valor: resumen.reservas,
          descripcion:
            'Total de reservas registradas.',
        },
        {
          titulo: 'Reservas convertidas',
          valor: resumen.reservas_convertidas,
          descripcion:
            'Reservas que finalizaron en una venta.',
        },
        {
          titulo: 'Conversión de reservas',
          valor: formatearPorcentaje(
            resumen.conversion_reservas
          ),
          descripcion:
            'Porcentaje de reservas convertidas en venta.',
        },
        {
          titulo: 'Ventas web',
          valor: resumen.ventas_compra_web,
          descripcion:
            'Ventas pagadas originadas por compra web.',
        },
        {
          titulo: 'Ventas desde reserva',
          valor: resumen.ventas_desde_reserva,
          descripcion:
            'Ventas pagadas provenientes de reservas.',
        },
        {
          titulo: 'Ticket promedio',
          valor: formatearMoneda(
            resumen.ticket_promedio
          ),
          descripcion:
            'Ingreso promedio por venta pagada.',
        },
        {
          titulo: 'Funciones',
          valor: resumen.funciones,
          descripcion:
            'Funciones dentro del período consultado.',
        },
      ]
    : []

  const estadosReserva = [
    {
      estado: 'PENDIENTE',
      etiqueta: 'Pendientes',
    },
    {
      estado: 'CONVERTIDA',
      etiqueta: 'Convertidas',
    },
    {
      estado: 'CANCELADA',
      etiqueta: 'Canceladas',
    },
    {
      estado: 'VENCIDA',
      etiqueta: 'Vencidas',
    },
  ]

  const datosReservasGrafica = estadosReserva.map(
    (registro) => ({
      nombre: registro.etiqueta,
      cantidad:
        reservasPorEstado[registro.estado] || 0,
    })
  )

  const existenReservas = datosReservasGrafica.some(
    (registro) => registro.cantidad > 0
  )

  const coloresReservas = [
    '#f5c451',
    '#35c98b',
    '#ef6b73',
    '#818cf8',
  ]

  const tooltipMoneda = (valor) => {
    return formatearMoneda(valor)
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-marca">
          <h2>Atlantic Cinema</h2>
          <p>Administración</p>
        </div>

        <nav className="admin-menu">
          <Link to="/admin">Inicio</Link>
          <Link to="/admin/peliculas">Películas</Link>
          <Link to="/admin/funciones">Funciones</Link>
          <Link to="/admin/salas">
            Salas y asientos
          </Link>
          <Link to="/admin/usuarios">Usuarios</Link>
          <Link to="/admin/reservas">Reservas</Link>
          <Link to="/admin/ventas">Ventas</Link>
          <Link to="/admin/pagos">Pagos</Link>
          <Link to="/admin/facturas">Facturas</Link>
          <Link to="/admin/tickets">Tickets</Link>
          <Link to="/admin/notificaciones">
            Notificaciones
          </Link>
          <Link to="/admin/reportes">Reportes</Link>
        </nav>

        <div className="admin-sidebar-pie">
          <Link to="/">Ver cartelera</Link>

          <button
            type="button"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-contenido">
        <header className="admin-encabezado">
          <div>
            <p className="admin-etiqueta">
              REPORTES ADMINISTRATIVOS
            </p>

            <h1>Resumen general</h1>

            <p>
              Consulta los principales indicadores de
              operación de Atlantic Cinema.
            </p>
          </div>

          <div className="admin-usuario">
            <strong>
              {usuario?.nombres} {usuario?.apellidos}
            </strong>

            <span>{usuario?.rol?.nombre}</span>
          </div>
        </header>

        <section className="admin-dashboard">
          <h2>Período del reporte</h2>

          <div className="reportes-filtros-rapidos">
            <button
              type="button"
              className="reportes-boton-secundario"
              onClick={() => aplicarRangoRapido('hoy')}
              disabled={cargando}
            >
              Hoy
            </button>

            <button
              type="button"
              className="reportes-boton-secundario"
              onClick={() => aplicarRangoRapido('semana')}
              disabled={cargando}
            >
              Esta semana
            </button>

            <button
              type="button"
              className="reportes-boton-secundario"
              onClick={() => aplicarRangoRapido('mes')}
              disabled={cargando}
            >
              Este mes
            </button>
          </div>

          <form
            onSubmit={aplicarFiltros}
            className="reportes-filtros"
          >
            <label className="reportes-campo">
              <span>Desde</span>

              <input
                type="date"
                name="desde"
                value={filtros.desde}
                onChange={manejarCambioFiltro}
              />
            </label>

            <label className="reportes-campo">
              <span>Hasta</span>

              <input
                type="date"
                name="hasta"
                value={filtros.hasta}
                onChange={manejarCambioFiltro}
              />
            </label>

            <button
              type="submit"
              className="reportes-boton-principal"
              disabled={cargando}
            >
              Aplicar filtros
            </button>

            <button
              type="button"
              className="reportes-boton-secundario"
              onClick={limpiarFiltros}
              disabled={cargando}
            >
              Limpiar
            </button>
          </form>

          <p>
            {periodo.desde || periodo.hasta
              ? (
                  <>
                    Período consultado:{' '}
                    <strong>
                      {periodo.desde || 'Inicio'}
                    </strong>
                    {' '}a{' '}
                    <strong>
                      {periodo.hasta || 'Actualidad'}
                    </strong>
                  </>
                )
              : (
                  <>
                    Período consultado:{' '}
                    <strong>
                      Historial completo
                    </strong>
                  </>
                )}
          </p>
        </section>

        {cargando && (
          <p>Cargando reportes...</p>
        )}

        {error && (
          <div className="admin-mensaje-error">
            {error}
          </div>
        )}

        {!cargando && !error && resumen && (
          <>
            <section className="admin-dashboard">
              <h2>Indicadores generales</h2>

              <div className="admin-modulos-grid">
                {indicadores.map((indicador) => (
                  <article
                    className="admin-modulo-card"
                    key={indicador.titulo}
                  >
                    <h3>{indicador.titulo}</h3>

                    <p
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        margin: '0.5rem 0',
                      }}
                    >
                      {indicador.valor}
                    </p>

                    <p>{indicador.descripcion}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-dashboard">
              <h2>Ingresos por película</h2>

              {ventasPorPelicula.length === 0 ? (
                <p>
                  No existen ventas pagadas para el
                  período seleccionado.
                </p>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '350px',
                  }}
                >
                  <ResponsiveContainer>
                    <BarChart
                      data={ventasPorPelicula}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="titulo"
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        height={80}
                      />

                      <YAxis />

                      <Tooltip
                        formatter={tooltipMoneda}
                      />

                      <Legend />

                      <Bar
                        dataKey="ingresos"
                        name="Ingresos"
                        fill="#22c7ce"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="admin-dashboard">
              <h2>Ventas e ingresos por película</h2>

              {ventasPorPelicula.length === 0 ? (
                <p>
                  No existen ventas pagadas para el
                  período seleccionado.
                </p>
              ) : (
                <div
                  style={{
                    overflowX: 'auto',
                  }}
                >
                  <table className="admin-tabla">
                    <thead>
                      <tr>
                        <th>Película</th>
                        <th>Ventas</th>
                        <th>Entradas</th>
                        <th>Ingresos</th>
                      </tr>
                    </thead>

                    <tbody>
                      {ventasPorPelicula.map((registro) => (
                        <tr key={registro.pelicula_id}>
                          <td>{registro.titulo}</td>
                          <td>{registro.ventas}</td>
                          <td>{registro.entradas}</td>
                          <td>
                            {formatearMoneda(
                              registro.ingresos
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="admin-dashboard">
              <h2>Reservas por estado</h2>

              {existenReservas ? (
                <div
                  style={{
                    width: '100%',
                    height: '350px',
                  }}
                >
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={datosReservasGrafica}
                        dataKey="cantidad"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label
                      >
                        {datosReservasGrafica.map(
                          (registro, index) => (
                            <Cell
                              key={registro.nombre}
                              fill={
                                coloresReservas[
                                  index
                                  % coloresReservas.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p>
                  No existen reservas para el período
                  seleccionado.
                </p>
              )}

              <div className="admin-modulos-grid">
                {estadosReserva.map((registro) => (
                  <article
                    className="admin-modulo-card"
                    key={registro.estado}
                  >
                    <h3>{registro.etiqueta}</h3>

                    <p
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        margin: '0.5rem 0',
                      }}
                    >
                      {reservasPorEstado[
                        registro.estado
                      ] || 0}
                    </p>

                    <p>
                      Reservas con estado{' '}
                      {registro.estado.toLowerCase()}.
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-dashboard">
              <h2>Pagos por método</h2>

              {pagosPorMetodo.length === 0 ? (
                <p>
                  No existen pagos aprobados para el
                  período seleccionado.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      width: '100%',
                      height: '350px',
                    }}
                  >
                    <ResponsiveContainer>
                      <BarChart
                        data={pagosPorMetodo}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 20,
                          bottom: 20,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis dataKey="nombre" />

                        <YAxis />

                        <Tooltip
                          formatter={tooltipMoneda}
                        />

                        <Legend />

                        <Bar
                          dataKey="monto"
                          name="Monto"
                          fill="#22c7ce"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div
                    style={{
                      overflowX: 'auto',
                    }}
                  >
                    <table className="admin-tabla">
                      <thead>
                        <tr>
                          <th>Método</th>
                          <th>Nombre</th>
                          <th>Cantidad</th>
                          <th>Monto</th>
                        </tr>
                      </thead>

                      <tbody>
                        {pagosPorMetodo.map((registro) => (
                          <tr key={registro.metodo}>
                            <td>{registro.metodo}</td>
                            <td>{registro.nombre}</td>
                            <td>{registro.cantidad}</td>
                            <td>
                              {formatearMoneda(
                                registro.monto
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <section className="admin-dashboard">
              <h2>Ocupación por función</h2>

              {ocupacionFunciones.length === 0 ? (
                <p>
                  No existen funciones para el período
                  seleccionado.
                </p>
              ) : (
                <div
                  style={{
                    overflowX: 'auto',
                  }}
                >
                  <table className="admin-tabla">
                    <thead>
                      <tr>
                        <th>Película</th>
                        <th>Sala</th>
                        <th>Fecha y hora</th>
                        <th>Vendidos</th>
                        <th>Total</th>
                        <th>Ocupación</th>
                      </tr>
                    </thead>

                    <tbody>
                      {ocupacionFunciones.map(
                        (registro) => (
                          <tr key={registro.funcion_id}>
                            <td>
                              {registro.pelicula}
                            </td>

                            <td>{registro.sala}</td>

                            <td>
                              {formatearFechaHora(
                                registro.inicia_en
                              )}
                            </td>

                            <td>
                              {
                                registro.asientos_vendidos
                              }
                            </td>

                            <td>
                              {
                                registro.asientos_totales
                              }
                            </td>

                            <td>
                              {formatearPorcentaje(
                                registro
                                  .ocupacion_porcentaje
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default AdminReportes