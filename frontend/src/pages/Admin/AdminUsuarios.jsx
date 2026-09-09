import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const formularioInicial = {
  rol_id: '',
  nombres: '',
  apellidos: '',
  correo: '',
  password: '',
  password_confirmation: '',
  telefono: '',
  nit: '',
  direccion: '',
  estado: 'ACTIVO',
}

function AdminUsuarios() {
  const { usuario: usuarioAutenticado } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [procesandoId, setProcesandoId] = useState(null)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const [usuarioEditandoId, setUsuarioEditandoId] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')

      const [
        usuariosRespuesta,
        rolesRespuesta,
      ] = await Promise.all([
        api.get('/usuarios'),
        api.get('/roles'),
      ])

      setUsuarios(
        usuariosRespuesta.data.data ?? [],
      )

      setRoles(
        rolesRespuesta.data.data ?? [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message
          ?? 'No fue posible cargar los usuarios.',
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
    setUsuarioEditandoId(null)
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

  const usuariosFiltrados = useMemo(() => {
    const termino =
      busqueda.trim().toLowerCase()

    if (!termino) {
      return usuarios
    }

    return usuarios.filter((usuario) => {
      const nombreCompleto =
        `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`
          .toLowerCase()

      const correo =
        (usuario.correo ?? '').toLowerCase()

      const rol =
        (usuario.rol?.nombre ?? '').toLowerCase()

      return (
        nombreCompleto.includes(termino)
        || correo.includes(termino)
        || rol.includes(termino)
      )
    })
  }, [usuarios, busqueda])

  const prepararPayload = () => {
    const payload = {
      rol_id: Number(formulario.rol_id),
      nombres: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      correo: formulario.correo.trim(),
      telefono:
        formulario.telefono.trim() || null,
      nit:
        formulario.nit.trim() || null,
      direccion:
        formulario.direccion.trim() || null,
      estado: formulario.estado,
    }

    if (
      !usuarioEditandoId
      || formulario.password
    ) {
      payload.password =
        formulario.password

      payload.password_confirmation =
        formulario.password_confirmation
    }

    return payload
  }

  const guardarUsuario = async (event) => {
    event.preventDefault()

    try {
      setGuardando(true)
      limpiarMensajes()

      const payload = prepararPayload()

      if (usuarioEditandoId) {
        await api.patch(
          `/usuarios/${usuarioEditandoId}`,
          payload,
        )

        setMensaje(
          'Usuario actualizado correctamente.',
        )
      } else {
        await api.post(
          '/usuarios',
          payload,
        )

        setMensaje(
          'Usuario creado correctamente.',
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

  const editarUsuario = (usuario) => {
    limpiarMensajes()

    setUsuarioEditandoId(usuario.id)

    setFormulario({
      rol_id:
        usuario.rol_id?.toString() ?? '',
      nombres:
        usuario.nombres ?? '',
      apellidos:
        usuario.apellidos ?? '',
      correo:
        usuario.correo ?? '',
      password: '',
      password_confirmation: '',
      telefono:
        usuario.telefono ?? '',
      nit:
        usuario.nit ?? '',
      direccion:
        usuario.direccion ?? '',
      estado:
        usuario.estado ?? 'ACTIVO',
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

  const eliminarUsuario = async (usuario) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar al usuario "${usuario.nombres} ${usuario.apellidos}"?`,
    )

    if (!confirmar) {
      return
    }

    try {
      setProcesandoId(usuario.id)
      limpiarMensajes()

      await api.delete(
        `/usuarios/${usuario.id}`,
      )

      if (
        usuarioEditandoId === usuario.id
      ) {
        limpiarFormulario()
      }

      setMensaje(
        'Usuario eliminado correctamente.',
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
      return 'Nunca'
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

  const obtenerOrigen = (usuario) => {
    if (usuario.google_id) {
      return 'Google'
    }

    return 'Correo'
  }

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'ACTIVO':
        return 'admin-estado-activo'

      case 'INACTIVO':
        return 'admin-estado-inactivo'

      case 'BLOQUEADO':
        return 'admin-estado-bloqueado'

      default:
        return ''
    }
  }

  if (cargando) {
    return (
      <div className="admin-pagina">
        <p>Cargando usuarios...</p>
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

          <h1>Usuarios</h1>

          <p>
            Administra usuarios, roles y estados
            de acceso de Atlantic Cinema.
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
            {usuarioEditandoId
              ? 'Editar usuario'
              : 'Crear usuario'}
          </h2>

          {usuarioEditandoId && (
            <span className="admin-editando">
              Editando usuario #
              {usuarioEditandoId}
            </span>
          )}
        </div>

        <form
          className="admin-formulario"
          onSubmit={guardarUsuario}
        >
          <div className="admin-form-grid">
            <label>
              Nombres
              <input
                type="text"
                name="nombres"
                value={formulario.nombres}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Apellidos
              <input
                type="text"
                name="apellidos"
                value={formulario.apellidos}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Rol
              <select
                name="rol_id"
                value={formulario.rol_id}
                onChange={manejarCambio}
                required
              >
                <option value="">
                  Seleccionar
                </option>

                {roles.map((rol) => (
                  <option
                    key={rol.id}
                    value={rol.id}
                  >
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Estado
              <select
                name="estado"
                value={formulario.estado}
                onChange={manejarCambio}
              >
                <option value="ACTIVO">
                  ACTIVO
                </option>

                <option value="INACTIVO">
                  INACTIVO
                </option>

                <option value="BLOQUEADO">
                  BLOQUEADO
                </option>
              </select>
            </label>

            <label>
              Teléfono
              <input
                type="text"
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambio}
              />
            </label>

            <label>
              NIT
              <input
                type="text"
                name="nit"
                value={formulario.nit}
                onChange={manejarCambio}
              />
            </label>

            <label>
              Dirección
              <input
                type="text"
                name="direccion"
                value={formulario.direccion}
                onChange={manejarCambio}
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                name="password"
                value={formulario.password}
                onChange={manejarCambio}
                required={!usuarioEditandoId}
              />

              {usuarioEditandoId && (
                <small>
                  Déjala vacía para conservar
                  la contraseña actual.
                </small>
              )}
            </label>

            <label>
              Confirmar contraseña
              <input
                type="password"
                name="password_confirmation"
                value={
                  formulario.password_confirmation
                }
                onChange={manejarCambio}
                required={
                  !usuarioEditandoId
                  || Boolean(formulario.password)
                }
              />
            </label>
          </div>

          <div className="admin-form-acciones">
            <button
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? 'Guardando...'
                : usuarioEditandoId
                  ? 'Actualizar usuario'
                  : 'Crear usuario'}
            </button>

            {usuarioEditandoId && (
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
        <div className="admin-seccion-titulo">
          <div>
            <h2>Usuarios registrados</h2>

            <p>
              {usuariosFiltrados.length}
              {' '}
              usuario(s) mostrado(s).
            </p>
          </div>

          <input
            className="admin-buscador"
            type="search"
            placeholder="Buscar nombre, correo o rol..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />
        </div>

        {usuariosFiltrados.length === 0 ? (
          <p>
            No se encontraron usuarios.
          </p>
        ) : (
          <div className="admin-tabla-contenedor">
            <table className="admin-tabla admin-tabla-usuarios">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Origen</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map(
                  (usuario) => {
                    const procesando =
                      procesandoId === usuario.id

                    const esActual =
                      usuarioAutenticado?.id
                      === usuario.id

                    return (
                      <tr key={usuario.id}>
                        <td>
                          <strong>
                            {usuario.nombres}
                            {' '}
                            {usuario.apellidos}
                          </strong>

                          {esActual && (
                            <small>
                              Sesión actual
                            </small>
                          )}
                        </td>

                        <td>
                          {usuario.correo}
                        </td>

                        <td>
                          {
                            usuario.rol?.nombre
                            ?? '-'
                          }
                        </td>

                        <td>
                          <span
                            className={
                              obtenerClaseEstado(
                                usuario.estado,
                              )
                            }
                          >
                            {usuario.estado}
                          </span>
                        </td>

                        <td>
                          {obtenerOrigen(
                            usuario,
                          )}
                        </td>

                        <td>
                          {formatearFecha(
                            usuario.ultimo_acceso_en,
                          )}
                        </td>

                        <td>
                          <div className="admin-tabla-acciones">
                            <button
                              type="button"
                              onClick={() =>
                                editarUsuario(
                                  usuario,
                                )
                              }
                              disabled={procesando}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="admin-boton-eliminar"
                              onClick={() =>
                                eliminarUsuario(
                                  usuario,
                                )
                              }
                              disabled={
                                procesando
                                || esActual
                              }
                              title={
                                esActual
                                  ? 'No puedes eliminar tu propia cuenta'
                                  : 'Eliminar usuario'
                              }
                            >
                              {procesando
                                ? 'Procesando...'
                                : 'Eliminar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminUsuarios