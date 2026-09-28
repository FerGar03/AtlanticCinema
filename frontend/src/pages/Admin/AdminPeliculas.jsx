import {
  useEffect,
  useState,
} from 'react'

import api from '../../services/api'

import AdminSidebar
  from '../../components/Admin/AdminSidebar'

import AdminPaginacion
  from '../../components/Admin/AdminPaginacion'

const formularioInicial = {
  clasificacion_id: '',
  titulo: '',
  titulo_original: '',
  sinopsis: '',
  duracion_minutos: '',
  fecha_estreno: '',
  imagen_url: '',
  estado: 'ACTIVA',
  genero_ids: [],
}

const paginacionInicial = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0,
}

function AdminPeliculas() {
  const [
    peliculas,
    setPeliculas,
  ] = useState([])

  const [
    clasificaciones,
    setClasificaciones,
  ] = useState([])

  const [
    generos,
    setGeneros,
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
    peliculaEditandoId,
    setPeliculaEditandoId,
  ] = useState(null)

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioInicial
  )

  const [
    confirmacion,
    setConfirmacion,
  ] = useState(null)

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
    clasificacionFiltro,
    setClasificacionFiltro,
  ] = useState('TODAS')

  const [
    generoFiltro,
    setGeneroFiltro,
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

  const cargarCatalogos =
    async () => {
      try {
        const [
          clasificacionesRespuesta,
          generosRespuesta,
        ] = await Promise.all([
          api.get(
            '/clasificaciones'
          ),

          api.get(
            '/generos'
          ),
        ])

        setClasificaciones(
          clasificacionesRespuesta
            .data.data
          ?? []
        )

        setGeneros(
          generosRespuesta
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

  const cargarPeliculas =
    async () => {
      try {
        setCargando(true)
        setError('')

        const params = {
          paginar: 1,
          page: pagina,
          per_page: porPagina,
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
          clasificacionFiltro
          !== 'TODAS'
        ) {
          params.clasificacion_id =
            Number(
              clasificacionFiltro
            )
        }

        if (
          generoFiltro
          !== 'TODOS'
        ) {
          params.genero_id =
            Number(
              generoFiltro
            )
        }

        const respuesta =
          await api.get(
            '/peliculas',
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

        setPeliculas(
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
          ?? 'No fue posible cargar las películas.'
        )

        setPeliculas([])

        setPaginacion(
          paginacionInicial
        )
      } finally {
        setCargando(false)
      }
    }

  useEffect(() => {
    cargarCatalogos()
  }, [])

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

  useEffect(() => {
    cargarPeliculas()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    estadoFiltro,
    clasificacionFiltro,
    generoFiltro,
  ])

  const limpiarMensajes =
    () => {
      setMensaje('')
      setError('')
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

  const manejarGenero =
    (generoId) => {
      setFormulario(
        (anterior) => {
          const seleccionado =
            anterior
              .genero_ids
              .includes(
                generoId
              )

          return {
            ...anterior,

            genero_ids:
              seleccionado
                ? anterior
                    .genero_ids
                    .filter(
                      (id) =>
                        id
                        !== generoId
                    )
                : [
                    ...anterior
                      .genero_ids,
                    generoId,
                  ],
          }
        }
      )
    }

  const limpiarFormulario =
    () => {
      setFormulario(
        formularioInicial
      )

      setPeliculaEditandoId(
        null
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
      clasificacion_id:
        Number(
          formulario
            .clasificacion_id
        ),

      titulo:
        formulario
          .titulo,

      titulo_original:
        formulario
          .titulo_original
        || null,

      sinopsis:
        formulario
          .sinopsis,

      duracion_minutos:
        Number(
          formulario
            .duracion_minutos
        ),

      fecha_estreno:
        formulario
          .fecha_estreno
        || null,

      imagen_url:
        formulario
          .imagen_url,

      estado:
        formulario
          .estado,

      genero_ids:
        formulario
          .genero_ids,
    })

  const guardarPelicula =
    async (event) => {
      event.preventDefault()

      try {
        setGuardando(true)
        limpiarMensajes()

        const payload =
          prepararPayload()

        if (
          peliculaEditandoId
        ) {
          await api.patch(
            `/peliculas/${peliculaEditandoId}`,
            payload
          )

          setMensaje(
            'Película actualizada correctamente.'
          )
        } else {
          await api.post(
            '/peliculas',
            payload
          )

          setMensaje(
            'Película registrada correctamente.'
          )
        }

        limpiarFormulario()

        await cargarPeliculas()

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
        setGuardando(false)
      }
    }

  const editarPelicula =
    (pelicula) => {
      limpiarMensajes()

      setPeliculaEditandoId(
        pelicula.id
      )

      setFormulario({
        clasificacion_id:
          pelicula
            .clasificacion_id
            ?.toString()
          ?? '',

        titulo:
          pelicula.titulo
          ?? '',

        titulo_original:
          pelicula
            .titulo_original
          ?? '',

        sinopsis:
          pelicula.sinopsis
          ?? '',

        duracion_minutos:
          pelicula
            .duracion_minutos
            ?.toString()
          ?? '',

        fecha_estreno:
          pelicula.fecha_estreno
            ? pelicula
                .fecha_estreno
                .substring(
                  0,
                  10
                )
            : '',

        imagen_url:
          pelicula.imagen_url
          ?? '',

        estado:
          pelicula.estado
          ?? 'ACTIVA',

        genero_ids:
          pelicula.generos
            ?.map(
              (genero) =>
                genero.id
            )
          ?? [],
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

  const solicitarCambioEstado =
    (pelicula) => {
      const nuevoEstado =
        pelicula.estado
        === 'ACTIVA'
          ? 'INACTIVA'
          : 'ACTIVA'

      setConfirmacion({
        tipo: 'ESTADO',
        pelicula,
        nuevoEstado,
      })
    }

  const solicitarEliminar =
    (pelicula) => {
      setConfirmacion({
        tipo: 'ELIMINAR',
        pelicula,
      })
    }

  const cerrarConfirmacion =
    () => {
      if (procesandoId) {
        return
      }

      setConfirmacion(null)
    }

  const confirmarAccion =
    async () => {
      if (!confirmacion) {
        return
      }

      const pelicula =
        confirmacion.pelicula

      try {
        setProcesandoId(
          pelicula.id
        )

        limpiarMensajes()

        if (
          confirmacion.tipo
          === 'ESTADO'
        ) {
          await api.patch(
            `/peliculas/${pelicula.id}`,
            {
              estado:
                confirmacion
                  .nuevoEstado,
            }
          )

          setMensaje(
            `La película fue marcada como ${confirmacion.nuevoEstado}.`
          )
        }

        if (
          confirmacion.tipo
          === 'ELIMINAR'
        ) {
          await api.delete(
            `/peliculas/${pelicula.id}`
          )

          if (
            peliculaEditandoId
            === pelicula.id
          ) {
            limpiarFormulario()
          }

          setMensaje(
            'Película eliminada correctamente.'
          )
        }

        setConfirmacion(null)

        await cargarPeliculas()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setConfirmacion(null)

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
        setProcesandoId(null)
      }
    }

  const cambiarEstadoFiltro =
    (valor) => {
      setEstadoFiltro(
        valor
      )

      setPagina(1)
    }

  const cambiarClasificacionFiltro =
    (valor) => {
      setClasificacionFiltro(
        valor
      )

      setPagina(1)
    }

  const cambiarGeneroFiltro =
    (valor) => {
      setGeneroFiltro(
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

      setClasificacionFiltro(
        'TODAS'
      )

      setGeneroFiltro(
        'TODOS'
      )

      setPagina(1)
    }

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
    || clasificacionFiltro
      !== 'TODAS'
    || generoFiltro
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
                Películas
              </h1>

              <p>
                Gestiona el catálogo de
                películas de Atlantic
                Cinema.
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
            <div className="admin-seccion-titulo">
              <div>
                <p className="admin-etiqueta">
                  CATÁLOGO
                </p>

                <h2>
                  {peliculaEditandoId
                    ? 'Editar película'
                    : 'Registrar película'}
                </h2>

                <p className="admin-seccion-descripcion">
                  {peliculaEditandoId
                    ? 'Actualiza la información de la película seleccionada.'
                    : 'Completa los datos principales que aparecerán en la cartelera.'}
                </p>
              </div>

              {peliculaEditandoId && (
                <span className="admin-editando">
                  Editando registro #
                  {peliculaEditandoId}
                </span>
              )}
            </div>

            <form
              className="admin-formulario"
              onSubmit={
                guardarPelicula
              }
            >
              <div className="admin-form-grid">
                <label>
                  <span className="admin-campo-etiqueta">
                    Título para cartelera
                  </span>

                  <span className="admin-campo-ayuda">
                    Nombre que verá el cliente
                    en la cartelera.
                  </span>

                  <input
                    type="text"
                    name="titulo"
                    value={
                      formulario.titulo
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Ej. Intensamente 2"
                    required
                  />
                </label>

                <label>
                  <span className="admin-campo-etiqueta">
                    Título original
                    (opcional)
                  </span>

                  <span className="admin-campo-ayuda">
                    Título oficial en su
                    distribución o idioma
                    original.
                  </span>

                  <input
                    type="text"
                    name="titulo_original"
                    value={
                      formulario
                        .titulo_original
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Ej. Inside Out 2"
                  />
                </label>

                <label>
                  Clasificación

                  <select
                    name="clasificacion_id"
                    value={
                      formulario
                        .clasificacion_id
                    }
                    onChange={
                      manejarCambio
                    }
                    required
                  >
                    <option value="">
                      Seleccionar
                    </option>

                    {clasificaciones.map(
                      (
                        clasificacion
                      ) => (
                        <option
                          key={
                            clasificacion.id
                          }
                          value={
                            clasificacion.id
                          }
                        >
                          {
                            clasificacion
                              .nombre
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Duración en minutos

                  <input
                    type="number"
                    min="1"
                    name="duracion_minutos"
                    value={
                      formulario
                        .duracion_minutos
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Ej. 120"
                    required
                  />
                </label>

                <label>
                  Fecha de estreno

                  <input
                    type="date"
                    name="fecha_estreno"
                    value={
                      formulario
                        .fecha_estreno
                    }
                    onChange={
                      manejarCambio
                    }
                  />
                </label>

                <label>
                  Estado

                  <select
                    name="estado"
                    value={
                      formulario.estado
                    }
                    onChange={
                      manejarCambio
                    }
                  >
                    <option value="ACTIVA">
                      ACTIVA
                    </option>

                    <option value="INACTIVA">
                      INACTIVA
                    </option>
                  </select>
                </label>
              </div>

              <label>
                Sinopsis

                <textarea
                  name="sinopsis"
                  rows="5"
                  value={
                    formulario.sinopsis
                  }
                  onChange={
                    manejarCambio
                  }
                  placeholder="Escribe una breve descripción de la película..."
                  required
                />
              </label>

              <div className="admin-pelicula-imagen-editor">
                <label className="admin-pelicula-imagen-campo">
                  <span className="admin-campo-etiqueta">
                    Imagen de portada
                  </span>

                  <span className="admin-campo-ayuda">
                    Ingresa una URL pública
                    de la imagen utilizada
                    en la cartelera.
                  </span>

                  <input
                    type="text"
                    name="imagen_url"
                    value={
                      formulario.imagen_url
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="https://..."
                    required
                  />
                </label>

                <div className="admin-pelicula-preview">
                  {formulario.imagen_url ? (
                    <>
                      <div className="admin-pelicula-preview-placeholder">
                        <strong>
                          Vista previa
                        </strong>

                        <span>
                          Si la URL es válida,
                          la portada aparecerá aquí.
                        </span>
                      </div>

                      <img
                        src={
                          formulario.imagen_url
                        }
                        alt="Vista previa de la película"
                        onError={(
                          event
                        ) => {
                          event.currentTarget
                            .style.display =
                            'none'
                        }}
                        onLoad={(
                          event
                        ) => {
                          event.currentTarget
                            .style.display =
                            'block'
                        }}
                      />
                    </>
                  ) : (
                    <div className="admin-pelicula-preview-vacio">
                      <strong>
                        Sin portada
                      </strong>

                      <span>
                        Agrega una URL para
                        previsualizar la imagen.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-generos">
                <strong>
                  Géneros
                </strong>

                <p className="admin-seccion-descripcion">
                  Selecciona uno o varios
                  géneros asociados a la
                  película.
                </p>

                <div className="admin-generos-grid">
                  {generos.map(
                    (genero) => {
                      const seleccionado =
                        formulario
                          .genero_ids
                          .includes(
                            genero.id
                          )

                      return (
                        <label
                          key={
                            genero.id
                          }
                          className={`admin-genero-opcion ${
                            seleccionado
                              ? 'admin-genero-opcion-seleccionada'
                              : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              seleccionado
                            }
                            onChange={() =>
                              manejarGenero(
                                genero.id
                              )
                            }
                          />

                          {genero.nombre}
                        </label>
                      )
                    }
                  )}
                </div>
              </div>

              <div className="admin-form-acciones">
                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                >
                  {guardando
                    ? 'Guardando...'
                    : peliculaEditandoId
                      ? 'Actualizar película'
                      : 'Registrar película'}
                </button>

                {peliculaEditandoId && (
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
          </section>

          <section className="admin-seccion">
            <div className="admin-seccion-titulo">
              <div>
                <p className="admin-etiqueta">
                  CATÁLOGO
                </p>

                <h2>
                  Películas registradas
                </h2>

                <p>
                  {paginacion.total}
                  {' '}
                  película(s)
                  encontrada(s).
                </p>
              </div>
            </div>

            <div className="admin-filtros-peliculas-final">
              <div className="admin-filtros-peliculas-titulo">
                <span>
                  FILTROS
                </span>

                <strong>
                  Buscar en el catálogo
                </strong>
              </div>

              <input
                className="admin-buscador"
                type="search"
                placeholder="Título, género, clasificación..."
                value={
                  busqueda
                }
                onChange={(
                  event
                ) =>
                  setBusqueda(
                    event.target.value
                  )
                }
              />

              <select
                value={
                  estadoFiltro
                }
                onChange={(
                  event
                ) =>
                  cambiarEstadoFiltro(
                    event.target.value
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
              </select>

              <select
                value={
                  clasificacionFiltro
                }
                onChange={(
                  event
                ) =>
                  cambiarClasificacionFiltro(
                    event.target.value
                  )
                }
              >
                <option value="TODAS">
                  Todas las clasificaciones
                </option>

                {clasificaciones.map(
                  (
                    clasificacion
                  ) => (
                    <option
                      key={
                        clasificacion.id
                      }
                      value={
                        clasificacion.id
                      }
                    >
                      {
                        clasificacion
                          .nombre
                      }
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  generoFiltro
                }
                onChange={(
                  event
                ) =>
                  cambiarGeneroFiltro(
                    event.target.value
                  )
                }
              >
                <option value="TODOS">
                  Todos los géneros
                </option>

                {generos.map(
                  (genero) => (
                    <option
                      key={
                        genero.id
                      }
                      value={
                        genero.id
                      }
                    >
                      {genero.nombre}
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

            {cargando ? (
              <div className="admin-cargando admin-cargando-listado">
                <div className="cartelera-spinner" />

                <p>
                  Cargando películas...
                </p>
              </div>
            ) : peliculas.length
              === 0 ? (
                <div className="admin-listado-vacio">
                  <p>
                    No se encontraron
                    películas con los
                    filtros seleccionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="admin-tabla-contenedor">
                    <table className="admin-tabla">
                      <thead>
                        <tr>
                          <th>
                            Película
                          </th>

                          <th>
                            Clasificación
                          </th>

                          <th>
                            Duración
                          </th>

                          <th>
                            Géneros
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
                        {peliculas.map(
                          (pelicula) => {
                            const filaProcesando =
                              procesandoId
                              === pelicula.id

                            return (
                              <tr
                                key={
                                  pelicula.id
                                }
                              >
                                <td>
                                  <div className="admin-pelicula-tabla-info">
                                    <div className="admin-pelicula-miniatura">
                                      <span>
                                        AC
                                      </span>

                                      {pelicula.imagen_url && (
                                        <img
                                          src={
                                            pelicula.imagen_url
                                          }
                                          alt=""
                                          onError={(
                                            event
                                          ) => {
                                            event.currentTarget
                                              .style.display =
                                              'none'
                                          }}
                                        />
                                      )}
                                    </div>

                                    <div>
                                      <strong>
                                        {
                                          pelicula
                                            .titulo
                                        }
                                      </strong>

                                      {pelicula
                                        .titulo_original
                                        && (
                                          <small>
                                            {
                                              pelicula
                                                .titulo_original
                                            }
                                          </small>
                                        )}
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  {
                                    pelicula
                                      .clasificacion
                                      ?.nombre
                                    ?? '-'
                                  }
                                </td>

                                <td>
                                  {
                                    pelicula
                                      .duracion_minutos
                                  }
                                  {' min'}
                                </td>

                                <td>
                                  {pelicula
                                    .generos
                                    ?.map(
                                      (
                                        genero
                                      ) =>
                                        genero
                                          .nombre
                                    )
                                    .join(', ')
                                  || '-'}
                                </td>

                                <td>
                                  <span
                                    className={
                                      pelicula.estado
                                      === 'ACTIVA'
                                        ? 'admin-estado-activo'
                                        : 'admin-estado-inactivo'
                                    }
                                  >
                                    {
                                      pelicula
                                        .estado
                                    }
                                  </span>
                                </td>

                                <td>
                                  <div className="admin-tabla-acciones">
                                    <button
                                      type="button"
                                      className="admin-accion-editar"
                                      onClick={() =>
                                        editarPelicula(
                                          pelicula
                                        )
                                      }
                                      disabled={
                                        filaProcesando
                                      }
                                    >
                                      Editar
                                    </button>

                                    <button
                                      type="button"
                                      className="admin-accion-estado"
                                      onClick={() =>
                                        solicitarCambioEstado(
                                          pelicula
                                        )
                                      }
                                      disabled={
                                        filaProcesando
                                      }
                                    >
                                      {
                                        pelicula
                                          .estado
                                        === 'ACTIVA'
                                          ? 'Desactivar'
                                          : 'Activar'
                                      }
                                    </button>

                                    <button
                                      type="button"
                                      className="admin-boton-eliminar"
                                      onClick={() =>
                                        solicitarEliminar(
                                          pelicula
                                        )
                                      }
                                      disabled={
                                        filaProcesando
                                      }
                                    >
                                      {filaProcesando
                                        ? 'Procesando...'
                                        : 'Eliminar'}
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

      {confirmacion && (
        <div
          className="confirmacion-overlay"
          role="presentation"
          onMouseDown={(
            event
          ) => {
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
                confirmacion.tipo
                === 'ELIMINAR'
                  ? 'confirmacion-icono admin-confirmacion-icono-peligro'
                  : 'confirmacion-icono confirmacion-icono-reserva'
              }
            >
              {confirmacion.tipo
                === 'ELIMINAR'
                  ? '!'
                  : '✓'}
            </div>

            <span
              className={
                confirmacion.tipo
                === 'ELIMINAR'
                  ? 'confirmacion-etiqueta admin-confirmacion-etiqueta-peligro'
                  : 'confirmacion-etiqueta'
              }
            >
              {confirmacion.tipo
                === 'ELIMINAR'
                  ? 'ELIMINAR PELÍCULA'
                  : 'CAMBIAR ESTADO'}
            </span>

            <h2>
              {confirmacion.tipo
                === 'ELIMINAR'
                  ? '¿Eliminar esta película?'
                  : `¿Cambiar a ${confirmacion.nuevoEstado}?`}
            </h2>

            <p className="confirmacion-descripcion">
              {confirmacion.tipo
                === 'ELIMINAR'
                  ? 'Esta acción eliminará la película del catálogo administrativo.'
                  : 'Confirma el cambio de estado antes de continuar.'}
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Película
                </span>

                <strong>
                  {
                    confirmacion
                      .pelicula
                      .titulo
                  }
                </strong>
              </div>

              {confirmacion.tipo
                === 'ESTADO'
                && (
                  <>
                    <div>
                      <span>
                        Estado actual
                      </span>

                      <strong>
                        {
                          confirmacion
                            .pelicula
                            .estado
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Nuevo estado
                      </span>

                      <strong className="confirmacion-total">
                        {
                          confirmacion
                            .nuevoEstado
                        }
                      </strong>
                    </div>
                  </>
                )}
            </div>

            {confirmacion.tipo
              === 'ELIMINAR'
              && (
                <div className="admin-confirmacion-advertencia">
                  <strong>
                    Acción delicada
                  </strong>

                  <p>
                    Verifica que realmente
                    deseas eliminar este
                    registro antes de
                    continuar.
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
                  confirmacion.tipo
                  === 'ELIMINAR'
                    ? 'admin-confirmacion-eliminar'
                    : 'confirmacion-confirmar'
                }
                onClick={
                  confirmarAccion
                }
                disabled={
                  procesando
                }
              >
                {procesando
                  ? 'Procesando...'
                  : confirmacion.tipo
                    === 'ELIMINAR'
                      ? 'Eliminar película'
                      : 'Confirmar cambio'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminPeliculas