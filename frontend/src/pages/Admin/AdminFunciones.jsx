import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

const formularioInicial = {
  pelicula_id: '',
  sala_id: '',
  formato_id: '',
  inicia_en: '',
  finaliza_en: '',
}

function AdminFunciones() {
  const [funciones, setFunciones] = useState([])
  const [peliculas, setPeliculas] = useState([])
  const [salas, setSalas] = useState([])
  const [formatos, setFormatos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [procesandoId, setProcesandoId] = useState(null)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const [funcionEditandoId, setFuncionEditandoId] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  const peliculasActivas = useMemo(
    () =>
      peliculas.filter(
        (pelicula) =>
          pelicula.estado === 'ACTIVA',
      ),
    [peliculas],
  )

  const salasActivas = useMemo(
    () =>
      salas.filter(
        (sala) =>
          sala.estado === 'ACTIVA',
      ),
    [salas],
  )

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')

      const [
        funcionesRespuesta,
        peliculasRespuesta,
        salasRespuesta,
        formatosRespuesta,
      ] = await Promise.all([
        api.get('/funciones'),
        api.get('/peliculas'),
        api.get('/salas'),
        api.get('/formatos'),
      ])

      setFunciones(
        funcionesRespuesta.data.data ?? [],
      )

      setPeliculas(
        peliculasRespuesta.data.data ?? [],
      )

      setSalas(
        salasRespuesta.data.data ?? [],
      )

      setFormatos(
        formatosRespuesta.data.data ?? [],
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

  const limpiarFormulario = () => {
    setFormulario(formularioInicial)
    setFuncionEditandoId(null)
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

  const prepararFechaParaBackend = (fecha) => {
    if (!fecha) {
      return null
    }

    return fecha
  }

  const prepararPayload = () => ({
    pelicula_id: Number(
      formulario.pelicula_id,
    ),

    sala_id: Number(
      formulario.sala_id,
    ),

    formato_id: Number(
      formulario.formato_id,
    ),

    inicia_en: prepararFechaParaBackend(
      formulario.inicia_en,
    ),

    finaliza_en: prepararFechaParaBackend(
      formulario.finaliza_en,
    ),
  })

  const guardarFuncion = async (event) => {
    event.preventDefault()

    try {
      setGuardando(true)
      limpiarMensajes()

      const payload = prepararPayload()

      if (funcionEditandoId) {
        await api.patch(
          `/funciones/${funcionEditandoId}`,
          payload,
        )

        setMensaje(
          'Función actualizada correctamente.',
        )
      } else {
        await api.post(
          '/funciones',
          {
            ...payload,
            estado: 'PROGRAMADA',
          },
        )

        setMensaje(
          'Función programada correctamente.',
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

  const convertirFechaFormulario = (fecha) => {
    if (!fecha) {
      return ''
    }

    const valor = new Date(fecha)

    if (Number.isNaN(valor.getTime())) {
      return ''
    }

    const year = valor.getFullYear()
    const month = String(
      valor.getMonth() + 1,
    ).padStart(2, '0')

    const day = String(
      valor.getDate(),
    ).padStart(2, '0')

    const hours = String(
      valor.getHours(),
    ).padStart(2, '0')

    const minutes = String(
      valor.getMinutes(),
    ).padStart(2, '0')

    return (
      `${year}-${month}-${day}`
      + `T${hours}:${minutes}`
    )
  }

  const editarFuncion = (funcion) => {
    limpiarMensajes()

    setFuncionEditandoId(funcion.id)

    setFormulario({
      pelicula_id:
        funcion.pelicula_id?.toString()
        ?? '',

      sala_id:
        funcion.sala_id?.toString()
        ?? '',

      formato_id:
        funcion.formato_id?.toString()
        ?? '',

      inicia_en:
        convertirFechaFormulario(
          funcion.inicia_en,
        ),

      finaliza_en:
        convertirFechaFormulario(
          funcion.finaliza_en,
        ),
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

  const cancelarFuncion = async (funcion) => {
    const confirmar = window.confirm(
      `¿Deseas cancelar la función #${funcion.id} de "${funcion.pelicula?.titulo ?? 'esta película'}"?`,
    )

    if (!confirmar) {
      return
    }

    try {
      setProcesandoId(funcion.id)
      limpiarMensajes()

      await api.post(
        `/funciones/${funcion.id}/cancelar`,
      )

      if (
        funcionEditandoId === funcion.id
      ) {
        limpiarFormulario()
      }

      setMensaje(
        'Función cancelada correctamente.',
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

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return '-'
    }

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    ).format(
      new Date(fecha),
    )
  }

  const obtenerPrecioFormato = () => {
    const formato = formatos.find(
      (item) =>
        item.id
        === Number(formulario.formato_id),
    )

    if (!formato) {
      return null
    }

    if (
      formato.nombre.toUpperCase()
      === '2D'
    ) {
      return 35
    }

    if (
      formato.nombre.toUpperCase()
      === '3D'
    ) {
      return 45
    }

    return null
  }

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'PROGRAMADA':
        return 'admin-estado-programada'

      case 'ACTIVA':
        return 'admin-estado-activo'

      case 'FINALIZADA':
        return 'admin-estado-finalizado'

      case 'CANCELADA':
        return 'admin-estado-cancelado'

      default:
        return ''
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando funciones...</p>
      </div>
    )
  }

  const precioEstimado =
    obtenerPrecioFormato()

  return (
    <div className="admin-pagina">
      <div className="admin-pagina-encabezado">
        <div>
          <p className="admin-etiqueta">
            ADMINISTRACIÓN
          </p>

          <h1>Funciones</h1>

          <p>
            Programa y administra las funciones
            de Atlantic Cinema.
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
            {funcionEditandoId
              ? 'Editar función'
              : 'Programar función'}
          </h2>

          {funcionEditandoId && (
            <span className="admin-editando">
              Editando función #
              {funcionEditandoId}
            </span>
          )}
        </div>

        <form
          className="admin-formulario"
          onSubmit={guardarFuncion}
        >
          <div className="admin-form-grid">
            <label>
              Película
              <select
                name="pelicula_id"
                value={
                  formulario.pelicula_id
                }
                onChange={manejarCambio}
                required
              >
                <option value="">
                  Seleccionar
                </option>

                {peliculasActivas.map(
                  (pelicula) => (
                    <option
                      key={pelicula.id}
                      value={pelicula.id}
                    >
                      {pelicula.titulo}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Sala
              <select
                name="sala_id"
                value={formulario.sala_id}
                onChange={manejarCambio}
                required
              >
                <option value="">
                  Seleccionar
                </option>

                {salasActivas.map(
                  (sala) => (
                    <option
                      key={sala.id}
                      value={sala.id}
                    >
                      {sala.nombre}
                      {' — '}
                      {sala.capacidad}
                      {' asientos'}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Formato
              <select
                name="formato_id"
                value={
                  formulario.formato_id
                }
                onChange={manejarCambio}
                required
              >
                <option value="">
                  Seleccionar
                </option>

                {formatos.map(
                  (formato) => (
                    <option
                      key={formato.id}
                      value={formato.id}
                    >
                      {formato.nombre}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="admin-precio-formato">
              <span>Precio por entrada</span>

              <strong>
                {precioEstimado !== null
                  ? `Q${precioEstimado.toFixed(2)}`
                  : 'Seleccione un formato'}
              </strong>

              <small>
                El precio es calculado y
                validado por el backend.
              </small>
            </div>

            <label>
              Inicio
              <input
                type="datetime-local"
                name="inicia_en"
                value={formulario.inicia_en}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Finalización
              <input
                type="datetime-local"
                name="finaliza_en"
                value={
                  formulario.finaliza_en
                }
                onChange={manejarCambio}
                required
              />
            </label>
          </div>

          <p className="admin-ayuda">
            La finalización debe incluir el
            tiempo total durante el cual la sala
            permanecerá ocupada.
          </p>

          <div className="admin-form-acciones">
            <button
              type="submit"
              disabled={guardando}
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
        <h2>Funciones registradas</h2>

        {funciones.length === 0 ? (
          <p>
            No hay funciones registradas.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-funciones">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Película</th>
                  <th>Sala</th>
                  <th>Formato</th>
                  <th>Horario</th>
                  <th>Precio</th>
                  <th>Reservas</th>
                  <th>Ventas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {funciones.map((funcion) => {
                  const procesando =
                    procesandoId
                    === funcion.id

                  const editable =
                    funcion.estado
                      === 'PROGRAMADA'
                    && Number(
                      funcion.reservas_count
                        ?? 0,
                    ) === 0
                    && Number(
                      funcion.ventas_count
                        ?? 0,
                    ) === 0

                  const cancelable =
                    funcion.estado
                      === 'PROGRAMADA'

                  return (
                    <tr key={funcion.id}>
                      <td>
                        #{funcion.id}
                      </td>

                      <td>
                        <strong>
                          {
                            funcion.pelicula
                              ?.titulo
                            ?? '-'
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          funcion.sala?.nombre
                          ?? '-'
                        }
                      </td>

                      <td>
                        {
                          funcion.formato
                            ?.nombre
                          ?? '-'
                        }
                      </td>

                      <td>
                        <small>
                          Inicio
                        </small>

                        <div>
                          {formatearFecha(
                            funcion.inicia_en,
                          )}
                        </div>

                        <small>
                          Finaliza
                        </small>

                        <div>
                          {formatearFecha(
                            funcion.finaliza_en,
                          )}
                        </div>
                      </td>

                      <td>
                        Q
                        {Number(
                          funcion.precio_base
                            ?? 0,
                        ).toFixed(2)}
                      </td>

                      <td>
                        {
                          funcion.reservas_count
                          ?? 0
                        }
                      </td>

                      <td>
                        {
                          funcion.ventas_count
                          ?? 0
                        }
                      </td>

                      <td>
                        <span
                          className={
                            obtenerClaseEstado(
                              funcion.estado,
                            )
                          }
                        >
                          {funcion.estado}
                        </span>
                      </td>

                      <td>
                        <div className="admin-tabla-acciones">
                          <button
                            type="button"
                            onClick={() =>
                              editarFuncion(
                                funcion,
                              )
                            }
                            disabled={
                              procesando
                              || !editable
                            }
                            title={
                              editable
                                ? 'Editar función'
                                : 'Solo pueden editarse funciones programadas sin reservas ni ventas'
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="admin-boton-eliminar"
                            onClick={() =>
                              cancelarFuncion(
                                funcion,
                              )
                            }
                            disabled={
                              procesando
                              || !cancelable
                            }
                          >
                            {procesando
                              ? 'Procesando...'
                              : 'Cancelar'}
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

export default AdminFunciones