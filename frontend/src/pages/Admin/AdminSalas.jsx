import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import api from '../../services/api'

import AdminSidebar
  from '../../components/Admin/AdminSidebar'

import AdminPaginacion
  from '../../components/Admin/AdminPaginacion'

const nuevaSalaInicial = {
  nombre: '',
  descripcion: '',
  estado: 'ACTIVA',
  filas: [
    {
      fila: 'A',
      cantidad: 18,
    },
  ],
}

const paginacionInicial = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0,
}

function AdminSalas() {
  const [
    salas,
    setSalas,
  ] = useState([])

  const [
    salaSeleccionada,
    setSalaSeleccionada,
  ] = useState(null)

  const [
    asientos,
    setAsientos,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    cargandoSala,
    setCargandoSala,
  ] = useState(false)

  const [
    guardandoSala,
    setGuardandoSala,
  ] = useState(false)

  const [
    creandoSala,
    setCreandoSala,
  ] = useState(false)

  const [
    mostrandoNuevaSala,
    setMostrandoNuevaSala,
  ] = useState(false)

  const [
    formularioNuevaSala,
    setFormularioNuevaSala,
  ] = useState(
    nuevaSalaInicial
  )

  const [
    confirmarNuevaSala,
    setConfirmarNuevaSala,
  ] = useState(false)

  const [
    procesandoAsientoId,
    setProcesandoAsientoId,
  ] = useState(null)

  const [
    mensaje,
    setMensaje,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    confirmacionAsiento,
    setConfirmacionAsiento,
  ] = useState(null)

  const [
    formularioSala,
    setFormularioSala,
  ] = useState({
    nombre: '',
    descripcion: '',
    estado: 'ACTIVA',
  })

  /*
   * Búsqueda, filtros y paginación.
   */
  const [
    busqueda,
    setBusqueda,
  ] = useState('')

  const [
    busquedaAplicada,
    setBusquedaAplicada,
  ] = useState('')

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState('TODOS')

  const [
    pagina,
    setPagina,
  ] = useState(1)

  const [
    porPagina,
    setPorPagina,
  ] = useState(20)

  const [
    paginacion,
    setPaginacion,
  ] = useState(
    paginacionInicial
  )

  /*
   * Carga paginada del listado
   * administrativo de salas.
   */
  const cargarSalas =
    async () => {
      try {
        setCargando(true)
        setError('')

        const params = {
          paginar:
            1,

          page:
            pagina,

          per_page:
            porPagina,
        }

        if (
          busquedaAplicada
        ) {
          params.buscar =
            busquedaAplicada
        }

        if (
          estadoFiltro
          !== 'TODOS'
        ) {
          params.estado =
            estadoFiltro
        }

        const respuesta =
          await api.get(
            '/salas',
            {
              params,
            }
          )

        const meta = {
          ...paginacionInicial,

          ...(
            respuesta.data.meta
            ?? {}
          ),
        }

        if (
          pagina
          > meta.last_page
          && meta.last_page >= 1
        ) {
          setPagina(
            meta.last_page
          )

          return
        }

        setSalas(
          respuesta.data.data
          ?? []
        )

        setPaginacion(
          meta
        )
      } catch (err) {
        setError(
          err.response?.data
            ?.message
          ?? 'No fue posible cargar las salas.'
        )

        setSalas([])

        setPaginacion(
          paginacionInicial
        )
      } finally {
        setCargando(false)
      }
    }

  /*
   * Debounce de búsqueda.
   */
  useEffect(() => {
    const temporizador =
      setTimeout(
        () => {
          setBusquedaAplicada(
            busqueda.trim()
          )

          setPagina(1)
        },
        400
      )

    return () =>
      clearTimeout(
        temporizador
      )
  }, [busqueda])

  /*
   * Recarga de salas cuando cambian
   * filtros o paginación.
   */
  useEffect(() => {
    cargarSalas()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    estadoFiltro,
  ])

  const limpiarMensajes =
    () => {
      setMensaje('')
      setError('')
    }

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
        ?? 'Ocurrió un error al procesar la solicitud.'
      )
    }

  const cargarDetalleSala =
    async (salaId) => {
      const [
        salaRespuesta,
        asientosRespuesta,
      ] = await Promise.all([
        api.get(
          `/salas/${salaId}`
        ),

        api.get(
          `/salas/${salaId}/asientos`
        ),
      ])

      const salaCompleta =
        salaRespuesta
          .data.data

      setSalaSeleccionada(
        salaCompleta
      )

      setAsientos(
        asientosRespuesta
          .data.data
        ?? []
      )

      setFormularioSala({
        nombre:
          salaCompleta.nombre
          ?? '',

        descripcion:
          salaCompleta.descripcion
          ?? '',

        estado:
          salaCompleta.estado
          ?? 'ACTIVA',
      })
    }

  const seleccionarSala =
    async (sala) => {
      try {
        limpiarMensajes()

        setMostrandoNuevaSala(
          false
        )

        setCargandoSala(
          true
        )

        await cargarDetalleSala(
          sala.id
        )

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )
      } finally {
        setCargandoSala(
          false
        )
      }
    }

  /*
   * Filtros y paginación.
   */
  const cambiarEstadoFiltro =
    (valor) => {
      setEstadoFiltro(
        valor
      )

      setPagina(1)

      setSalaSeleccionada(
        null
      )

      setAsientos([])
    }

  const cambiarPorPagina =
    (valor) => {
      setPorPagina(
        valor
      )

      setPagina(1)

      setSalaSeleccionada(
        null
      )

      setAsientos([])
    }

  const cambiarPagina =
    (nuevaPagina) => {
      if (
        nuevaPagina < 1
        || nuevaPagina
          > paginacion.last_page
      ) {
        return
      }

      setPagina(
        nuevaPagina
      )

      setSalaSeleccionada(
        null
      )

      setAsientos([])

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

  const limpiarFiltros =
    () => {
      setBusqueda('')
      setBusquedaAplicada('')
      setEstadoFiltro('TODOS')
      setPagina(1)

      setSalaSeleccionada(
        null
      )

      setAsientos([])
    }

  const manejarCambioSala =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setFormularioSala(
        (anterior) => ({
          ...anterior,

          [name]:
            value,
        })
      )
    }

  const actualizarSala =
    async (event) => {
      event.preventDefault()

      if (!salaSeleccionada) {
        return
      }

      try {
        setGuardandoSala(
          true
        )

        limpiarMensajes()

        await api.patch(
          `/salas/${salaSeleccionada.id}`,
          {
            nombre:
              formularioSala
                .nombre,

            descripcion:
              formularioSala
                .descripcion
              || null,

            estado:
              formularioSala
                .estado,
          }
        )

        setMensaje(
          'Sala actualizada correctamente.'
        )

        await cargarSalas()

        await cargarDetalleSala(
          salaSeleccionada.id
        )

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } finally {
        setGuardandoSala(
          false
        )
      }
    }

  const mostrarFormularioNuevaSala =
    () => {
      limpiarMensajes()

      setSalaSeleccionada(
        null
      )

      setAsientos([])

      setFormularioNuevaSala(
        nuevaSalaInicial
      )

      setMostrandoNuevaSala(
        true
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

  const cerrarNuevaSala =
    () => {
      if (creandoSala) {
        return
      }

      setMostrandoNuevaSala(
        false
      )

      setFormularioNuevaSala(
        nuevaSalaInicial
      )

      limpiarMensajes()
    }

  const manejarCambioNuevaSala =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setFormularioNuevaSala(
        (anterior) => ({
          ...anterior,

          [name]:
            value,
        })
      )
    }

  const obtenerSiguienteFila =
    (filas) => {
      const usadas =
        filas.map(
          (fila) =>
            fila.fila
              .toUpperCase()
        )

      const letras =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

      for (
        const letra of letras
      ) {
        if (
          !usadas.includes(
            letra
          )
        ) {
          return letra
        }
      }

      return `F${filas.length + 1}`
    }

  const agregarFila =
    () => {
      setFormularioNuevaSala(
        (anterior) => {
          if (
            anterior
              .filas
              .length
            >= 20
          ) {
            return anterior
          }

          return {
            ...anterior,

            filas: [
              ...anterior.filas,

              {
                fila:
                  obtenerSiguienteFila(
                    anterior.filas
                  ),

                cantidad:
                  20,
              },
            ],
          }
        }
      )
    }

  const actualizarFila =
    (
      indice,
      campo,
      valor
    ) => {
      setFormularioNuevaSala(
        (anterior) => ({
          ...anterior,

          filas:
            anterior.filas.map(
              (
                fila,
                filaIndice
              ) =>
                filaIndice
                === indice
                  ? {
                      ...fila,

                      [campo]:
                        campo
                        === 'fila'
                          ? valor
                              .toUpperCase()
                          : valor,
                    }
                  : fila
            ),
        })
      )
    }

  const eliminarFila =
    (indice) => {
      setFormularioNuevaSala(
        (anterior) => {
          if (
            anterior
              .filas
              .length
            <= 1
          ) {
            return anterior
          }

          return {
            ...anterior,

            filas:
              anterior.filas.filter(
                (
                  _fila,
                  filaIndice
                ) =>
                  filaIndice
                  !== indice
              ),
          }
        }
      )
    }

  const capacidadNuevaSala =
    useMemo(
      () =>
        formularioNuevaSala
          .filas
          .reduce(
            (
              total,
              fila
            ) => {
              const cantidad =
                Number(
                  fila.cantidad
                )

              return (
                total
                + (
                  Number.isFinite(
                    cantidad
                  )
                    ? Math.max(
                        0,
                        cantidad
                      )
                    : 0
                )
              )
            },
            0
          ),
      [
        formularioNuevaSala
          .filas,
      ]
    )

  const abrirConfirmacionNuevaSala =
    (event) => {
      event.preventDefault()

      limpiarMensajes()

      const filasInvalidas =
        formularioNuevaSala
          .filas
          .some(
            (fila) =>
              !fila
                .fila
                .trim()
              || Number(
                fila.cantidad
              ) < 1
          )

      if (
        filasInvalidas
      ) {
        setError(
          'Revisa la configuración de las filas.'
        )

        return
      }

      const nombres =
        formularioNuevaSala
          .filas
          .map(
            (fila) =>
              fila.fila
                .trim()
                .toUpperCase()
          )

      if (
        new Set(
          nombres
        ).size
        !== nombres.length
      ) {
        setError(
          'No puede existir la misma fila más de una vez.'
        )

        return
      }

      setConfirmarNuevaSala(
        true
      )
    }

  const cerrarConfirmacionNuevaSala =
    () => {
      if (creandoSala) {
        return
      }

      setConfirmarNuevaSala(
        false
      )
    }

  const crearSala =
    async () => {
      try {
        setCreandoSala(
          true
        )

        limpiarMensajes()

        const response =
          await api.post(
            '/salas',
            {
              nombre:
                formularioNuevaSala
                  .nombre,

              descripcion:
                formularioNuevaSala
                  .descripcion
                || null,

              estado:
                formularioNuevaSala
                  .estado,

              filas:
                formularioNuevaSala
                  .filas
                  .map(
                    (fila) => ({
                      fila:
                        fila.fila
                          .trim()
                          .toUpperCase(),

                      cantidad:
                        Number(
                          fila.cantidad
                        ),
                    })
                  ),
            }
          )

        const salaCreada =
          response.data.data
          ?? response.data

        setConfirmarNuevaSala(
          false
        )

        setMostrandoNuevaSala(
          false
        )

        setFormularioNuevaSala(
          nuevaSalaInicial
        )

        setMensaje(
          'Sala y distribución de asientos creadas correctamente.'
        )

        await cargarSalas()

        await cargarDetalleSala(
          salaCreada.id
        )

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setConfirmarNuevaSala(
          false
        )

        setError(
          obtenerPrimerError(
            err
          )
        )
      } finally {
        setCreandoSala(
          false
        )
      }
    }

  const actualizarAsiento =
    async (
      asiento,
      datos,
      mensajeExito
    ) => {
      try {
        setProcesandoAsientoId(
          asiento.id
        )

        limpiarMensajes()

        await api.patch(
          `/asientos/${asiento.id}`,
          datos
        )

        setMensaje(
          mensajeExito
          ?? `Asiento ${asiento.fila}${asiento.numero} actualizado correctamente.`
        )

        const salaId =
          salaSeleccionada.id

        await cargarDetalleSala(
          salaId
        )

        await cargarSalas()
      } catch (err) {
        setError(
          obtenerPrimerError(
            err
          )
        )
      } finally {
        setProcesandoAsientoId(
          null
        )
      }
    }

  const solicitarCambioEstado =
    (asiento) => {
      const nuevoEstado =
        asiento.estado
        === 'ACTIVO'
          ? 'INACTIVO'
          : 'ACTIVO'

      setConfirmacionAsiento({
        tipo:
          'ESTADO',

        asiento,

        nuevoValor:
          nuevoEstado,
      })
    }

  const solicitarCambioTipo =
    (
      asiento,
      nuevoTipo
    ) => {
      if (
        asiento.tipo
        === nuevoTipo
      ) {
        return
      }

      setConfirmacionAsiento({
        tipo:
          'TIPO',

        asiento,

        nuevoValor:
          nuevoTipo,
      })
    }

  const cerrarConfirmacion =
    () => {
      if (
        procesandoAsientoId
      ) {
        return
      }

      setConfirmacionAsiento(
        null
      )
    }

  const confirmarCambioAsiento =
    async () => {
      if (
        !confirmacionAsiento
      ) {
        return
      }

      const {
        tipo,
        asiento,
        nuevoValor,
      } =
        confirmacionAsiento

      setConfirmacionAsiento(
        null
      )

      if (
        tipo
        === 'ESTADO'
      ) {
        await actualizarAsiento(
          asiento,
          {
            estado:
              nuevoValor,
          },
          `El asiento ${asiento.fila}${asiento.numero} fue cambiado a ${nuevoValor}.`
        )

        return
      }

      await actualizarAsiento(
        asiento,
        {
          tipo:
            nuevoValor,
        },
        `El asiento ${asiento.fila}${asiento.numero} fue cambiado a tipo ${nuevoValor}.`
      )
    }

  const asientosPorFila =
    useMemo(
      () => {
        const agrupados = {}

        for (
          const asiento
          of asientos
        ) {
          if (
            !agrupados[
              asiento.fila
            ]
          ) {
            agrupados[
              asiento.fila
            ] = []
          }

          agrupados[
            asiento.fila
          ].push(
            asiento
          )
        }

        return Object.entries(
          agrupados
        )
          .sort(
            (
              [filaA],
              [filaB]
            ) =>
              filaA.localeCompare(
                filaB
              )
          )
          .map(
            ([
              fila,
              lista,
            ]) => ({
              fila,

              asientos:
                [...lista].sort(
                  (a, b) =>
                    Number(
                      a.numero
                    )
                    - Number(
                      b.numero
                    )
                ),
            })
          )
      },
      [
        asientos,
      ]
    )

  const obtenerClaseSalaEstado =
    (estado) => {
      switch (estado) {
        case 'ACTIVA':
          return (
            'admin-estado-activo'
          )

        case 'INACTIVA':
          return (
            'admin-estado-inactivo'
          )

        case 'MANTENIMIENTO':
          return (
            'admin-estado-mantenimiento'
          )

        default:
          return ''
      }
    }

  const procesando =
    Boolean(
      procesandoAsientoId
    )

  const hayFiltros =
    Boolean(
      busqueda
    )
    || estadoFiltro
      !== 'TODOS'

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-contenido">
        <div className="admin-pagina">
          <div className="admin-pagina-encabezado admin-salas-encabezado">
            <div>
              <p className="admin-etiqueta">
                ADMINISTRACIÓN
              </p>

              <h1>
                Salas y asientos
              </h1>

              <p>
                Consulta y administra
                las salas físicas de
                Atlantic Cinema.
              </p>
            </div>

            <button
              type="button"
              className="admin-sala-nueva-boton"
              onClick={
                mostrarFormularioNuevaSala
              }
            >
              + Nueva sala
            </button>
          </div>

          {mensaje && (
            <div className="admin-mensaje admin-mensaje-exito">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="admin-mensaje admin-mensaje-error">
              {error}
            </div>
          )}

          {mostrandoNuevaSala && (
            <section className="admin-seccion">
              <div className="admin-seccion-titulo">
                <div>
                  <h2>
                    Crear nueva sala
                  </h2>

                  <p>
                    Define las filas y
                    la cantidad de asientos
                    de la nueva sala.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-boton-secundario"
                  onClick={
                    cerrarNuevaSala
                  }
                  disabled={
                    creandoSala
                  }
                >
                  Cancelar
                </button>
              </div>

              <form
                className="admin-formulario"
                onSubmit={
                  abrirConfirmacionNuevaSala
                }
              >
                <div className="admin-form-grid">
                  <label>
                    Nombre

                    <input
                      type="text"
                      name="nombre"
                      value={
                        formularioNuevaSala
                          .nombre
                      }
                      onChange={
                        manejarCambioNuevaSala
                      }
                      placeholder="Ej. Sala 3"
                      required
                    />
                  </label>

                  <label>
                    Estado

                    <select
                      name="estado"
                      value={
                        formularioNuevaSala
                          .estado
                      }
                      onChange={
                        manejarCambioNuevaSala
                      }
                    >
                      <option value="ACTIVA">
                        ACTIVA
                      </option>

                      <option value="INACTIVA">
                        INACTIVA
                      </option>

                      <option value="MANTENIMIENTO">
                        MANTENIMIENTO
                      </option>
                    </select>
                  </label>
                </div>

                <label>
                  Descripción

                  <textarea
                    name="descripcion"
                    rows="3"
                    value={
                      formularioNuevaSala
                        .descripcion
                    }
                    onChange={
                      manejarCambioNuevaSala
                    }
                    placeholder="Descripción opcional de la sala"
                  />
                </label>

                <div className="admin-generador-sala">
                  <div className="admin-generador-cabecera">
                    <div>
                      <span className="admin-etiqueta">
                        DISTRIBUCIÓN
                      </span>

                      <h3>
                        Filas de asientos
                      </h3>

                      <p>
                        Todos los asientos
                        se crearán inicialmente
                        como NORMAL y ACTIVO.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-boton-secundario"
                      onClick={
                        agregarFila
                      }
                      disabled={
                        formularioNuevaSala
                          .filas
                          .length
                        >= 20
                      }
                    >
                      + Agregar fila
                    </button>
                  </div>

                  <div className="admin-filas-configuracion">
                    {formularioNuevaSala
                      .filas
                      .map(
                        (
                          fila,
                          indice
                        ) => (
                          <div
                            className="admin-fila-config"
                            key={
                              indice
                            }
                          >
                            <label>
                              Fila

                              <input
                                type="text"
                                maxLength="3"
                                value={
                                  fila.fila
                                }
                                onChange={(event) =>
                                  actualizarFila(
                                    indice,
                                    'fila',
                                    event
                                      .target
                                      .value
                                  )
                                }
                                required
                              />
                            </label>

                            <label>
                              Asientos

                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={
                                  fila
                                    .cantidad
                                }
                                onChange={(event) =>
                                  actualizarFila(
                                    indice,
                                    'cantidad',
                                    event
                                      .target
                                      .value
                                  )
                                }
                                required
                              />
                            </label>

                            <button
                              type="button"
                              className="admin-fila-eliminar"
                              onClick={() =>
                                eliminarFila(
                                  indice
                                )
                              }
                              disabled={
                                formularioNuevaSala
                                  .filas
                                  .length
                                <= 1
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        )
                      )}
                  </div>
                </div>

                <div className="admin-sala-preview">
                  <div className="admin-sala-preview-cabecera">
                    <div>
                      <span>
                        VISTA PREVIA
                      </span>

                      <strong>
                        {
                          capacidadNuevaSala
                        }
                        {' asientos'}
                      </strong>
                    </div>

                    <small>
                      {
                        formularioNuevaSala
                          .filas.length
                      }
                      {' '}
                      {
                        formularioNuevaSala
                          .filas.length
                        === 1
                          ? 'fila'
                          : 'filas'
                      }
                    </small>
                  </div>

                  <div className="admin-pantalla-contenedor">
                    <div className="admin-pantalla-cine">
                      PANTALLA
                    </div>
                  </div>

                  <div className="admin-sala-preview-scroll">
                    <div className="admin-sala-preview-mapa">
                      {formularioNuevaSala
                        .filas
                        .map(
                          (
                            fila,
                            indice
                          ) => {
                            const cantidad =
                              Math.max(
                                0,
                                Number(
                                  fila
                                    .cantidad
                                )
                                || 0
                              )

                            return (
                              <div
                                className="admin-sala-preview-fila"
                                key={
                                  indice
                                }
                              >
                                <span>
                                  {
                                    fila.fila
                                    || '?'
                                  }
                                </span>

                                <div>
                                  {Array
                                    .from({
                                      length:
                                        Math.min(
                                          cantidad,
                                          50
                                        ),
                                    })
                                    .map(
                                      (
                                        _,
                                        asientoIndice
                                      ) => (
                                        <i
                                          key={
                                            asientoIndice
                                          }
                                        >
                                          {
                                            asientoIndice
                                            + 1
                                          }
                                        </i>
                                      )
                                    )}
                                </div>

                                <span>
                                  {
                                    fila.fila
                                    || '?'
                                  }
                                </span>
                              </div>
                            )
                          }
                        )}
                    </div>
                  </div>
                </div>

                <div className="admin-form-acciones">
                  <button
                    type="submit"
                    disabled={
                      creandoSala
                      || capacidadNuevaSala
                        <= 0
                    }
                  >
                    Revisar sala
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="admin-seccion">
            <div className="admin-seccion-titulo">
              <div>
                <h2>
                  Salas registradas
                </h2>

                <p>
                  {paginacion.total}
                  {' '}
                  sala(s)
                  encontrada(s).
                </p>
              </div>

              <div className="admin-filtros-salas">
                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Nombre o descripción..."
                  value={
                    busqueda
                  }
                  onChange={(event) =>
                    setBusqueda(
                      event
                        .target
                        .value
                    )
                  }
                />

                <select
                  value={
                    estadoFiltro
                  }
                  onChange={(event) =>
                    cambiarEstadoFiltro(
                      event
                        .target
                        .value
                    )
                  }
                >
                  <option value="TODOS">
                    Todos los estados
                  </option>

                  <option value="ACTIVA">
                    ACTIVA
                  </option>

                  <option value="INACTIVA">
                    INACTIVA
                  </option>

                  <option value="MANTENIMIENTO">
                    MANTENIMIENTO
                  </option>
                </select>

                {hayFiltros && (
                  <button
                    type="button"
                    className="admin-boton-secundario"
                    onClick={
                      limpiarFiltros
                    }
                    disabled={
                      cargando
                    }
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {cargando ? (
              <div className="admin-cargando admin-cargando-listado">
                <div className="cartelera-spinner" />

                <p>
                  Cargando salas...
                </p>
              </div>
            ) : salas.length
              === 0 ? (
                <div className="admin-listado-vacio">
                  <p>
                    No se encontraron
                    salas con los filtros
                    seleccionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="admin-salas-grid">
                    {salas.map(
                      (sala) => (
                        <button
                          key={
                            sala.id
                          }
                          type="button"
                          className={
                            salaSeleccionada
                              ?.id
                            === sala.id
                              ? 'admin-sala-card admin-sala-card-activa'
                              : 'admin-sala-card'
                          }
                          onClick={() =>
                            seleccionarSala(
                              sala
                            )
                          }
                        >
                          <div className="admin-sala-card-cabecera">
                            <strong>
                              {
                                sala.nombre
                              }
                            </strong>

                            <span
                              className={
                                obtenerClaseSalaEstado(
                                  sala.estado
                                )
                              }
                            >
                              {
                                sala.estado
                              }
                            </span>
                          </div>

                          <p>
                            Capacidad registrada:
                            {' '}
                            {
                              sala.capacidad
                            }
                          </p>

                          <p>
                            Asientos activos:
                            {' '}
                            {
                              sala
                                .asientos_count
                              ?? 0
                            }
                          </p>

                          {sala.descripcion && (
                            <small>
                              {
                                sala.descripcion
                              }
                            </small>
                          )}
                        </button>
                      )
                    )}
                  </div>

                  <AdminPaginacion
                    paginaActual={
                      paginacion
                        .current_page
                    }
                    ultimaPagina={
                      paginacion
                        .last_page
                    }
                    porPagina={
                      paginacion
                        .per_page
                    }
                    total={
                      paginacion
                        .total
                    }
                    desde={
                      paginacion
                        .from
                    }
                    hasta={
                      paginacion
                        .to
                    }
                    onCambiarPagina={
                      cambiarPagina
                    }
                    onCambiarPorPagina={
                      cambiarPorPagina
                    }
                    deshabilitado={
                      cargando
                    }
                  />
                </>
              )}
          </section>

          {cargandoSala && (
            <section className="admin-seccion">
              <div className="admin-cargando admin-cargando-sala">
                <div className="cartelera-spinner" />

                <p>
                  Cargando información
                  de la sala...
                </p>
              </div>
            </section>
          )}

          {salaSeleccionada
            && !cargandoSala
            && (
              <>
                <section className="admin-seccion">
                  <div className="admin-seccion-titulo">
                    <div>
                      <h2>
                        Editar sala
                      </h2>

                      <p>
                        {
                          salaSeleccionada
                            .nombre
                        }
                      </p>
                    </div>

                    <span className="admin-editando">
                      Sala #
                      {
                        salaSeleccionada.id
                      }
                    </span>
                  </div>

                  <form
                    className="admin-formulario"
                    onSubmit={
                      actualizarSala
                    }
                  >
                    <div className="admin-form-grid">
                      <label>
                        Nombre

                        <input
                          type="text"
                          name="nombre"
                          value={
                            formularioSala
                              .nombre
                          }
                          onChange={
                            manejarCambioSala
                          }
                          required
                        />
                      </label>

                      <label>
                        Estado

                        <select
                          name="estado"
                          value={
                            formularioSala
                              .estado
                          }
                          onChange={
                            manejarCambioSala
                          }
                        >
                          <option value="ACTIVA">
                            ACTIVA
                          </option>

                          <option value="INACTIVA">
                            INACTIVA
                          </option>

                          <option value="MANTENIMIENTO">
                            MANTENIMIENTO
                          </option>
                        </select>
                      </label>
                    </div>

                    <label>
                      Descripción

                      <textarea
                        name="descripcion"
                        rows="4"
                        value={
                          formularioSala
                            .descripcion
                        }
                        onChange={
                          manejarCambioSala
                        }
                      />
                    </label>

                    <div className="admin-resumen-sala">
                      <div>
                        <span>
                          Capacidad
                        </span>

                        <strong>
                          {
                            salaSeleccionada
                              .capacidad
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Asientos activos
                        </span>

                        <strong>
                          {
                            salaSeleccionada
                              .asientos_count
                            ?? 0
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Asientos totales
                        </span>

                        <strong>
                          {
                            asientos.length
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="admin-form-acciones">
                      <button
                        type="submit"
                        disabled={
                          guardandoSala
                        }
                      >
                        {guardandoSala
                          ? 'Guardando...'
                          : 'Actualizar sala'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="admin-seccion">
                  <div className="admin-seccion-titulo">
                    <div>
                      <h2>
                        Distribución de asientos
                      </h2>

                      <p>
                        Administra el tipo y
                        estado individual de
                        cada asiento.
                      </p>
                    </div>
                  </div>

                  <div className="admin-asientos-leyenda">
                    <span>
                      <i className="admin-asiento-leyenda-activo" />

                      Activo
                    </span>

                    <span>
                      <i className="admin-asiento-leyenda-inactivo" />

                      Inactivo
                    </span>
                  </div>

                  <div className="admin-pantalla-contenedor">
                    <div className="admin-pantalla-cine">
                      PANTALLA
                    </div>
                  </div>

                  <div className="admin-mapa-asientos-scroll">
                    <div className="admin-mapa-asientos">
                      {asientosPorFila.map(
                        ({
                          fila,
                          asientos:
                            filaAsientos,
                        }) => (
                          <div
                            key={
                              fila
                            }
                            className="admin-fila-asientos"
                          >
                            <span className="admin-fila-etiqueta">
                              {fila}
                            </span>

                            <div className="admin-asientos-fila">
                              {filaAsientos.map(
                                (
                                  asiento
                                ) => {
                                  const asientoProcesando =
                                    procesandoAsientoId
                                    === asiento.id

                                  return (
                                    <div
                                      key={
                                        asiento.id
                                      }
                                      className={
                                        asiento.estado
                                        === 'ACTIVO'
                                          ? 'admin-asiento-card'
                                          : 'admin-asiento-card admin-asiento-inactivo'
                                      }
                                    >
                                      <strong>
                                        {
                                          asiento.fila
                                        }
                                        {
                                          asiento.numero
                                        }
                                      </strong>

                                      <select
                                        value={
                                          asiento.tipo
                                        }
                                        disabled={
                                          asientoProcesando
                                        }
                                        onChange={(event) =>
                                          solicitarCambioTipo(
                                            asiento,
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                      >
                                        <option value="NORMAL">
                                          NORMAL
                                        </option>

                                        <option value="PREFERENCIAL">
                                          PREFERENCIAL
                                        </option>

                                        <option value="DISCAPACIDAD">
                                          DISCAPACIDAD
                                        </option>
                                      </select>

                                      <button
                                        type="button"
                                        disabled={
                                          asientoProcesando
                                        }
                                        onClick={() =>
                                          solicitarCambioEstado(
                                            asiento
                                          )
                                        }
                                      >
                                        {asientoProcesando
                                          ? '...'
                                          : asiento.estado
                                            === 'ACTIVO'
                                            ? 'Desactivar'
                                            : 'Activar'}
                                      </button>
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
        </div>
      </main>

      {confirmarNuevaSala && (
        <div
          className="confirmacion-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target
              === event.currentTarget
            ) {
              cerrarConfirmacionNuevaSala()
            }
          }}
        >
          <section
            className="confirmacion-modal admin-sala-nueva-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="confirmacion-icono confirmacion-icono-reserva">
              +
            </div>

            <span className="confirmacion-etiqueta">
              CREAR SALA
            </span>

            <h2>
              ¿Crear esta sala?
            </h2>

            <p className="confirmacion-descripcion">
              Se generará la sala junto
              con toda su distribución
              física de asientos.
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Nombre
                </span>

                <strong>
                  {
                    formularioNuevaSala
                      .nombre
                  }
                </strong>
              </div>

              <div>
                <span>
                  Filas
                </span>

                <strong>
                  {
                    formularioNuevaSala
                      .filas.length
                  }
                </strong>
              </div>

              <div>
                <span>
                  Capacidad
                </span>

                <strong className="confirmacion-total">
                  {
                    capacidadNuevaSala
                  }
                  {' asientos'}
                </strong>
              </div>

              <div>
                <span>
                  Estado
                </span>

                <strong>
                  {
                    formularioNuevaSala
                      .estado
                  }
                </strong>
              </div>
            </div>

            <div className="admin-sala-modal-filas">
              {formularioNuevaSala
                .filas
                .map(
                  (
                    fila,
                    indice
                  ) => (
                    <span
                      key={
                        indice
                      }
                    >
                      Fila
                      {' '}
                      {
                        fila.fila
                      }
                      :
                      {' '}
                      {
                        fila.cantidad
                      }
                    </span>
                  )
                )}
            </div>

            <div className="confirmacion-aviso">
              <strong>
                La capacidad se calculará automáticamente
              </strong>

              <p>
                Después de crear la sala
                podrás cambiar el tipo o
                desactivar asientos
                individualmente.
              </p>
            </div>

            <div className="confirmacion-acciones">
              <button
                type="button"
                className="confirmacion-cancelar"
                onClick={
                  cerrarConfirmacionNuevaSala
                }
                disabled={
                  creandoSala
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="confirmacion-confirmar"
                onClick={
                  crearSala
                }
                disabled={
                  creandoSala
                }
              >
                {creandoSala
                  ? 'Creando sala...'
                  : 'Crear sala'}
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmacionAsiento && (
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
            className="confirmacion-modal admin-confirmacion-modal"
            role="dialog"
            aria-modal="true"
          >
            <div
              className={
                confirmacionAsiento.tipo
                === 'ESTADO'
                && confirmacionAsiento
                  .nuevoValor
                === 'INACTIVO'
                  ? 'confirmacion-icono admin-confirmacion-icono-peligro'
                  : 'confirmacion-icono confirmacion-icono-reserva'
              }
            >
              {confirmacionAsiento.tipo
                === 'TIPO'
                  ? 'A'
                  : confirmacionAsiento
                      .nuevoValor
                    === 'INACTIVO'
                    ? '!'
                    : '✓'}
            </div>

            <span
              className={
                confirmacionAsiento.tipo
                === 'ESTADO'
                && confirmacionAsiento
                  .nuevoValor
                === 'INACTIVO'
                  ? 'confirmacion-etiqueta admin-confirmacion-etiqueta-peligro'
                  : 'confirmacion-etiqueta'
              }
            >
              {confirmacionAsiento.tipo
                === 'TIPO'
                  ? 'CAMBIAR TIPO DE ASIENTO'
                  : 'CAMBIAR ESTADO DEL ASIENTO'}
            </span>

            <h2>
              {confirmacionAsiento.tipo
                === 'TIPO'
                  ? '¿Cambiar el tipo del asiento?'
                  : confirmacionAsiento
                      .nuevoValor
                    === 'INACTIVO'
                    ? '¿Desactivar este asiento?'
                    : '¿Activar este asiento?'}
            </h2>

            <p className="confirmacion-descripcion">
              Revisa la información antes
              de confirmar el cambio.
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Asiento
                </span>

                <strong>
                  {
                    confirmacionAsiento
                      .asiento.fila
                  }
                  {
                    confirmacionAsiento
                      .asiento.numero
                  }
                </strong>
              </div>

              {confirmacionAsiento.tipo
                === 'TIPO'
                ? (
                  <>
                    <div>
                      <span>
                        Tipo actual
                      </span>

                      <strong>
                        {
                          confirmacionAsiento
                            .asiento.tipo
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Nuevo tipo
                      </span>

                      <strong className="confirmacion-total">
                        {
                          confirmacionAsiento
                            .nuevoValor
                        }
                      </strong>
                    </div>
                  </>
                )
                : (
                  <>
                    <div>
                      <span>
                        Estado actual
                      </span>

                      <strong>
                        {
                          confirmacionAsiento
                            .asiento.estado
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Nuevo estado
                      </span>

                      <strong className="confirmacion-total">
                        {
                          confirmacionAsiento
                            .nuevoValor
                        }
                      </strong>
                    </div>
                  </>
                )}
            </div>

            {confirmacionAsiento.tipo
              === 'ESTADO'
              && confirmacionAsiento
                .nuevoValor
              === 'INACTIVO'
              && (
                <div className="admin-confirmacion-advertencia">
                  <strong>
                    El asiento dejará de estar disponible
                  </strong>

                  <p>
                    Un asiento inactivo
                    no podrá utilizarse
                    en nuevas operaciones.
                  </p>
                </div>
              )}

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
                className={
                  confirmacionAsiento.tipo
                  === 'ESTADO'
                  && confirmacionAsiento
                    .nuevoValor
                  === 'INACTIVO'
                    ? 'admin-confirmacion-eliminar'
                    : 'confirmacion-confirmar'
                }
                onClick={
                  confirmarCambioAsiento
                }
                disabled={
                  procesando
                }
              >
                {procesando
                  ? 'Procesando...'
                  : 'Confirmar cambio'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminSalas