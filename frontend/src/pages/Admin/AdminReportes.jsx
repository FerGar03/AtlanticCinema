import {

  useEffect,

  useState,

} from 'react'



import {

  Bar,

  BarChart,

  CartesianGrid,

  Cell,

  Legend,

  LabelList,

  Pie,

  PieChart,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from 'recharts'



import api from '../../services/api'



import AdminSidebar

  from '../../components/Admin/AdminSidebar'



function AdminReportes() {

  const [resumen, setResumen] =

    useState(null)



  const [

    periodo,

    setPeriodo,

  ] = useState({

    desde: null,

    hasta: null,

  })



  const [

    ventasPorPelicula,

    setVentasPorPelicula,

  ] = useState([])



  const [

    reservasPorEstado,

    setReservasPorEstado,

  ] = useState({})



  const [

    pagosPorMetodo,

    setPagosPorMetodo,

  ] = useState([])



  const [

    ocupacionFunciones,

    setOcupacionFunciones,

  ] = useState([])



  const [

    filtros,

    setFiltros,

  ] = useState({

    desde: '',

    hasta: '',

  })



  const [cargando, setCargando] =

    useState(true)



  const [error, setError] =

    useState('')



  const cargarResumen =

    async (parametros = {}) => {

      try {

        setCargando(true)

        setError('')



        const respuesta =

          await api.get(

            '/reportes/resumen',

            {

              params: parametros,

            }

          )



        setResumen(

          respuesta.data.resumen

        )



        setPeriodo(

          respuesta.data.periodo

          || {

            desde: null,

            hasta: null,

          }

        )



        setVentasPorPelicula(

          respuesta.data

            .ventas_por_pelicula

          || []

        )



        setReservasPorEstado(

          respuesta.data

            .reservas_por_estado

          || {}

        )



        setPagosPorMetodo(

          respuesta.data

            .pagos_por_metodo

          || []

        )



        setOcupacionFunciones(

          respuesta.data

            .ocupacion_funciones

          || []

        )

      } catch (err) {

        console.error(err)



        const erroresValidacion =

          err.response?.data?.errors



        if (erroresValidacion) {

          const primerError =

            Object.values(

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



  const manejarCambioFiltro = (

    event

  ) => {

    const {

      name,

      value,

    } = event.target



    setFiltros(

      (anterior) => ({

        ...anterior,

        [name]: value,

      })

    )

  }



  const aplicarFiltros =

    async (event) => {

      event.preventDefault()



      const parametros = {}



      if (filtros.desde) {

        parametros.desde =

          filtros.desde

      }



      if (filtros.hasta) {

        parametros.hasta =

          filtros.hasta

      }



      await cargarResumen(

        parametros

      )

    }



  const limpiarFiltros =

    async () => {

      setFiltros({

        desde: '',

        hasta: '',

      })



      await cargarResumen()

    }



  const obtenerFechaLocal = (

    fecha

  ) => {

    const year =

      fecha.getFullYear()



    const month =

      String(

        fecha.getMonth() + 1

      ).padStart(2, '0')



    const day =

      String(

        fecha.getDate()

      ).padStart(2, '0')



    return `${year}-${month}-${day}`

  }



  const aplicarRangoRapido =

    async (tipo) => {

      const hoy =

        new Date()



      let desde

      let hasta



      if (tipo === 'hoy') {

        desde =

          new Date(hoy)



        hasta =

          new Date(hoy)

      }



      if (tipo === 'semana') {

        desde =

          new Date(hoy)



        const diaSemana =

          hoy.getDay()



        const diferenciaLunes =

          diaSemana === 0

            ? -6

            : 1 - diaSemana



        desde.setDate(

          hoy.getDate()

          + diferenciaLunes

        )



        hasta =

          new Date(hoy)

      }



      if (tipo === 'mes') {

        desde =

          new Date(

            hoy.getFullYear(),

            hoy.getMonth(),

            1

          )



        hasta =

          new Date(hoy)

      }



      const fechaDesde =

        obtenerFechaLocal(desde)



      const fechaHasta =

        obtenerFechaLocal(hasta)



      setFiltros({

        desde: fechaDesde,

        hasta: fechaHasta,

      })



      await cargarResumen({

        desde: fechaDesde,

        hasta: fechaHasta,

      })

    }



  const formatearMoneda = (

    valor

  ) => {

    return new Intl.NumberFormat(

      'es-GT',

      {

        style: 'currency',

        currency: 'GTQ',

        minimumFractionDigits: 2,

      }

    ).format(

      Number(valor || 0)

    )

  }



  const formatearPorcentaje = (

    valor

  ) => {

    return `${Number(

      valor || 0

    ).toFixed(2)}%`

  }



  const formatearFechaHora = (

    valor

  ) => {

    if (!valor) {

      return '-'

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

      new Date(valor)

    )

  }



  const indicadores = resumen

    ? [

        {

          titulo: 'Ingresos',

          valor:

            formatearMoneda(

              resumen.ingresos

            ),

          descripcion:

            'Ingresos correspondientes a ventas pagadas.',

          destacado: true,

        },

        {

          titulo:

            'Ventas pagadas',

          valor:

            resumen

              .ventas_pagadas,

          descripcion:

            'Cantidad de ventas completadas.',

        },

        {

          titulo:

            'Entradas vendidas',

          valor:

            resumen

              .entradas_vendidas,

          descripcion:

            'Entradas asociadas a ventas pagadas.',

        },

        {

          titulo:

            'Reservas',

          valor:

            resumen.reservas,

          descripcion:

            'Total de reservas registradas.',

        },

        {

          titulo:

            'Reservas convertidas',

          valor:

            resumen

              .reservas_convertidas,

          descripcion:

            'Reservas que finalizaron en una venta.',

        },

        {

          titulo:

            'Conversión de reservas',

          valor:

            formatearPorcentaje(

              resumen

                .conversion_reservas

            ),

          descripcion:

            'Porcentaje de reservas convertidas en venta.',

        },

        {

          titulo:

            'Ventas web',

          valor:

            resumen

              .ventas_compra_web,

          descripcion:

            'Ventas pagadas originadas por compra web.',

        },

        {

          titulo:

            'Ventas desde reserva',

          valor:

            resumen

              .ventas_desde_reserva,

          descripcion:

            'Ventas pagadas provenientes de reservas.',

        },

        {

          titulo:

            'Ticket promedio',

          valor:

            formatearMoneda(

              resumen

                .ticket_promedio

            ),

          descripcion:

            'Ingreso promedio por venta pagada.',

          destacado: true,

        },

        {

          titulo:

            'Funciones',

          valor:

            resumen.funciones,

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



  const datosReservasGrafica =

    estadosReserva.map(

      (registro) => ({

        nombre:

          registro.etiqueta,



        cantidad:

          reservasPorEstado[

            registro.estado

          ] || 0,

      })

    )



  const existenReservas =

    datosReservasGrafica.some(

      (registro) =>

        registro.cantidad > 0

    )



  const coloresReservas = [

    '#f5c451',

    '#35c98b',

    '#ef6b73',

    '#818cf8',

  ]



  const coloresPeliculas = [

    '#35bfc0',

    '#4f8edc',

    '#f5c451',

    '#9b7de3',

    '#35c98b',

    '#ef8f6b',

  ]



  const coloresPagos = [

    '#35bfc0',

    '#f5c451',

    '#4f8edc',

    '#9b7de3',

    '#35c98b',

  ]



  const ventasPorPeliculaOrdenadas =

    [...ventasPorPelicula].sort(

      (a, b) =>

        Number(b.ingresos || 0)

        - Number(a.ingresos || 0)

    )



  const pagosPorMetodoOrdenados =

    [...pagosPorMetodo].sort(

      (a, b) =>

        Number(b.monto || 0)

        - Number(a.monto || 0)

    )



  const obtenerColorOcupacion = (

    valor

  ) => {

    const porcentaje =

      Number(valor || 0)



    if (porcentaje >= 85) {

      return '#35c98b'

    }



    if (porcentaje >= 60) {

      return '#35bfc0'

    }



    if (porcentaje >= 30) {

      return '#f5c451'

    }



    return '#6f7682'

  }



  const tooltipMoneda = (

    valor

  ) => {

    return formatearMoneda(

      valor

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

                REPORTES ADMINISTRATIVOS

              </p>



              <h1>

                Resumen general

              </h1>



              <p>

                Consulta los principales

                indicadores de operación

                de Atlantic Cinema.

              </p>

            </div>

          </div>



          <section className="admin-seccion reportes-periodo">

            <div className="admin-seccion-titulo">

              <div>

                <h2>

                  Período del reporte

                </h2>



                <p>

                  Filtra la información

                  utilizando un rango de

                  fechas o una selección

                  rápida.

                </p>

              </div>

            </div>



            <div className="reportes-filtros-rapidos">

              <button

                type="button"

                className="reportes-boton-secundario"

                onClick={() =>

                  aplicarRangoRapido(

                    'hoy'

                  )

                }

                disabled={

                  cargando

                }

              >

                Hoy

              </button>



              <button

                type="button"

                className="reportes-boton-secundario"

                onClick={() =>

                  aplicarRangoRapido(

                    'semana'

                  )

                }

                disabled={

                  cargando

                }

              >

                Esta semana

              </button>



              <button

                type="button"

                className="reportes-boton-secundario"

                onClick={() =>

                  aplicarRangoRapido(

                    'mes'

                  )

                }

                disabled={

                  cargando

                }

              >

                Este mes

              </button>

            </div>



            <form

              onSubmit={

                aplicarFiltros

              }

              className="reportes-filtros"

            >

              <label className="reportes-campo">

                <span>

                  Desde

                </span>



                <input

                  type="date"

                  name="desde"

                  value={

                    filtros.desde

                  }

                  onChange={

                    manejarCambioFiltro

                  }

                />

              </label>



              <label className="reportes-campo">

                <span>

                  Hasta

                </span>



                <input

                  type="date"

                  name="hasta"

                  value={

                    filtros.hasta

                  }

                  onChange={

                    manejarCambioFiltro

                  }

                />

              </label>



              <button

                type="submit"

                className="reportes-boton-principal"

                disabled={

                  cargando

                }

              >

                Aplicar filtros

              </button>



              <button

                type="button"

                className="reportes-boton-secundario"

                onClick={

                  limpiarFiltros

                }

                disabled={

                  cargando

                }

              >

                Limpiar

              </button>

            </form>



            <div className="reportes-periodo-actual">

              <span>

                PERÍODO CONSULTADO

              </span>



              <strong>

                {periodo.desde

                  || periodo.hasta

                  ? `${periodo.desde || 'Inicio'} a ${periodo.hasta || 'Actualidad'}`

                  : 'Historial completo'}

              </strong>

            </div>

          </section>



          {cargando && (

            <div className="admin-cargando reportes-cargando">

              <div className="cartelera-spinner" />



              <p>

                Cargando reportes...

              </p>

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



          {!cargando

            && !error

            && resumen && (

              <>

                <section className="admin-seccion">

                  <div className="admin-seccion-titulo">

                    <div>

                      <h2>

                        Indicadores generales

                      </h2>



                      <p>

                        Resumen de la

                        operación durante

                        el período

                        seleccionado.

                      </p>

                    </div>

                  </div>



                  <div className="reportes-indicadores-grid">

                    {indicadores.map(

                      (indicador) => (

                        <article

                          className={

                            indicador

                              .destacado

                              ? 'reportes-indicador reportes-indicador-destacado'

                              : 'reportes-indicador'

                          }

                          key={

                            indicador.titulo

                          }

                        >

                          <span className="reportes-indicador-etiqueta">

                            {

                              indicador.titulo

                            }

                          </span>



                          <strong>

                            {

                              indicador.valor

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



                <section className="admin-seccion">

                  <div className="admin-seccion-titulo">

                    <div>

                      <h2>

                        Ingresos por película

                      </h2>



                      <p>

                        Comparación de

                        ingresos generados

                        por cada película.

                      </p>

                    </div>

                  </div>



                  {ventasPorPelicula

                    .length === 0 ? (

                      <p>

                        No existen ventas

                        pagadas para el

                        período seleccionado.

                      </p>

                    ) : (

                      <div className="reportes-grafica">

                        <ResponsiveContainer>

                          <BarChart

                            data={

                              ventasPorPeliculaOrdenadas

                            }

                            layout="vertical"

                            margin={{

                              top: 12,

                              right: 92,

                              left: 20,

                              bottom: 12,

                            }}

                          >

                            <CartesianGrid

                              strokeDasharray="3 3"

                              stroke="#2e303a"

                              horizontal={false}

                            />



                            <XAxis

                              type="number"

                              tickFormatter={

                                (valor) =>

                                  `Q${Number(

                                    valor || 0

                                  ).toFixed(0)}`

                              }

                              tick={{

                                fill:

                                  '#a8adb7',

                                fontSize: 11,

                              }}

                            />



                            <YAxis

                              type="category"

                              dataKey="titulo"

                              width={145}

                              tick={{

                                fill:

                                  '#a8adb7',

                                fontSize: 11,

                              }}

                            />



                            <Tooltip

                              formatter={

                                (valor) => [

                                  tooltipMoneda(

                                    valor

                                  ),

                                  'Ingresos',

                                ]

                              }

                              cursor={{

                                fill:

                                  'rgba(53, 191, 192, 0.04)',

                              }}

                              contentStyle={{

                                background:

                                  '#1d1f25',

                                border:

                                  '1px solid #343740',

                                borderRadius:

                                  '8px',

                              }}

                            />



                            <Legend />



                            <Bar

                              dataKey="ingresos"

                              name="Ingresos"

                              radius={[

                                0,

                                6,

                                6,

                                0,

                              ]}

                            >

                              {ventasPorPeliculaOrdenadas.map(

                                (

                                  registro,

                                  index

                                ) => (

                                  <Cell

                                    key={

                                      registro

                                        .pelicula_id

                                    }

                                    fill={

                                      coloresPeliculas[

                                        index

                                        % coloresPeliculas

                                          .length

                                      ]

                                    }

                                  />

                                )

                              )}



                              <LabelList

                                dataKey="ingresos"

                                position="right"

                                formatter={

                                  (valor) =>

                                    formatearMoneda(

                                      valor

                                    )

                                }

                                fill="#d7dbe3"

                                fontSize={10}

                              />

                            </Bar>

                          </BarChart>

                        </ResponsiveContainer>

                      </div>

                    )}

                </section>



                <section className="admin-seccion">

                  <div className="admin-seccion-titulo">

                    <div>

                      <h2>

                        Ventas e ingresos

                        por película

                      </h2>



                      <p>

                        Detalle de ventas,

                        entradas e ingresos.

                      </p>

                    </div>

                  </div>



                  {ventasPorPelicula

                    .length === 0 ? (

                      <p>

                        No existen ventas

                        pagadas para el

                        período seleccionado.

                      </p>

                    ) : (

                      <div className="admin-tabla-contenedor">

                        <table className="admin-tabla reportes-tabla-peliculas">

                          <thead>

                            <tr>

                              <th>

                                Película

                              </th>



                              <th>

                                Ventas

                              </th>



                              <th>

                                Entradas

                              </th>



                              <th>

                                Ingresos

                              </th>

                            </tr>

                          </thead>



                          <tbody>

                            {ventasPorPelicula.map(

                              (registro) => (

                                <tr

                                  key={

                                    registro

                                      .pelicula_id

                                  }

                                >

                                  <td>

                                    <strong>

                                      {

                                        registro

                                          .titulo

                                      }

                                    </strong>

                                  </td>



                                  <td>

                                    {

                                      registro

                                        .ventas

                                    }

                                  </td>



                                  <td>

                                    {

                                      registro

                                        .entradas

                                    }

                                  </td>



                                  <td>

                                    <strong className="reportes-monto">

                                      {formatearMoneda(

                                        registro

                                          .ingresos

                                      )}

                                    </strong>

                                  </td>

                                </tr>

                              )

                            )}

                          </tbody>

                        </table>

                      </div>

                    )}

                </section>



                <section className="admin-seccion">

                  <div className="admin-seccion-titulo">

                    <div>

                      <h2>

                        Reservas por estado

                      </h2>



                      <p>

                        Distribución de las

                        reservas registradas.

                      </p>

                    </div>

                  </div>



                  {existenReservas ? (

                    <div className="reportes-grafica reportes-grafica-pastel">

                      <ResponsiveContainer>

                        <PieChart>

                          <Pie

                            data={

                              datosReservasGrafica

                            }

                            dataKey="cantidad"

                            nameKey="nombre"

                            cx="50%"

                            cy="50%"

                            innerRadius={

                              58

                            }

                            outerRadius={

                              110

                            }

                            paddingAngle={3}

                            label={({

                              name,

                              value,

                            }) =>

                              `${name}: ${value}`

                            }

                          >

                            {datosReservasGrafica.map(

                              (

                                registro,

                                index

                              ) => (

                                <Cell

                                  key={

                                    registro

                                      .nombre

                                  }

                                  fill={

                                    coloresReservas[

                                      index

                                      % coloresReservas

                                        .length

                                    ]

                                  }

                                />

                              )

                            )}

                          </Pie>



                          <Tooltip

                            contentStyle={{

                              background:

                                '#1d1f25',

                              border:

                                '1px solid #343740',

                              borderRadius:

                                '8px',

                            }}

                          />



                          <Legend />

                        </PieChart>

                      </ResponsiveContainer>

                    </div>

                  ) : (

                    <p>

                      No existen reservas

                      para el período

                      seleccionado.

                    </p>

                  )}



                  <div className="reportes-reservas-grid">

                    {estadosReserva.map(

                      (registro) => (

                        <article

                          className="reportes-reserva-card"

                          key={

                            registro.estado

                          }

                        >

                          <span>

                            {

                              registro

                                .etiqueta

                            }

                          </span>



                          <strong>

                            {

                              reservasPorEstado[

                                registro

                                  .estado

                              ] || 0

                            }

                          </strong>



                          <p>

                            Reservas con

                            estado{' '}

                            {registro.estado

                              .toLowerCase()}

                            .

                          </p>

                        </article>

                      )

                    )}

                  </div>

                </section>



                <section className="admin-seccion">

                  <div className="admin-seccion-titulo">

                    <div>

                      <h2>

                        Pagos por método

                      </h2>



                      <p>

                        Distribución de

                        pagos aprobados

                        según su método.

                      </p>

                    </div>

                  </div>



                  {pagosPorMetodo

                    .length === 0 ? (

                      <p>

                        No existen pagos

                        aprobados para el

                        período seleccionado.

                      </p>

                    ) : (

                      <>

                        <div className="reportes-grafica reportes-grafica-pastel">

                          <ResponsiveContainer>

                            <PieChart>

                              <Pie

                                data={

                                  pagosPorMetodoOrdenados

                                }

                                dataKey="monto"

                                nameKey="nombre"

                                cx="50%"

                                cy="50%"

                                innerRadius={65}

                                outerRadius={108}

                                paddingAngle={3}

                                label={({

                                  name,

                                  value,

                                }) =>

                                  `${name}: ${formatearMoneda(

                                    value

                                  )}`

                                }

                              >

                                {pagosPorMetodoOrdenados.map(

                                  (

                                    registro,

                                    index

                                  ) => (

                                    <Cell

                                      key={

                                        registro.metodo

                                      }

                                      fill={

                                        coloresPagos[

                                          index

                                          % coloresPagos

                                            .length

                                        ]

                                      }

                                    />

                                  )

                                )}

                              </Pie>



                              <Tooltip

                                formatter={

                                  (valor) => [

                                    tooltipMoneda(

                                      valor

                                    ),

                                    'Monto',

                                  ]

                                }

                                contentStyle={{

                                  background:

                                    '#1d1f25',

                                  border:

                                    '1px solid #343740',

                                  borderRadius:

                                    '8px',

                                }}

                              />



                              <Legend />

                            </PieChart>

                          </ResponsiveContainer>

                        </div>



                        <div className="admin-tabla-contenedor">

                          <table className="admin-tabla reportes-tabla-pagos">

                            <thead>

                              <tr>

                                <th>

                                  Método

                                </th>



                                <th>

                                  Nombre

                                </th>



                                <th>

                                  Cantidad

                                </th>



                                <th>

                                  Monto

                                </th>

                              </tr>

                            </thead>



                            <tbody>

                              {pagosPorMetodo.map(

                                (

                                  registro

                                ) => (

                                  <tr

                                    key={

                                      registro

                                        .metodo

                                    }

                                  >

                                    <td>

                                      {

                                        registro

                                          .metodo

                                      }

                                    </td>



                                    <td>

                                      {

                                        registro

                                          .nombre

                                      }

                                    </td>



                                    <td>

                                      {

                                        registro

                                          .cantidad

                                      }

                                    </td>



                                    <td>

                                      <strong className="reportes-monto">

                                        {formatearMoneda(

                                          registro

                                            .monto

                                        )}

                                      </strong>

                                    </td>

                                  </tr>

                                )

                              )}

                            </tbody>

                          </table>

                        </div>

                      </>

                    )}

                </section>



                <section className="admin-seccion">

                  <div className="admin-seccion-titulo">

                    <div>

                      <h2>

                        Ocupación por función

                      </h2>



                      <p>

                        Porcentaje de asientos

                        vendidos por función.

                      </p>

                    </div>

                  </div>



                  {ocupacionFunciones

                    .length === 0 ? (

                      <p>

                        No existen funciones

                        para el período

                        seleccionado.

                      </p>

                    ) : (

                      <div className="admin-tabla-contenedor">

                        <table className="admin-tabla reportes-tabla-ocupacion">

                          <thead>

                            <tr>

                              <th>

                                Película

                              </th>



                              <th>

                                Sala

                              </th>



                              <th>

                                Fecha y hora

                              </th>



                              <th>

                                Vendidos

                              </th>



                              <th>

                                Total

                              </th>



                              <th>

                                Ocupación

                              </th>

                            </tr>

                          </thead>



                          <tbody>

                            {ocupacionFunciones.map(

                              (

                                registro

                              ) => (

                                <tr

                                  key={

                                    registro

                                      .funcion_id

                                  }

                                >

                                  <td>

                                    <strong>

                                      {

                                        registro

                                          .pelicula

                                      }

                                    </strong>

                                  </td>



                                  <td>

                                    {

                                      registro

                                        .sala

                                    }

                                  </td>



                                  <td>

                                    <span className="reportes-fecha">

                                      {formatearFechaHora(

                                        registro

                                          .inicia_en

                                      )}

                                    </span>

                                  </td>



                                  <td>

                                    {

                                      registro

                                        .asientos_vendidos

                                    }

                                  </td>



                                  <td>

                                    {

                                      registro

                                        .asientos_totales

                                    }

                                  </td>



                                  <td>

                                    <div className="reportes-ocupacion">

                                      <strong>

                                        {formatearPorcentaje(

                                          registro

                                            .ocupacion_porcentaje

                                        )}

                                      </strong>



                                      <div className="reportes-ocupacion-barra">

                                        <span

                                          style={{

                                            width:

                                              `${Math.min(

                                                Number(

                                                  registro

                                                    .ocupacion_porcentaje

                                                  || 0

                                                ),

                                                100

                                              )}%`,

                                            backgroundColor:

                                              obtenerColorOcupacion(

                                                registro

                                                  .ocupacion_porcentaje

                                              ),

                                          }}

                                        />

                                      </div>

                                    </div>

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

        </div>

      </main>

    </div>

  )

}



export default AdminReportes