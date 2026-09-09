import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

const formularioInicial = {
  clasificacion_id: '',
  titulo: '',
  titulo_original: '',
  sinopsis: '',
  duracion_minutos: '',
  fecha_estreno: '',
  imagen_url: '',
  trailer_url: '',
  estado: 'ACTIVA',
  genero_ids: [],
}

function AdminPeliculas() {
  const [peliculas, setPeliculas] = useState([])
  const [clasificaciones, setClasificaciones] = useState([])
  const [generos, setGeneros] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [procesandoId, setProcesandoId] = useState(null)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const [peliculaEditandoId, setPeliculaEditandoId] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')

      const [
        peliculasRespuesta,
        clasificacionesRespuesta,
        generosRespuesta,
      ] = await Promise.all([
        api.get('/peliculas'),
        api.get('/clasificaciones'),
        api.get('/generos'),
      ])

      setPeliculas(
        peliculasRespuesta.data.data ?? [],
      )

      setClasificaciones(
        clasificacionesRespuesta.data.data ?? [],
      )

      setGeneros(
        generosRespuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar la información.',
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

  const manejarGenero = (generoId) => {
    setFormulario((anterior) => {
      const seleccionado =
        anterior.genero_ids.includes(generoId)

      return {
        ...anterior,
        genero_ids: seleccionado
          ? anterior.genero_ids.filter(
            (id) => id !== generoId,
          )
          : [
            ...anterior.genero_ids,
            generoId,
          ],
      }
    })
  }

  const limpiarFormulario = () => {
    setFormulario(formularioInicial)
    setPeliculaEditandoId(null)
  }

  const obtenerPrimerError = (err) => {
    const errores = err.response?.data?.errors

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

  const prepararPayload = () => ({
    clasificacion_id: Number(
      formulario.clasificacion_id,
    ),

    titulo: formulario.titulo,

    titulo_original:
      formulario.titulo_original || null,

    sinopsis: formulario.sinopsis,

    duracion_minutos: Number(
      formulario.duracion_minutos,
    ),

    fecha_estreno:
      formulario.fecha_estreno || null,

    imagen_url: formulario.imagen_url,

    trailer_url:
      formulario.trailer_url || null,

    estado: formulario.estado,

    genero_ids: formulario.genero_ids,
  })

  const guardarPelicula = async (event) => {
    event.preventDefault()

    try {
      setGuardando(true)
      limpiarMensajes()

      const payload = prepararPayload()

      if (peliculaEditandoId) {
        await api.patch(
          `/peliculas/${peliculaEditandoId}`,
          payload,
        )

        setMensaje(
          'Película actualizada correctamente.',
        )
      } else {
        await api.post(
          '/peliculas',
          payload,
        )

        setMensaje(
          'Película registrada correctamente.',
        )
      }

      limpiarFormulario()

      await cargarDatos()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(obtenerPrimerError(err))

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setGuardando(false)
    }
  }

  const editarPelicula = (pelicula) => {
    limpiarMensajes()

    setPeliculaEditandoId(pelicula.id)

    setFormulario({
      clasificacion_id:
        pelicula.clasificacion_id?.toString()
        ?? '',

      titulo:
        pelicula.titulo ?? '',

      titulo_original:
        pelicula.titulo_original ?? '',

      sinopsis:
        pelicula.sinopsis ?? '',

      duracion_minutos:
        pelicula.duracion_minutos?.toString()
        ?? '',

      fecha_estreno:
        pelicula.fecha_estreno
          ? pelicula.fecha_estreno.substring(0, 10)
          : '',

      imagen_url:
        pelicula.imagen_url ?? '',

      trailer_url:
        pelicula.trailer_url ?? '',

      estado:
        pelicula.estado ?? 'ACTIVA',

      genero_ids:
        pelicula.generos?.map(
          (genero) => genero.id,
        ) ?? [],
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const cancelarEdicion = () => {
    limpiarFormulario()
    limpiarMensajes()
  }

  const cambiarEstado = async (pelicula) => {
    const nuevoEstado =
      pelicula.estado === 'ACTIVA'
        ? 'INACTIVA'
        : 'ACTIVA'

    const confirmar = window.confirm(
      `¿Deseas cambiar "${pelicula.titulo}" a ${nuevoEstado}?`,
    )

    if (!confirmar) {
      return
    }

    try {
      setProcesandoId(pelicula.id)
      limpiarMensajes()

      await api.patch(
        `/peliculas/${pelicula.id}`,
        {
          estado: nuevoEstado,
        },
      )

      setMensaje(
        `La película fue marcada como ${nuevoEstado}.`,
      )

      await cargarDatos()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(obtenerPrimerError(err))

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setProcesandoId(null)
    }
  }

  const eliminarPelicula = async (pelicula) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar la película "${pelicula.titulo}"?`,
    )

    if (!confirmar) {
      return
    }

    try {
      setProcesandoId(pelicula.id)
      limpiarMensajes()

      await api.delete(
        `/peliculas/${pelicula.id}`,
      )

      if (
        peliculaEditandoId === pelicula.id
      ) {
        limpiarFormulario()
      }

      setMensaje(
        'Película eliminada correctamente.',
      )

      await cargarDatos()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(obtenerPrimerError(err))

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setProcesandoId(null)
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando películas...</p>
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

          <h1>Películas</h1>

          <p>
            Gestiona el catálogo de películas de
            Atlantic Cinema.
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
          <h2>
            {peliculaEditandoId
              ? 'Editar película'
              : 'Registrar película'}
          </h2>

          {peliculaEditandoId && (
            <span className="admin-editando">
              Editando registro #
              {peliculaEditandoId}
            </span>
          )}
        </div>

        <form
          className="admin-formulario"
          onSubmit={guardarPelicula}
        >
          <div className="admin-form-grid">
            <label>
              Título
              <input
                type="text"
                name="titulo"
                value={formulario.titulo}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Título original
              <input
                type="text"
                name="titulo_original"
                value={
                  formulario.titulo_original
                }
                onChange={manejarCambio}
              />
            </label>

            <label>
              Clasificación
              <select
                name="clasificacion_id"
                value={
                  formulario.clasificacion_id
                }
                onChange={manejarCambio}
                required
              >
                <option value="">
                  Seleccionar
                </option>

                {clasificaciones.map(
                  (clasificacion) => (
                    <option
                      key={clasificacion.id}
                      value={clasificacion.id}
                    >
                      {clasificacion.nombre}
                    </option>
                  ),
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
                  formulario.duracion_minutos
                }
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Fecha de estreno
              <input
                type="date"
                name="fecha_estreno"
                value={
                  formulario.fecha_estreno
                }
                onChange={manejarCambio}
              />
            </label>

            <label>
              Estado
              <select
                name="estado"
                value={formulario.estado}
                onChange={manejarCambio}
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
              value={formulario.sinopsis}
              onChange={manejarCambio}
              required
            />
          </label>

          <label>
            URL de imagen
            <input
              type="text"
              name="imagen_url"
              value={formulario.imagen_url}
              onChange={manejarCambio}
              required
            />
          </label>

          <label>
            URL de tráiler
            <input
              type="text"
              name="trailer_url"
              value={formulario.trailer_url}
              onChange={manejarCambio}
            />
          </label>

          <div className="admin-generos">
            <strong>Géneros</strong>

            <div className="admin-generos-grid">
              {generos.map((genero) => (
                <label
                  key={genero.id}
                  className="admin-genero-opcion"
                >
                  <input
                    type="checkbox"
                    checked={
                      formulario.genero_ids.includes(
                        genero.id,
                      )
                    }
                    onChange={() =>
                      manejarGenero(genero.id)
                    }
                  />

                  {genero.nombre}
                </label>
              ))}
            </div>
          </div>

          <div className="admin-form-acciones">
            <button
              type="submit"
              disabled={guardando}
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
                onClick={cancelarEdicion}
                disabled={guardando}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-seccion">
        <h2>Películas registradas</h2>

        {peliculas.length === 0 ? (
          <p>
            No hay películas registradas.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Película</th>
                  <th>Clasificación</th>
                  <th>Duración</th>
                  <th>Géneros</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {peliculas.map((pelicula) => {
                  const procesando =
                    procesandoId === pelicula.id

                  return (
                    <tr key={pelicula.id}>
                      <td>
                        <strong>
                          {pelicula.titulo}
                        </strong>

                        {pelicula.titulo_original && (
                          <small>
                            {
                              pelicula.titulo_original
                            }
                          </small>
                        )}
                      </td>

                      <td>
                        {
                          pelicula.clasificacion
                            ?.nombre
                          ?? '-'
                        }
                      </td>

                      <td>
                        {
                          pelicula.duracion_minutos
                        }{' '}
                        min
                      </td>

                      <td>
                        {pelicula.generos
                          ?.map(
                            (genero) =>
                              genero.nombre,
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
                          {pelicula.estado}
                        </span>
                      </td>

                      <td>
                        <div className="admin-tabla-acciones">
                          <button
                            type="button"
                            onClick={() =>
                              editarPelicula(
                                pelicula,
                              )
                            }
                            disabled={procesando}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstado(
                                pelicula,
                              )
                            }
                            disabled={procesando}
                          >
                            {pelicula.estado
                              === 'ACTIVA'
                              ? 'Desactivar'
                              : 'Activar'}
                          </button>

                          <button
                            type="button"
                            className="admin-boton-eliminar"
                            onClick={() =>
                              eliminarPelicula(
                                pelicula,
                              )
                            }
                            disabled={procesando}
                          >
                            {procesando
                              ? 'Procesando...'
                              : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminPeliculas