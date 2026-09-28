import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  useAuth,
} from '../../context/AuthContext'

import api from '../../services/api'

import AdminSidebar
  from '../../components/Admin/AdminSidebar'

function AdminDashboard() {
  const {
    usuario,
  } = useAuth()

  const [
    resumen,
    setResumen,
  ] = useState(null)

  const [
    ventasPorPelicula,
    setVentasPorPelicula,
  ] = useState([])

  const [
    ocupacionFunciones,
    setOcupacionFunciones,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const obtenerRangoMesActual =
    () => {
      const ahora =
        new Date()

      const primerDia =
        new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          1
        )

      const ultimoDia =
        new Date(
          ahora.getFullYear(),
          ahora.getMonth() + 1,
          0
        )

      const formatear =
        (fecha) => {
          const year =
            fecha.getFullYear()

          const month =
            String(
              fecha.getMonth() + 1
            ).padStart(
              2,
              '0'
            )

          const day =
            String(
              fecha.getDate()
            ).padStart(
              2,
              '0'
            )

          return (
            `${year}-${month}-${day}`
          )
        }

      return {
        desde:
          formatear(
            primerDia
          ),

        hasta:
          formatear(
            ultimoDia
          ),
      }
    }

  const cargarDashboard =
    async () => {
      try {
        setCargando(true)
        setError('')

        const rango =
          obtenerRangoMesActual()

        const respuesta =
          await api.get(
            '/reportes/resumen',
            {
              params:
                rango,
            }
          )

        setResumen(
          respuesta.data.resumen
          ?? null
        )

        setVentasPorPelicula(
          respuesta.data
            .ventas_por_pelicula
          ?? []
        )

        setOcupacionFunciones(
          respuesta.data
            .ocupacion_funciones
          ?? []
        )
      } catch (err) {
        setError(
          err.response?.data
            ?.message
          ?? 'No fue posible cargar el resumen administrativo.'
        )
      } finally {
        setCargando(false)
      }
    }

  useEffect(() => {
    cargarDashboard()
  }, [])

  const formatearMoneda =
    (valor) => {
      return new Intl.NumberFormat(
        'es-GT',
        {
          style:
            'currency',

          currency:
            'GTQ',

          minimumFractionDigits:
            2,
        }
      ).format(
        Number(
          valor
          ?? 0
        )
      )
    }

  const formatearPorcentaje =
    (valor) => {
      return `${Number(
        valor
        ?? 0
      ).toFixed(1)}%`
    }

  const formatearFechaHora =
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

  const nombreMesActual =
    useMemo(() => {
      const nombre =
        new Intl.DateTimeFormat(
          'es-GT',
          {
            month: 'long',
            year: 'numeric',
          }
        ).format(
          new Date()
        )

      return nombre
        .charAt(0)
        .toUpperCase()
        + nombre.slice(1)
    }, [])

  const proximasFunciones =
    useMemo(
      () => {
        const ahora =
          new Date()

        return [
          ...ocupacionFunciones,
        ]
          .filter(
            (funcion) => {
              if (
                !funcion.inicia_en
              ) {
                return false
              }

              return (
                new Date(
                  funcion.inicia_en
                )
                >= ahora
              )
            }
          )
          .sort(
            (a, b) =>
              new Date(
                a.inicia_en
              )
              - new Date(
                b.inicia_en
              )
          )
          .slice(
            0,
            5
          )
      },
      [
        ocupacionFunciones,
      ]
    )

  const peliculaDestacada =
    ventasPorPelicula[0]
    ?? null

  const inicialesUsuario =
    `${
      usuario?.nombres?.[0]
      ?? ''
    }${
      usuario?.apellidos?.[0]
      ?? ''
    }`
      .toUpperCase()
      || 'AC'

  const indicadores = [
    {
      numero: '01',

      titulo:
        'Ingresos del mes',

      valor:
        formatearMoneda(
          resumen
            ?.ingresos
          ?? 0
        ),

      descripcion:
        'Monto total generado por ventas pagadas durante el mes.',
    },

    {
      numero: '02',

      titulo:
        'Ventas pagadas',

      valor:
        resumen
          ?.ventas_pagadas
        ?? 0,

      descripcion:
        'Operaciones de compra que finalizaron con pago confirmado.',
    },

    {
      numero: '03',

      titulo:
        'Entradas vendidas',

      valor:
        resumen
          ?.entradas_vendidas
        ?? 0,

      descripcion:
        'Cantidad de entradas incluidas dentro de las ventas pagadas.',
    },

    {
      numero: '04',

      titulo:
        'Reservas',

      valor:
        resumen
          ?.reservas
        ?? 0,

      descripcion:
        'Reservas registradas durante el mes actual.',
    },

    {
      numero: '05',

      titulo:
        'Ticket promedio',

      valor:
        formatearMoneda(
          resumen
            ?.ticket_promedio
          ?? 0
        ),

      descripcion:
        'Monto promedio generado por cada operación de venta pagada.',
    },

    {
      numero: '06',

      titulo:
        'Conversión de reservas',

      valor:
        formatearPorcentaje(
          resumen
            ?.conversion_reservas
          ?? 0
        ),

      descripcion:
        'Porcentaje de reservas que terminaron convirtiéndose en una venta.',
    },
  ]

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-contenido">
        <div className="admin-pagina">
          <header className="admin-encabezado admin-dashboard-encabezado-final">
            <div>
              <p className="admin-etiqueta">
                PANEL ADMINISTRATIVO
              </p>

              <h1>
                Bienvenido,{' '}
                {usuario?.nombres}
              </h1>

              <p>
                Resumen operativo de
                Atlantic Cinema durante
                el mes actual.
              </p>
            </div>

            <div className="admin-usuario admin-dashboard-usuario-final">
              <div className="admin-dashboard-avatar">
                {inicialesUsuario}
              </div>

              <div>
                <strong>
                  {usuario?.nombres}
                  {' '}
                  {usuario?.apellidos}
                </strong>

                <span>
                  {
                    usuario?.rol
                      ?.nombre
                  }
                </span>
              </div>
            </div>
          </header>

          {error && (
            <div className="admin-mensaje admin-mensaje-error">
              {error}
            </div>
          )}

          {cargando ? (
            <div className="admin-cargando">
              <div className="cartelera-spinner" />

              <p>
                Cargando panel
                administrativo...
              </p>
            </div>
          ) : (
            <>
              <section className="admin-dashboard-resumen">
                <div className="admin-dashboard-seccion-cabecera admin-dashboard-seccion-final">
                  <div>
                    <p className="admin-etiqueta">
                      RESUMEN DEL MES
                    </p>

                    <h2>
                      Indicadores principales
                    </h2>

                    <p>
                      Información calculada
                      a partir de las
                      operaciones reales
                      registradas en el sistema.
                    </p>

                    <span className="admin-dashboard-periodo">
                      {nombreMesActual}
                    </span>
                  </div>

                  <Link
                    to="/admin/reportes"
                    className="admin-dashboard-enlace"
                  >
                    Ver reportes completos →
                  </Link>
                </div>

                <div className="admin-dashboard-indicadores">
                  {indicadores.map(
                    (indicador) => (
                      <article
                        key={
                          indicador.titulo
                        }
                        className="admin-dashboard-indicador admin-dashboard-indicador-final"
                      >
                        <div className="admin-dashboard-indicador-superior">
                          <span>
                            {
                              indicador
                                .titulo
                            }
                          </span>

                          <small>
                            {
                              indicador
                                .numero
                            }
                          </small>
                        </div>

                        <strong>
                          {
                            indicador
                              .valor
                          }
                        </strong>

                        <p>
                          {
                            indicador
                              .descripcion
                          }
                        </p>
                      </article>
                    )
                  )}
                </div>
              </section>

              <div className="admin-dashboard-columnas">
                <section className="admin-seccion admin-dashboard-proximas">
                  <div className="admin-seccion-titulo">
                    <div>
                      <p className="admin-etiqueta">
                        CARTELERA
                      </p>

                      <h2>
                        Próximas funciones
                      </h2>

                      <p>
                        Funciones futuras
                        programadas y su
                        ocupación actual.
                      </p>
                    </div>

                    <Link
                      to="/admin/funciones"
                      className="admin-dashboard-enlace"
                    >
                      Ver funciones →
                    </Link>
                  </div>

                  {proximasFunciones.length
                    === 0 ? (
                    <div className="admin-listado-vacio">
                      <p>
                        No existen próximas
                        funciones durante el
                        período consultado.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-dashboard-funciones">
                      {proximasFunciones.map(
                        (funcion) => {
                          const ocupacion =
                            Math.min(
                              100,
                              Math.max(
                                0,
                                Number(
                                  funcion
                                    .ocupacion_porcentaje
                                  ?? 0
                                )
                              )
                            )

                          return (
                            <article
                              key={
                                funcion
                                  .funcion_id
                              }
                              className="admin-dashboard-funcion admin-dashboard-funcion-final"
                            >
                              <div className="admin-dashboard-funcion-contenido">
                                <div className="admin-dashboard-funcion-principal">
                                  <strong>
                                    {
                                      funcion
                                        .pelicula
                                    }
                                  </strong>

                                  <span>
                                    {
                                      funcion
                                        .sala
                                    }
                                  </span>

                                  <small>
                                    {
                                      formatearFechaHora(
                                        funcion
                                          .inicia_en
                                      )
                                    }
                                  </small>
                                </div>

                                <div className="admin-dashboard-ocupacion">
                                  <strong>
                                    {
                                      formatearPorcentaje(
                                        funcion
                                          .ocupacion_porcentaje
                                      )
                                    }
                                  </strong>

                                  <span>
                                    {
                                      funcion
                                        .asientos_vendidos
                                    }
                                    /
                                    {
                                      funcion
                                        .asientos_totales
                                    }
                                    {' vendidos'}
                                  </span>
                                </div>
                              </div>

                              <div className="admin-dashboard-ocupacion-barra">
                                <span
                                  style={{
                                    width:
                                      `${ocupacion}%`,
                                  }}
                                />
                              </div>
                            </article>
                          )
                        }
                      )}
                    </div>
                  )}
                </section>

                <section className="admin-seccion admin-dashboard-destacada admin-dashboard-destacada-final">
                  <div className="admin-seccion-titulo">
                    <div>
                      <p className="admin-etiqueta">
                        RENDIMIENTO
                      </p>

                      <h2>
                        Película destacada
                      </h2>

                      <p>
                        Película con mayor
                        ingreso acumulado
                        durante el mes.
                      </p>
                    </div>
                  </div>

                  {peliculaDestacada ? (
                    <div className="admin-dashboard-pelicula-destacada admin-dashboard-pelicula-final">
                      <span>
                        MAYOR INGRESO
                      </span>

                      <h3>
                        {
                          peliculaDestacada
                            .titulo
                        }
                      </h3>

                      <strong>
                        {
                          formatearMoneda(
                            peliculaDestacada
                              .ingresos
                          )
                        }
                      </strong>

                      <div className="admin-dashboard-pelicula-datos">
                        <div>
                          <span>
                            Ventas
                          </span>

                          <strong>
                            {
                              peliculaDestacada
                                .ventas
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Entradas
                          </span>

                          <strong>
                            {
                              peliculaDestacada
                                .entradas
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="admin-dashboard-destacada-explicacion">
                        <span>
                          Rendimiento del mes
                        </span>

                        <p>
                          Esta película es la
                          que más ingresos ha
                          generado dentro del
                          período actual.
                        </p>
                      </div>

                      <Link
                        to="/admin/reportes"
                        className="admin-dashboard-enlace"
                      >
                        Analizar rendimiento →
                      </Link>
                    </div>
                  ) : (
                    <div className="admin-listado-vacio">
                      <p>
                        Todavía no existen
                        ventas pagadas durante
                        el mes actual.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard