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

const formularioInicial = {
  pelicula_id: '',
  sala_id: '',
  formato_id: '',
  inicia_en: '',
  finaliza_en: '',
}

const formularioMultipleInicial = {
  pelicula_id: '',
  sala_id: '',
  formato_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  hora_inicio: '',
  hora_fin: '',
  dias: [
    2,
    3,
    4,
    5,
    6,
    7,
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

const diasSemana = [
  {
    valor: 1,
    corto: 'Lun',
    nombre: 'Lunes',
  },
  {
    valor: 2,
    corto: 'Mar',
    nombre: 'Martes',
  },
  {
    valor: 3,
    corto: 'Mié',
    nombre: 'Miércoles',
  },
  {
    valor: 4,
    corto: 'Jue',
    nombre: 'Jueves',
  },
  {
    valor: 5,
    corto: 'Vie',
    nombre: 'Viernes',
  },
  {
    valor: 6,
    corto: 'Sáb',
    nombre: 'Sábado',
  },
  {
    valor: 7,
    corto: 'Dom',
    nombre: 'Domingo',
  },
]

function AdminFunciones() {
  const [
    funciones,
    setFunciones,
  ] = useState([])

  const [
    peliculas,
    setPeliculas,
  ] = useState([])

  const [
    salas,
    setSalas,
  ] = useState([])

  const [
    formatos,
    setFormatos,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    guardando,
    setGuardando,
  ] = useState(false)

  const [
    procesandoId,
    setProcesandoId,
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
    funcionEditandoId,
    setFuncionEditandoId,
  ] = useState(null)

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioInicial
  )

  const [
    modoCreacion,
    setModoCreacion,
  ] = useState(
    'INDIVIDUAL'
  )

  const [
    formularioMultiple,
    setFormularioMultiple,
  ] = useState(
    formularioMultipleInicial
  )

  const [
    confirmarMultiples,
    setConfirmarMultiples,
  ] = useState(false)

  const [
    funcionConfirmarCancelacion,
    setFuncionConfirmarCancelacion,
  ] = useState(null)

  /*
   * Paginación y filtros.
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
    salaFiltro,
    setSalaFiltro,
  ] = useState('TODAS')

  const [
    formatoFiltro,
    setFormatoFiltro,
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
   * Catálogos activos usados
   * por los formularios.
   */
  const peliculasActivas =
    useMemo(
      () =>
        peliculas.filter(
          (pelicula) =>
            pelicula.estado
            === 'ACTIVA'
        ),
      [peliculas]
    )

  const salasActivas =
    useMemo(
      () =>
        salas.filter(
          (sala) =>
            sala.estado
            === 'ACTIVA'
        ),
      [salas]
    )

  /*
   * Carga de catálogos.
   *
   * Se ejecuta una sola vez porque
   * películas, salas y formatos no
   * necesitan recargarse después de
   * cada operación sobre funciones.
   */
  const cargarCatalogos =
    async () => {
      try {
        const [
          peliculasRespuesta,
          salasRespuesta,
          formatosRespuesta,
        ] = await Promise.all([
          api.get(
            '/peliculas'
          ),

          api.get(
            '/salas'
          ),

          api.get(
            '/formatos'
          ),
        ])

        setPeliculas(
          peliculasRespuesta
            .data.data
          ?? []
        )

        setSalas(
          salasRespuesta
            .data.data
          ?? []
        )

        setFormatos(
          formatosRespuesta
            .data.data
          ?? []
        )
      } catch (err) {
        setError(
          err.response?.data
            ?.message
          ?? 'No fue posible cargar los catálogos.'
        )
      }
    }

  /*
   * Carga paginada de funciones.
   */
  const cargarFunciones =
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

        if (
          salaFiltro
          !== 'TODAS'
        ) {
          params.sala_id =
            Number(
              salaFiltro
            )
        }

        if (
          formatoFiltro
          !== 'TODOS'
        ) {
          params.formato_id =
            Number(
              formatoFiltro
            )
        }

        const respuesta =
          await api.get(
            '/funciones',
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

        /*
         * Si una operación reduce el número
         * de páginas y la página actual deja
         * de existir, regresamos a la última
         * página válida.
         */
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

        setFunciones(
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
          ?? 'No fue posible cargar las funciones.'
        )

        setFunciones([])

        setPaginacion(
          paginacionInicial
        )
      } finally {
        setCargando(false)
      }
    }

  /*
   * Catálogos.
   */
  useEffect(() => {
    cargarCatalogos()
  }, [])

  /*
   * Debounce para la búsqueda.
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
   * Recarga cuando cambian
   * filtros o paginación.
   */
  useEffect(() => {
    cargarFunciones()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    estadoFiltro,
    salaFiltro,
    formatoFiltro,
  ])

  const limpiarMensajes =
    () => {
      setMensaje('')
      setError('')
    }

  const limpiarFormulario =
    () => {
      setFormulario(
        formularioInicial
      )

      setFuncionEditandoId(
        null
      )
    }

  const limpiarFormularioMultiple =
    () => {
      setFormularioMultiple(
        formularioMultipleInicial
      )
    }

  const manejarCambio =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setFormulario(
        (anterior) => ({
          ...anterior,
          [name]: value,
        })
      )
    }

  const manejarCambioMultiple =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setFormularioMultiple(
        (anterior) => ({
          ...anterior,
          [name]: value,
        })
      )
    }

  const alternarDia =
    (dia) => {
      setFormularioMultiple(
        (anterior) => {
          const seleccionado =
            anterior.dias.includes(
              dia
            )

          return {
            ...anterior,

            dias:
              seleccionado
                ? anterior.dias.filter(
                    (item) =>
                      item !== dia
                  )
                : [
                    ...anterior.dias,
                    dia,
                  ].sort(
                    (a, b) =>
                      a - b
                  ),
          }
        }
      )
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

  const prepararPayload =
    () => ({
      pelicula_id:
        Number(
          formulario
            .pelicula_id
        ),

      sala_id:
        Number(
          formulario
            .sala_id
        ),

      formato_id:
        Number(
          formulario
            .formato_id
        ),

      inicia_en:
        formulario
          .inicia_en,

      finaliza_en:
        formulario
          .finaliza_en,
    })

  const guardarFuncion =
    async (event) => {
      event.preventDefault()

      try {
        setGuardando(true)
        limpiarMensajes()

        const payload =
          prepararPayload()

        if (
          funcionEditandoId
        ) {
          await api.patch(
            `/funciones/${funcionEditandoId}`,
            payload
          )

          setMensaje(
            'Función actualizada correctamente.'
          )
        } else {
          await api.post(
            '/funciones',
            {
              ...payload,

              estado:
                'PROGRAMADA',
            }
          )

          setMensaje(
            'Función programada correctamente.'
          )
        }

        limpiarFormulario()

        await cargarFunciones()

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
        setGuardando(false)
      }
    }

  /*
   * Calcula las fechas que
   * produciría una creación múltiple.
   */
  const fechasVistaPrevia =
    useMemo(() => {
      const {
        fecha_inicio,
        fecha_fin,
        dias,
      } = formularioMultiple

      if (
        !fecha_inicio
        || !fecha_fin
        || dias.length === 0
      ) {
        return []
      }

      const inicio =
        new Date(
          `${fecha_inicio}T00:00:00`
        )

      const fin =
        new Date(
          `${fecha_fin}T00:00:00`
        )

      if (
        Number.isNaN(
          inicio.getTime()
        )
        || Number.isNaN(
          fin.getTime()
        )
        || inicio > fin
      ) {
        return []
      }

      const resultado = []

      const actual =
        new Date(inicio)

      while (
        actual <= fin
        && resultado.length
          <= 70
      ) {
        const diaJavascript =
          actual.getDay()

        const diaIso =
          diaJavascript === 0
            ? 7
            : diaJavascript

        if (
          dias.includes(
            diaIso
          )
        ) {
          const year =
            actual.getFullYear()

          const month =
            String(
              actual
                .getMonth()
              + 1
            ).padStart(
              2,
              '0'
            )

          const day =
            String(
              actual.getDate()
            ).padStart(
              2,
              '0'
            )

          resultado.push(
            `${year}-${month}-${day}`
          )
        }

        actual.setDate(
          actual.getDate()
          + 1
        )
      }

      return resultado
    }, [
      formularioMultiple,
    ])

  const abrirConfirmacionMultiples =
    (event) => {
      event.preventDefault()

      limpiarMensajes()

      if (
        formularioMultiple
          .dias.length === 0
      ) {
        setError(
          'Debe seleccionar al menos un día de la semana.'
        )

        return
      }

      if (
        fechasVistaPrevia
          .length === 0
      ) {
        setError(
          'No se encontraron fechas para programar con la selección actual.'
        )

        return
      }

      if (
        formularioMultiple
          .hora_fin
        <= formularioMultiple
          .hora_inicio
      ) {
        setError(
          'La hora de finalización debe ser posterior a la hora de inicio.'
        )

        return
      }

      setConfirmarMultiples(
        true
      )
    }

  const cerrarConfirmacionMultiples =
    () => {
      if (guardando) {
        return
      }

      setConfirmarMultiples(
        false
      )
    }

  const guardarFuncionesMultiples =
    async () => {
      try {
        setGuardando(true)
        limpiarMensajes()

        const response =
          await api.post(
            '/funciones/multiples',
            {
              pelicula_id:
                Number(
                  formularioMultiple
                    .pelicula_id
                ),

              sala_id:
                Number(
                  formularioMultiple
                    .sala_id
                ),

              formato_id:
                Number(
                  formularioMultiple
                    .formato_id
                ),

              fecha_inicio:
                formularioMultiple
                  .fecha_inicio,

              fecha_fin:
                formularioMultiple
                  .fecha_fin,

              hora_inicio:
                formularioMultiple
                  .hora_inicio,

              hora_fin:
                formularioMultiple
                  .hora_fin,

              dias:
                formularioMultiple
                  .dias,
            }
          )

        const cantidad =
          response.data
            ?.cantidad
          ?? fechasVistaPrevia
            .length

        setConfirmarMultiples(
          false
        )

        setMensaje(
          cantidad === 1
            ? '1 función fue programada correctamente.'
            : `${cantidad} funciones fueron programadas correctamente.`
        )

        limpiarFormularioMultiple()

        await cargarFunciones()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setConfirmarMultiples(
          false
        )

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
        setGuardando(false)
      }
    }

  const convertirFechaFormulario =
    (fecha) => {
      if (!fecha) {
        return ''
      }

      const valor =
        new Date(fecha)

      if (
        Number.isNaN(
          valor.getTime()
        )
      ) {
        return ''
      }

      const year =
        valor.getFullYear()

      const month =
        String(
          valor.getMonth() + 1
        ).padStart(
          2,
          '0'
        )

      const day =
        String(
          valor.getDate()
        ).padStart(
          2,
          '0'
        )

      const hours =
        String(
          valor.getHours()
        ).padStart(
          2,
          '0'
        )

      const minutes =
        String(
          valor.getMinutes()
        ).padStart(
          2,
          '0'
        )

      return (
        `${year}-${month}-${day}`
        + `T${hours}:${minutes}`
      )
    }

  const editarFuncion =
    (funcion) => {
      limpiarMensajes()

      setModoCreacion(
        'INDIVIDUAL'
      )

      setFuncionEditandoId(
        funcion.id
      )

      setFormulario({
        pelicula_id:
          funcion
            .pelicula_id
            ?.toString()
          ?? '',

        sala_id:
          funcion
            .sala_id
            ?.toString()
          ?? '',

        formato_id:
          funcion
            .formato_id
            ?.toString()
          ?? '',

        inicia_en:
          convertirFechaFormulario(
            funcion.inicia_en
          ),

        finaliza_en:
          convertirFechaFormulario(
            funcion.finaliza_en
          ),
      })

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

  const cancelarEdicion =
    () => {
      limpiarFormulario()
      limpiarMensajes()
    }

  const cambiarModo =
    (modo) => {
      if (
        guardando
        || funcionEditandoId
      ) {
        return
      }

      limpiarMensajes()

      setModoCreacion(
        modo
      )
    }

  const solicitarCancelarFuncion =
    (funcion) => {
      limpiarMensajes()

      setFuncionConfirmarCancelacion(
        funcion
      )
    }

  const cerrarConfirmacionCancelacion =
    () => {
      if (procesandoId) {
        return
      }

      setFuncionConfirmarCancelacion(
        null
      )
    }

  const confirmarCancelarFuncion =
    async () => {
      if (
        !funcionConfirmarCancelacion
      ) {
        return
      }

      const funcion =
        funcionConfirmarCancelacion

      try {
        setProcesandoId(
          funcion.id
        )

        limpiarMensajes()

        await api.post(
          `/funciones/${funcion.id}/cancelar`
        )

        if (
          funcionEditandoId
          === funcion.id
        ) {
          limpiarFormulario()
        }

        setFuncionConfirmarCancelacion(
          null
        )

        setMensaje(
          'Función cancelada correctamente.'
        )

        await cargarFunciones()
      } catch (err) {
        setFuncionConfirmarCancelacion(
          null
        )

        setError(
          obtenerPrimerError(
            err
          )
        )
      } finally {
        setProcesandoId(
          null
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
    }

  const cambiarSalaFiltro =
    (valor) => {
      setSalaFiltro(
        valor
      )

      setPagina(1)
    }

  const cambiarFormatoFiltro =
    (valor) => {
      setFormatoFiltro(
        valor
      )

      setPagina(1)
    }

  const cambiarPorPagina =
    (valor) => {
      setPorPagina(
        valor
      )

      setPagina(1)
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
      setSalaFiltro('TODAS')
      setFormatoFiltro('TODOS')
      setPagina(1)
    }

  const formatearFecha =
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

  const formatearSoloFecha =
    (fecha) => {
      if (!fecha) {
        return '-'
      }

      return new Intl.DateTimeFormat(
        'es-GT',
        {
          weekday:
            'short',

          day:
            'numeric',

          month:
            'short',

          year:
            'numeric',
        }
      ).format(
        new Date(
          `${fecha}T12:00:00`
        )
      )
    }

  const obtenerPrecioFormato =
    (formatoId) => {
      const formato =
        formatos.find(
          (item) =>
            item.id
            === Number(
              formatoId
            )
        )

      if (!formato) {
        return null
      }

      if (
        formato.nombre
          .toUpperCase()
        === '2D'
      ) {
        return 35
      }

      if (
        formato.nombre
          .toUpperCase()
        === '3D'
      ) {
        return 45
      }

      return null
    }

  const obtenerClaseEstado =
    (estado) => {
      switch (estado) {
        case 'PROGRAMADA':
          return (
            'admin-estado-programada'
          )

        case 'ACTIVA':
          return (
            'admin-estado-activo'
          )

        case 'FINALIZADA':
          return (
            'admin-estado-finalizado'
          )

        case 'CANCELADA':
          return (
            'admin-estado-cancelado'
          )

        default:
          return ''
      }
    }

  const obtenerNombreSeleccionado =
    (
      coleccion,
      id,
      campo = 'nombre'
    ) => {
      return (
        coleccion.find(
          (item) =>
            item.id
            === Number(id)
        )?.[campo]
        ?? '-'
      )
    }

  const precioIndividual =
    obtenerPrecioFormato(
      formulario.formato_id
    )

  const precioMultiple =
    obtenerPrecioFormato(
      formularioMultiple
        .formato_id
    )

  const procesando =
    Boolean(
      procesandoId
    )

  const hayFiltros =
    Boolean(
      busqueda
    )
    || estadoFiltro
      !== 'TODOS'
    || salaFiltro
      !== 'TODAS'
    || formatoFiltro
      !== 'TODOS'

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
                Funciones
              </h1>

              <p>
                Programa y administra
                las funciones de
                Atlantic Cinema.
              </p>
            </div>
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

          <section className="admin-seccion">
            {!funcionEditandoId && (
              <div className="funciones-modos">
                <button
                  type="button"
                  className={
                    modoCreacion
                    === 'INDIVIDUAL'
                      ? 'funciones-modo activo'
                      : 'funciones-modo'
                  }
                  onClick={() =>
                    cambiarModo(
                      'INDIVIDUAL'
                    )
                  }
                >
                  <strong>
                    Función individual
                  </strong>

                  <span>
                    Programa una sola fecha
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    modoCreacion
                    === 'MULTIPLE'
                      ? 'funciones-modo activo'
                      : 'funciones-modo'
                  }
                  onClick={() =>
                    cambiarModo(
                      'MULTIPLE'
                    )
                  }
                >
                  <strong>
                    Funciones múltiples
                  </strong>

                  <span>
                    Programa varios días
                    de una vez
                  </span>
                </button>
              </div>
            )}

            {(
              modoCreacion
              === 'INDIVIDUAL'
              || funcionEditandoId
            ) ? (
              <>
                <div className="admin-seccion-titulo">
                  <h2>
                    {funcionEditandoId
                      ? 'Editar función'
                      : 'Programar función'}
                  </h2>

                  {funcionEditandoId && (
                    <span className="admin-editando">
                      Editando función #
                      {
                        funcionEditandoId
                      }
                    </span>
                  )}
                </div>

                <form
                  className="admin-formulario"
                  onSubmit={
                    guardarFuncion
                  }
                >
                  <div className="admin-form-grid">
                    <label>
                      Película

                      <select
                        name="pelicula_id"
                        value={
                          formulario
                            .pelicula_id
                        }
                        onChange={
                          manejarCambio
                        }
                        required
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {peliculasActivas.map(
                          (pelicula) => (
                            <option
                              key={
                                pelicula.id
                              }
                              value={
                                pelicula.id
                              }
                            >
                              {
                                pelicula
                                  .titulo
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Sala

                      <select
                        name="sala_id"
                        value={
                          formulario
                            .sala_id
                        }
                        onChange={
                          manejarCambio
                        }
                        required
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {salasActivas.map(
                          (sala) => (
                            <option
                              key={
                                sala.id
                              }
                              value={
                                sala.id
                              }
                            >
                              {
                                sala.nombre
                              }
                              {' — '}
                              {
                                sala.capacidad
                              }
                              {' asientos'}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Formato

                      <select
                        name="formato_id"
                        value={
                          formulario
                            .formato_id
                        }
                        onChange={
                          manejarCambio
                        }
                        required
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {formatos.map(
                          (formato) => (
                            <option
                              key={
                                formato.id
                              }
                              value={
                                formato.id
                              }
                            >
                              {
                                formato
                                  .nombre
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <div className="admin-precio-formato">
                      <span>
                        Precio por entrada
                      </span>

                      <strong>
                        {precioIndividual
                          !== null
                          ? `Q${precioIndividual.toFixed(2)}`
                          : 'Seleccione un formato'}
                      </strong>

                      <small>
                        El precio es calculado
                        por el backend.
                      </small>
                    </div>

                    <label>
                      Inicio

                      <input
                        type="datetime-local"
                        name="inicia_en"
                        value={
                          formulario
                            .inicia_en
                        }
                        onChange={
                          manejarCambio
                        }
                        required
                      />
                    </label>

                    <label>
                      Finalización

                      <input
                        type="datetime-local"
                        name="finaliza_en"
                        value={
                          formulario
                            .finaliza_en
                        }
                        onChange={
                          manejarCambio
                        }
                        required
                      />
                    </label>
                  </div>

                  <p className="admin-ayuda">
                    La finalización debe
                    incluir todo el tiempo
                    durante el cual la sala
                    permanecerá ocupada.
                  </p>

                  <div className="admin-form-acciones">
                    <button
                      type="submit"
                      disabled={
                        guardando
                      }
                    >
                      {guardando
                        ? 'Guardando...'
                        : funcionEditandoId
                          ? 'Actualizar función'
                          : 'Programar función'}
                    </button>

                    {funcionEditandoId && (
                      <button
                        type="button"
                        className="admin-boton-secundario"
                        onClick={
                          cancelarEdicion
                        }
                        disabled={
                          guardando
                        }
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="admin-seccion-titulo">
                  <div>
                    <h2>
                      Programar funciones múltiples
                    </h2>

                    <p className="admin-ayuda">
                      Selecciona el rango,
                      horario y días de la
                      semana que se repetirán.
                    </p>
                  </div>
                </div>

                <form
                  className="admin-formulario"
                  onSubmit={
                    abrirConfirmacionMultiples
                  }
                >
                  <div className="admin-form-grid">
                    <label>
                      Película

                      <select
                        name="pelicula_id"
                        value={
                          formularioMultiple
                            .pelicula_id
                        }
                        onChange={
                          manejarCambioMultiple
                        }
                        required
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {peliculasActivas.map(
                          (pelicula) => (
                            <option
                              key={
                                pelicula.id
                              }
                              value={
                                pelicula.id
                              }
                            >
                              {
                                pelicula
                                  .titulo
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Sala

                      <select
                        name="sala_id"
                        value={
                          formularioMultiple
                            .sala_id
                        }
                        onChange={
                          manejarCambioMultiple
                        }
                        required
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {salasActivas.map(
                          (sala) => (
                            <option
                              key={
                                sala.id
                              }
                              value={
                                sala.id
                              }
                            >
                              {
                                sala.nombre
                              }
                              {' — '}
                              {
                                sala.capacidad
                              }
                              {' asientos'}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Formato

                      <select
                        name="formato_id"
                        value={
                          formularioMultiple
                            .formato_id
                        }
                        onChange={
                          manejarCambioMultiple
                        }
                        required
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {formatos.map(
                          (formato) => (
                            <option
                              key={
                                formato.id
                              }
                              value={
                                formato.id
                              }
                            >
                              {
                                formato.nombre
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <div className="admin-precio-formato">
                      <span>
                        Precio por entrada
                      </span>

                      <strong>
                        {precioMultiple
                          !== null
                          ? `Q${precioMultiple.toFixed(2)}`
                          : 'Seleccione un formato'}
                      </strong>

                      <small>
                        Todas las funciones
                        del lote usarán este
                        precio.
                      </small>
                    </div>

                    <label>
                      Desde

                      <input
                        type="date"
                        name="fecha_inicio"
                        value={
                          formularioMultiple
                            .fecha_inicio
                        }
                        onChange={
                          manejarCambioMultiple
                        }
                        required
                      />
                    </label>

                    <label>
                      Hasta

                      <input
                        type="date"
                        name="fecha_fin"
                        value={
                          formularioMultiple
                            .fecha_fin
                        }
                        onChange={
                          manejarCambioMultiple
                        }
                        required
                      />
                    </label>

                    <label>
                      Hora de inicio

                      <input
                        type="time"
                        name="hora_inicio"
                        value={
                          formularioMultiple
                            .hora_inicio
                        }
                        onChange={
                          manejarCambioMultiple
                        }
                        required
                      />
                    </label>

                    <label>
                      Hora de finalización

                      <input
                        type="time"
                        name="hora_fin"
                        value={
                          formularioMultiple
                            .hora_fin
                        }
                        onChange={
                          manejarCambioMultiple
                        }
                        required
                      />
                    </label>
                  </div>

                  <div className="funciones-dias-bloque">
                    <span className="funciones-dias-titulo">
                      Días de la semana
                    </span>

                    <div className="funciones-dias">
                      {diasSemana.map(
                        (dia) => (
                          <button
                            key={
                              dia.valor
                            }
                            type="button"
                            className={
                              formularioMultiple
                                .dias
                                .includes(
                                  dia.valor
                                )
                                ? 'funciones-dia activo'
                                : 'funciones-dia'
                            }
                            onClick={() =>
                              alternarDia(
                                dia.valor
                              )
                            }
                          >
                            {
                              dia.corto
                            }
                          </button>
                        )
                      )}
                    </div>

                    <small>
                      Atlantic Cinema puede,
                      por ejemplo, seleccionar
                      de martes a domingo para
                      repetir el mismo horario
                      durante toda la semana.
                    </small>
                  </div>

                  <div className="funciones-preview">
                    <div className="funciones-preview-cabecera">
                      <div>
                        <span>
                          VISTA PREVIA
                        </span>

                        <strong>
                          {
                            fechasVistaPrevia
                              .length
                          }
                          {' '}
                          {
                            fechasVistaPrevia
                              .length === 1
                              ? 'función'
                              : 'funciones'
                          }
                        </strong>
                      </div>

                      {formularioMultiple
                        .hora_inicio
                        && (
                          <span>
                            {
                              formularioMultiple
                                .hora_inicio
                            }
                            {' – '}
                            {
                              formularioMultiple
                                .hora_fin
                              || '--:--'
                            }
                          </span>
                        )}
                    </div>

                    {fechasVistaPrevia.length
                      > 0 ? (
                        <div className="funciones-preview-lista">
                          {fechasVistaPrevia
                            .slice(
                              0,
                              12
                            )
                            .map(
                              (fecha) => (
                                <span
                                  key={
                                    fecha
                                  }
                                >
                                  {
                                    formatearSoloFecha(
                                      fecha
                                    )
                                  }
                                </span>
                              )
                            )}

                          {fechasVistaPrevia
                            .length
                            > 12
                            && (
                              <span className="funciones-preview-mas">
                                +
                                {
                                  fechasVistaPrevia
                                    .length
                                  - 12
                                }
                                {' más'}
                              </span>
                            )}
                        </div>
                      ) : (
                        <p>
                          Completa el rango
                          y selecciona los días
                          para visualizar las
                          funciones que se
                          crearán.
                        </p>
                      )}
                  </div>

                  <div className="admin-form-acciones">
                    <button
                      type="submit"
                      disabled={
                        guardando
                        || fechasVistaPrevia
                          .length === 0
                      }
                    >
                      Revisar funciones
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>

          <section className="admin-seccion">
            <div className="admin-seccion-titulo">
              <div>
                <h2>
                  Funciones registradas
                </h2>

                <p>
                  {paginacion.total}
                  {' '}
                  función(es)
                  encontrada(s).
                </p>
              </div>

              <div className="admin-filtros-funciones">
                <div className="admin-filtros-funciones-titulo">
                  <span>
                    FILTROS
                  </span>

                  <strong>
                    Buscar funciones
                  </strong>
                </div>

                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Película, sala o formato..."
                  value={
                    busqueda
                  }
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value
                    )
                  }
                />

                <select
                  value={
                    estadoFiltro
                  }
                  onChange={(event) =>
                    cambiarEstadoFiltro(
                      event.target.value
                    )
                  }
                >
                  <option value="TODOS">
                    Todos los estados
                  </option>

                  <option value="PROGRAMADA">
                    PROGRAMADA
                  </option>

                  <option value="ACTIVA">
                    ACTIVA
                  </option>

                  <option value="FINALIZADA">
                    FINALIZADA
                  </option>

                  <option value="CANCELADA">
                    CANCELADA
                  </option>
                </select>

                <select
                  value={
                    salaFiltro
                  }
                  onChange={(event) =>
                    cambiarSalaFiltro(
                      event.target.value
                    )
                  }
                >
                  <option value="TODAS">
                    Todas las salas
                  </option>

                  {salas.map(
                    (sala) => (
                      <option
                        key={
                          sala.id
                        }
                        value={
                          sala.id
                        }
                      >
                        {
                          sala.nombre
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    formatoFiltro
                  }
                  onChange={(event) =>
                    cambiarFormatoFiltro(
                      event.target.value
                    )
                  }
                >
                  <option value="TODOS">
                    Todos los formatos
                  </option>

                  {formatos.map(
                    (formato) => (
                      <option
                        key={
                          formato.id
                        }
                        value={
                          formato.id
                        }
                      >
                        {
                          formato.nombre
                        }
                      </option>
                    )
                  )}
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
                  Cargando funciones...
                </p>
              </div>
            ) : funciones.length
              === 0 ? (
                <div className="admin-listado-vacio">
                  <p>
                    No se encontraron
                    funciones con los
                    filtros seleccionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="admin-tabla-contenedor">
                    <table className="admin-tabla admin-tabla-funciones">
                      <thead>
                        <tr>
                          <th>
                            Función
                          </th>

                          <th>
                            Sala / Formato
                          </th>

                          <th>
                            Horario
                          </th>

                          <th>
                            Precio
                          </th>

                          <th>
                            Actividad
                          </th>

                          <th>
                            Estado
                          </th>

                          <th>
                            Acciones
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {funciones.map(
                          (funcion) => {
                            const filaProcesando =
                              procesandoId
                              === funcion.id

                            const reservas =
                              Number(
                                funcion
                                  .reservas_count
                                ?? 0
                              )

                            const ventas =
                              Number(
                                funcion
                                  .ventas_count
                                ?? 0
                              )

                            const editable =
                              funcion.estado
                                === 'PROGRAMADA'
                              && reservas === 0
                              && ventas === 0

                            const cancelable =
                              funcion.estado
                                === 'PROGRAMADA'

                            return (
                              <tr
                                key={
                                  funcion.id
                                }
                              >
                                <td>
                                  <div className="funcion-tabla-pelicula">
                                    <span>
                                      #
                                      {
                                        funcion.id
                                      }
                                    </span>

                                    <strong>
                                      {
                                        funcion
                                          .pelicula
                                          ?.titulo
                                        ?? 'Sin película'
                                      }
                                    </strong>
                                  </div>
                                </td>

                                <td>
                                  <div className="funcion-tabla-sala">
                                    <strong>
                                      {
                                        funcion
                                          .sala
                                          ?.nombre
                                        ?? '-'
                                      }
                                    </strong>

                                    <span>
                                      {
                                        funcion
                                          .formato
                                          ?.nombre
                                        ?? '-'
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <div className="funcion-tabla-horario">
                                    <div>
                                      <small>
                                        INICIO
                                      </small>

                                      <span>
                                        {
                                          formatearFecha(
                                            funcion
                                              .inicia_en
                                          )
                                        }
                                      </span>
                                    </div>

                                    <div>
                                      <small>
                                        FINALIZA
                                      </small>

                                      <span>
                                        {
                                          formatearFecha(
                                            funcion
                                              .finaliza_en
                                          )
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <strong className="funcion-tabla-precio">
                                    Q
                                    {
                                      Number(
                                        funcion
                                          .precio_base
                                        ?? 0
                                      ).toFixed(
                                        2
                                      )
                                    }
                                  </strong>
                                </td>

                                <td>
                                  <div className="funcion-tabla-actividad">
                                    <div>
                                      <strong>
                                        {reservas}
                                      </strong>

                                      <span>
                                        Reservas
                                      </span>
                                    </div>

                                    <div>
                                      <strong>
                                        {ventas}
                                      </strong>

                                      <span>
                                        Ventas
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <span
                                    className={
                                      obtenerClaseEstado(
                                        funcion.estado
                                      )
                                    }
                                  >
                                    {
                                      funcion.estado
                                    }
                                  </span>
                                </td>

                                <td>
                                  <div className="admin-tabla-acciones funcion-tabla-acciones">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        editarFuncion(
                                          funcion
                                        )
                                      }
                                      disabled={
                                        filaProcesando
                                        || !editable
                                      }
                                      title={
                                        editable
                                          ? 'Editar función'
                                          : funcion.estado !== 'PROGRAMADA'
                                            ? 'Solo las funciones programadas pueden editarse.'
                                            : 'No se puede editar una función con reservas o ventas asociadas.'
                                      }
                                    >
                                      Editar
                                    </button>

                                    <button
                                      type="button"
                                      className="admin-boton-eliminar"
                                      onClick={() =>
                                        solicitarCancelarFuncion(
                                          funcion
                                        )
                                      }
                                      disabled={
                                        filaProcesando
                                        || !cancelable
                                      }
                                    >
                                      {filaProcesando
                                        ? 'Procesando...'
                                        : 'Cancelar'}
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
        </div>
      </main>

      {confirmarMultiples && (
        <div
          className="confirmacion-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target
              === event.currentTarget
            ) {
              cerrarConfirmacionMultiples()
            }
          }}
        >
          <section
            className="confirmacion-modal funciones-multiples-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="confirmacion-icono confirmacion-icono-compra">
              +
            </div>

            <span className="confirmacion-etiqueta">
              FUNCIONES MÚLTIPLES
            </span>

            <h2>
              ¿Programar estas funciones?
            </h2>

            <p className="confirmacion-descripcion">
              Se validará cada horario antes
              de guardar. Si existe un
              traslape, no se creará ninguna
              función del lote.
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Película
                </span>

                <strong>
                  {
                    obtenerNombreSeleccionado(
                      peliculas,
                      formularioMultiple
                        .pelicula_id,
                      'titulo'
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
                    obtenerNombreSeleccionado(
                      salas,
                      formularioMultiple
                        .sala_id
                    )
                  }
                </strong>
              </div>

              <div>
                <span>
                  Formato
                </span>

                <strong>
                  {
                    obtenerNombreSeleccionado(
                      formatos,
                      formularioMultiple
                        .formato_id
                    )
                  }
                </strong>
              </div>

              <div>
                <span>
                  Horario
                </span>

                <strong>
                  {
                    formularioMultiple
                      .hora_inicio
                  }
                  {' – '}
                  {
                    formularioMultiple
                      .hora_fin
                  }
                </strong>
              </div>

              <div>
                <span>
                  Cantidad
                </span>

                <strong className="confirmacion-total">
                  {
                    fechasVistaPrevia
                      .length
                  }
                  {' funciones'}
                </strong>
              </div>
            </div>

            <div className="funciones-modal-fechas">
              {fechasVistaPrevia.map(
                (fecha) => (
                  <span
                    key={fecha}
                  >
                    {
                      formatearSoloFecha(
                        fecha
                      )
                    }
                  </span>
                )
              )}
            </div>

            <div className="confirmacion-acciones">
              <button
                type="button"
                className="confirmacion-cancelar"
                onClick={
                  cerrarConfirmacionMultiples
                }
                disabled={
                  guardando
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="confirmacion-confirmar"
                onClick={
                  guardarFuncionesMultiples
                }
                disabled={
                  guardando
                }
              >
                {guardando
                  ? 'Programando...'
                  : `Crear ${fechasVistaPrevia.length} funciones`}
              </button>
            </div>
          </section>
        </div>
      )}

      {funcionConfirmarCancelacion && (
        <div
          className="confirmacion-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target
              === event.currentTarget
            ) {
              cerrarConfirmacionCancelacion()
            }
          }}
        >
          <section
            className="confirmacion-modal admin-confirmacion-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="confirmacion-icono admin-confirmacion-icono-peligro">
              !
            </div>

            <span className="confirmacion-etiqueta admin-confirmacion-etiqueta-peligro">
              CANCELAR FUNCIÓN
            </span>

            <h2>
              ¿Cancelar esta función?
            </h2>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Función
                </span>

                <strong>
                  #
                  {
                    funcionConfirmarCancelacion
                      .id
                  }
                </strong>
              </div>

              <div>
                <span>
                  Película
                </span>

                <strong>
                  {
                    funcionConfirmarCancelacion
                      .pelicula
                      ?.titulo
                    ?? '-'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Horario
                </span>

                <strong>
                  {
                    formatearFecha(
                      funcionConfirmarCancelacion
                        .inicia_en
                    )
                  }
                </strong>
              </div>
            </div>

            <div className="admin-confirmacion-advertencia">
              <strong>
                La función dejará
                de estar disponible
              </strong>

              <p>
                Ya no podrá utilizarse
                para nuevas reservas
                o compras.
              </p>
            </div>

            <div className="confirmacion-acciones">
              <button
                type="button"
                className="confirmacion-cancelar"
                onClick={
                  cerrarConfirmacionCancelacion
                }
                disabled={
                  procesando
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="admin-confirmacion-eliminar"
                onClick={
                  confirmarCancelarFuncion
                }
                disabled={
                  procesando
                }
              >
                {procesando
                  ? 'Cancelando...'
                  : 'Cancelar función'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminFunciones