import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../../services/api'

function AdminSalas() {
  const [salas, setSalas] = useState([])
  const [salaSeleccionada, setSalaSeleccionada] =
    useState(null)

  const [asientos, setAsientos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [cargandoSala, setCargandoSala] =
    useState(false)

  const [guardandoSala, setGuardandoSala] =
    useState(false)

  const [procesandoAsientoId, setProcesandoAsientoId] =
    useState(null)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const [formularioSala, setFormularioSala] =
    useState({
      nombre: '',
      descripcion: '',
      estado: 'ACTIVA',
    })

  const cargarSalas = async () => {
    try {
      setCargando(true)
      setError('')

      const respuesta =
        await api.get('/salas')

      setSalas(
        respuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar las salas.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarSalas()
  }, [])

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
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

  const seleccionarSala = async (sala) => {
    try {
      limpiarMensajes()
      setCargandoSala(true)

      const [
        salaRespuesta,
        asientosRespuesta,
      ] = await Promise.all([
        api.get(`/salas/${sala.id}`),
        api.get(`/salas/${sala.id}/asientos`),
      ])

      const salaCompleta =
        salaRespuesta.data.data

      setSalaSeleccionada(
        salaCompleta,
      )

      setAsientos(
        asientosRespuesta.data.data ?? [],
      )

      setFormularioSala({
        nombre:
          salaCompleta.nombre ?? '',

        descripcion:
          salaCompleta.descripcion ?? '',

        estado:
          salaCompleta.estado ?? 'ACTIVA',
      })

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(obtenerPrimerError(err))
    } finally {
      setCargandoSala(false)
    }
  }

  const manejarCambioSala = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormularioSala((anterior) => ({
      ...anterior,
      [name]: value,
    }))
  }

  const actualizarSala = async (event) => {
    event.preventDefault()

    if (!salaSeleccionada) {
      return
    }

    try {
      setGuardandoSala(true)
      limpiarMensajes()

      await api.patch(
        `/salas/${salaSeleccionada.id}`,
        {
          nombre:
            formularioSala.nombre,

          descripcion:
            formularioSala.descripcion || null,

          estado:
            formularioSala.estado,
        },
      )

      setMensaje(
        'Sala actualizada correctamente.',
      )

      await cargarSalas()

      await seleccionarSala({
        id: salaSeleccionada.id,
      })

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
      setGuardandoSala(false)
    }
  }

  const actualizarAsiento = async (
    asiento,
    datos,
  ) => {
    try {
      setProcesandoAsientoId(
        asiento.id,
      )

      limpiarMensajes()

      await api.patch(
        `/asientos/${asiento.id}`,
        datos,
      )

      setMensaje(
        `Asiento ${asiento.fila}${asiento.numero} actualizado correctamente.`,
      )

      const salaId =
        salaSeleccionada.id

      const [
        salaRespuesta,
        asientosRespuesta,
      ] = await Promise.all([
        api.get(`/salas/${salaId}`),
        api.get(`/salas/${salaId}/asientos`),
      ])

      setSalaSeleccionada(
        salaRespuesta.data.data,
      )

      setAsientos(
        asientosRespuesta.data.data ?? [],
      )

      await cargarSalas()
    } catch (err) {
      setError(obtenerPrimerError(err))
    } finally {
      setProcesandoAsientoId(null)
    }
  }

  const cambiarEstadoAsiento = (
    asiento,
  ) => {
    const nuevoEstado =
      asiento.estado === 'ACTIVO'
        ? 'INACTIVO'
        : 'ACTIVO'

    const confirmar = window.confirm(
      `¿Deseas cambiar el asiento ${asiento.fila}${asiento.numero} a ${nuevoEstado}?`,
    )

    if (!confirmar) {
      return
    }

    actualizarAsiento(
      asiento,
      {
        estado: nuevoEstado,
      },
    )
  }

  const cambiarTipoAsiento = (
    asiento,
    nuevoTipo,
  ) => {
    actualizarAsiento(
      asiento,
      {
        tipo: nuevoTipo,
      },
    )
  }

  const asientosPorFila = useMemo(
    () => {
      const agrupados = {}

      for (const asiento of asientos) {
        if (!agrupados[asiento.fila]) {
          agrupados[asiento.fila] = []
        }

        agrupados[asiento.fila].push(
          asiento,
        )
      }

      return Object.entries(agrupados)
        .sort(([filaA], [filaB]) =>
          filaA.localeCompare(filaB),
        )
        .map(([fila, lista]) => ({
          fila,
          asientos: [...lista].sort(
            (a, b) =>
              a.numero - b.numero,
          ),
        }))
    },
    [asientos],
  )

  const obtenerClaseSalaEstado = (
    estado,
  ) => {
    switch (estado) {
      case 'ACTIVA':
        return 'admin-estado-activo'

      case 'INACTIVA':
        return 'admin-estado-inactivo'

      case 'MANTENIMIENTO':
        return 'admin-estado-mantenimiento'

      default:
        return ''
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando salas...</p>
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

          <h1>Salas y asientos</h1>

          <p>
            Consulta y administra las salas
            físicas de Atlantic Cinema.
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
        <h2>Salas registradas</h2>

        {salas.length === 0 ? (
          <p>
            No hay salas registradas.
          </p>
        ) : (
          <div className="admin-salas-grid">
            {salas.map((sala) => (
              <button
                key={sala.id}
                type="button"
                className={
                  salaSeleccionada?.id
                    === sala.id
                    ? 'admin-sala-card admin-sala-card-activa'
                    : 'admin-sala-card'
                }
                onClick={() =>
                  seleccionarSala(sala)
                }
              >
                <div className="admin-sala-card-cabecera">
                  <strong>
                    {sala.nombre}
                  </strong>

                  <span
                    className={
                      obtenerClaseSalaEstado(
                        sala.estado,
                      )
                    }
                  >
                    {sala.estado}
                  </span>
                </div>

                <p>
                  Capacidad registrada:
                  {' '}
                  {sala.capacidad}
                </p>

                <p>
                  Asientos activos:
                  {' '}
                  {sala.asientos_count ?? 0}
                </p>

                {sala.descripcion && (
                  <small>
                    {sala.descripcion}
                  </small>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {cargandoSala && (
        <section className="admin-seccion">
          <p>
            Cargando información de la sala...
          </p>
        </section>
      )}

      {salaSeleccionada && !cargandoSala && (
        <>
          <section className="admin-seccion">
            <div className="admin-seccion-titulo">
              <div>
                <h2>
                  Editar sala
                </h2>

                <p>
                  {
                    salaSeleccionada.nombre
                  }
                </p>
              </div>

              <span className="admin-editando">
                Sala #
                {salaSeleccionada.id}
              </span>
            </div>

            <form
              className="admin-formulario"
              onSubmit={actualizarSala}
            >
              <div className="admin-form-grid">
                <label>
                  Nombre
                  <input
                    type="text"
                    name="nombre"
                    value={
                      formularioSala.nombre
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
                      formularioSala.estado
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
                    formularioSala.descripcion
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
                      salaSeleccionada.capacidad
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Asientos activos
                  </span>

                  <strong>
                    {
                      salaSeleccionada.asientos_count
                      ?? 0
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Asientos totales
                  </span>

                  <strong>
                    {asientos.length}
                  </strong>
                </div>
              </div>

              <div className="admin-form-acciones">
                <button
                  type="submit"
                  disabled={guardandoSala}
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
                  Selecciona un asiento para
                  administrar su tipo o estado.
                </p>
              </div>
            </div>

            <div className="admin-pantalla-cine">
              PANTALLA
            </div>

            <div className="admin-mapa-asientos">
              {asientosPorFila.map(
                ({
                  fila,
                  asientos: filaAsientos,
                }) => (
                  <div
                    key={fila}
                    className="admin-fila-asientos"
                  >
                    <span className="admin-fila-etiqueta">
                      {fila}
                    </span>

                    <div className="admin-asientos-fila">
                      {filaAsientos.map(
                        (asiento) => {
                          const procesando =
                            procesandoAsientoId
                            === asiento.id

                          return (
                            <div
                              key={asiento.id}
                              className={
                                asiento.estado
                                  === 'ACTIVO'
                                  ? 'admin-asiento-card'
                                  : 'admin-asiento-card admin-asiento-inactivo'
                              }
                            >
                              <strong>
                                {asiento.fila}
                                {asiento.numero}
                              </strong>

                              <select
                                value={
                                  asiento.tipo
                                }
                                disabled={
                                  procesando
                                }
                                onChange={(event) =>
                                  cambiarTipoAsiento(
                                    asiento,
                                    event.target.value,
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
                                  procesando
                                }
                                onClick={() =>
                                  cambiarEstadoAsiento(
                                    asiento,
                                  )
                                }
                              >
                                {procesando
                                  ? '...'
                                  : asiento.estado
                                    === 'ACTIVO'
                                    ? 'Desactivar'
                                    : 'Activar'}
                              </button>
                            </div>
                          )
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default AdminSalas