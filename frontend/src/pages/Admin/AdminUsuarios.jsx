import {
  useEffect,
  useState,
} from 'react'

import {
  useAuth,
} from '../../context/AuthContext'

import api from '../../services/api'

import AdminSidebar
  from '../../components/Admin/AdminSidebar'

import AdminPaginacion
  from '../../components/Admin/AdminPaginacion'

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

const paginacionInicial = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0,
}

function AdminUsuarios() {
  const {
    usuario:
      usuarioAutenticado,
  } = useAuth()

  const [
    usuarios,
    setUsuarios,
  ] = useState([])

  const [
    roles,
    setRoles,
  ] = useState([])

  const [
    busqueda,
    setBusqueda,
  ] = useState('')

  const [
    busquedaAplicada,
    setBusquedaAplicada,
  ] = useState('')

  const [
    rolFiltro,
    setRolFiltro,
  ] = useState('TODOS')

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState('TODOS')

  const [
    origenFiltro,
    setOrigenFiltro,
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
    usuarioEditandoId,
    setUsuarioEditandoId,
  ] = useState(null)

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioInicial
  )

  const [
    usuarioConfirmarEliminacion,
    setUsuarioConfirmarEliminacion,
  ] = useState(null)

  useEffect(() => {
    const cargarRoles =
      async () => {
        try {
          const respuesta =
            await api.get(
              '/roles'
            )

          setRoles(
            respuesta.data.data
            ?? []
          )
        } catch (err) {
          setError(
            err.response?.data
              ?.message
            ?? 'No fue posible cargar los roles.'
          )
        }
      }

    cargarRoles()
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

  const cargarUsuarios =
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
          rolFiltro
          !== 'TODOS'
        ) {
          params.rol_id =
            Number(
              rolFiltro
            )
        }

        if (
          estadoFiltro
          !== 'TODOS'
        ) {
          params.estado =
            estadoFiltro
        }

        if (
          origenFiltro
          !== 'TODOS'
        ) {
          params.origen =
            origenFiltro
        }

        const respuesta =
          await api.get(
            '/usuarios',
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

        setUsuarios(
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
          ?? 'No fue posible cargar los usuarios.'
        )

        setUsuarios([])

        setPaginacion(
          paginacionInicial
        )
      } finally {
        setCargando(false)
      }
    }

  useEffect(() => {
    cargarUsuarios()
  }, [
    pagina,
    porPagina,
    busquedaAplicada,
    rolFiltro,
    estadoFiltro,
    origenFiltro,
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

      setUsuarioEditandoId(
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

  const manejarCambio =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setFormulario(
        (anterior) => ({
          ...anterior,
          [name]:
            value,
        })
      )
    }

  const cambiarRolFiltro =
    (valor) => {
      setRolFiltro(
        valor
      )

      setPagina(1)
    }

  const cambiarEstadoFiltro =
    (valor) => {
      setEstadoFiltro(
        valor
      )

      setPagina(1)
    }

  const cambiarOrigenFiltro =
    (valor) => {
      setOrigenFiltro(
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
      setRolFiltro('TODOS')
      setEstadoFiltro('TODOS')
      setOrigenFiltro('TODOS')
      setPagina(1)
    }

  const prepararPayload =
    () => {
      const payload = {
        rol_id:
          Number(
            formulario
              .rol_id
          ),

        nombres:
          formulario
            .nombres
            .trim(),

        apellidos:
          formulario
            .apellidos
            .trim(),

        correo:
          formulario
            .correo
            .trim(),

        telefono:
          formulario
            .telefono
            .trim()
          || null,

        nit:
          formulario
            .nit
            .trim()
          || null,

        direccion:
          formulario
            .direccion
            .trim()
          || null,

        estado:
          formulario
            .estado,
      }

      if (
        !usuarioEditandoId
        || formulario.password
      ) {
        payload.password =
          formulario.password

        payload.password_confirmation =
          formulario
            .password_confirmation
      }

      return payload
    }

  const guardarUsuario =
    async (event) => {
      event.preventDefault()

      try {
        setGuardando(true)
        limpiarMensajes()

        const payload =
          prepararPayload()

        if (
          usuarioEditandoId
        ) {
          await api.patch(
            `/usuarios/${usuarioEditandoId}`,
            payload
          )

          setMensaje(
            'Usuario actualizado correctamente.'
          )
        } else {
          await api.post(
            '/usuarios',
            payload
          )

          setMensaje(
            'Usuario creado correctamente.'
          )
        }

        limpiarFormulario()

        await cargarUsuarios()

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

  const editarUsuario =
    (usuario) => {
      limpiarMensajes()

      setUsuarioEditandoId(
        usuario.id
      )

      setFormulario({
        rol_id:
          usuario.rol_id
            ?.toString()
          ?? '',

        nombres:
          usuario.nombres
          ?? '',

        apellidos:
          usuario.apellidos
          ?? '',

        correo:
          usuario.correo
          ?? '',

        password:
          '',

        password_confirmation:
          '',

        telefono:
          usuario.telefono
          ?? '',

        nit:
          usuario.nit
          ?? '',

        direccion:
          usuario.direccion
          ?? '',

        estado:
          usuario.estado
          ?? 'ACTIVO',
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

  const solicitarEliminarUsuario =
    (usuario) => {
      limpiarMensajes()

      setUsuarioConfirmarEliminacion(
        usuario
      )
    }

  const cerrarConfirmacion =
    () => {
      if (procesandoId) {
        return
      }

      setUsuarioConfirmarEliminacion(
        null
      )
    }

  const confirmarEliminarUsuario =
    async () => {
      if (
        !usuarioConfirmarEliminacion
      ) {
        return
      }

      const usuario =
        usuarioConfirmarEliminacion

      try {
        setProcesandoId(
          usuario.id
        )

        limpiarMensajes()

        await api.delete(
          `/usuarios/${usuario.id}`
        )

        if (
          usuarioEditandoId
          === usuario.id
        ) {
          limpiarFormulario()
        }

        setUsuarioConfirmarEliminacion(
          null
        )

        setMensaje(
          'Usuario eliminado correctamente.'
        )

        await cargarUsuarios()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      } catch (err) {
        setUsuarioConfirmarEliminacion(
          null
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
        setProcesandoId(
          null
        )
      }
    }

  const formatearFecha =
    (fecha) => {
      if (!fecha) {
        return 'Nunca'
      }

      return new Intl.DateTimeFormat(
        'es-GT',
        {
          timeZone:
            'America/Guatemala',

          day:
            '2-digit',

          month:
            '2-digit',

          year:
            'numeric',

          hour:
            '2-digit',

          minute:
            '2-digit',
        }
      ).format(
        new Date(fecha)
      )
    }

  const obtenerOrigen =
    (usuario) => {
      if (
        usuario.google_id
      ) {
        return 'Google'
      }

      return 'Correo'
    }

  const obtenerClaseEstado =
    (estado) => {
      switch (estado) {
        case 'ACTIVO':
          return (
            'admin-estado-activo'
          )

        case 'INACTIVO':
          return (
            'admin-estado-inactivo'
          )

        case 'BLOQUEADO':
          return (
            'admin-estado-bloqueado'
          )

        default:
          return ''
      }
    }

  const procesando =
    Boolean(
      procesandoId
    )

  const hayFiltros =
    Boolean(
      busqueda
    )
    || rolFiltro !== 'TODOS'
    || estadoFiltro !== 'TODOS'
    || origenFiltro !== 'TODOS'

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
                Usuarios
              </h1>

              <p>
                Administra usuarios,
                roles y estados de
                acceso de Atlantic
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
              <h2>
                {usuarioEditandoId
                  ? 'Editar usuario'
                  : 'Crear usuario'}
              </h2>

              {usuarioEditandoId && (
                <span className="admin-editando">
                  Editando usuario #
                  {
                    usuarioEditandoId
                  }
                </span>
              )}
            </div>

            <form
              className="admin-formulario"
              onSubmit={
                guardarUsuario
              }
            >
              <div className="admin-usuario-form-bloque">
                <div className="admin-usuario-form-cabecera">
                  <span>
                    INFORMACIÓN PERSONAL
                  </span>

                  <strong>
                    Datos del usuario
                  </strong>

                  <p>
                    Información general asociada a la cuenta.
                    Teléfono, NIT y dirección son opcionales.
                  </p>
                </div>

                <div className="admin-form-grid">
                  <label>
                    Nombres

                    <input
                      type="text"
                      name="nombres"
                      value={
                        formulario
                          .nombres
                      }
                      onChange={
                        manejarCambio
                      }
                      required
                    />
                  </label>

                  <label>
                    Apellidos

                    <input
                      type="text"
                      name="apellidos"
                      value={
                        formulario
                          .apellidos
                      }
                      onChange={
                        manejarCambio
                      }
                      required
                    />
                  </label>

                  <label>
                    Teléfono

                    <input
                      type="text"
                      name="telefono"
                      value={
                        formulario
                          .telefono
                      }
                      onChange={
                        manejarCambio
                      }
                      placeholder="Ej. 5555 5555"
                    />
                  </label>

                  <label>
                    NIT

                    <input
                      type="text"
                      name="nit"
                      value={
                        formulario
                          .nit
                      }
                      onChange={
                        manejarCambio
                      }
                      placeholder="Ej. 1234567-8 o CF"
                    />
                  </label>

                  <label className="admin-usuario-campo-completo">
                    Dirección

                    <input
                      type="text"
                      name="direccion"
                      value={
                        formulario
                          .direccion
                      }
                      onChange={
                        manejarCambio
                      }
                      placeholder="Dirección de residencia"
                    />
                  </label>
                </div>
              </div>

              <div className="admin-usuario-form-bloque">
                <div className="admin-usuario-form-cabecera">
                  <span>
                    ACCESO Y SEGURIDAD
                  </span>

                  <strong>
                    Credenciales y permisos
                  </strong>

                  <p>
                    Define el correo de acceso, rol, estado y contraseña de la cuenta.
                  </p>
                </div>

                <div className="admin-form-grid">
                  <label>
                    Correo electrónico

                    <input
                      type="email"
                      name="correo"
                      value={
                        formulario
                          .correo
                      }
                      onChange={
                        manejarCambio
                      }
                      autoComplete="email"
                      required
                    />

                    <small className="admin-campo-ayuda">
                      Se utiliza como identificador de acceso al sistema.
                    </small>
                  </label>

                  <label>
                    Rol

                    <select
                      name="rol_id"
                      value={
                        formulario
                          .rol_id
                      }
                      onChange={
                        manejarCambio
                      }
                      required
                    >
                      <option value="">
                        Seleccionar
                      </option>

                      {roles.map(
                        (rol) => (
                          <option
                            key={
                              rol.id
                            }
                            value={
                              rol.id
                            }
                          >
                            {rol.nombre}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Estado

                    <select
                      name="estado"
                      value={
                        formulario
                          .estado
                      }
                      onChange={
                        manejarCambio
                      }
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

                  <div className="admin-usuario-form-espacio" />

                  <label>
                    Contraseña

                    <input
                      type="password"
                      name="password"
                      value={
                        formulario
                          .password
                      }
                      onChange={
                        manejarCambio
                      }
                      autoComplete="new-password"
                      required={
                        !usuarioEditandoId
                      }
                    />

                    <small className="admin-campo-ayuda">
                      Mínimo 8 caracteres, una mayúscula,
                      una minúscula y un número.
                    </small>

                    {usuarioEditandoId && (
                      <small className="admin-campo-ayuda">
                        Déjala vacía para conservar la contraseña actual.
                      </small>
                    )}
                  </label>

                  <label>
                    Confirmar contraseña

                    <input
                      type="password"
                      name="password_confirmation"
                      value={
                        formulario
                          .password_confirmation
                      }
                      onChange={
                        manejarCambio
                      }
                      autoComplete="new-password"
                      required={
                        !usuarioEditandoId
                        || Boolean(
                          formulario.password
                        )
                      }
                    />
                  </label>
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
                    : usuarioEditandoId
                      ? 'Actualizar usuario'
                      : 'Crear usuario'}
                </button>

                {usuarioEditandoId && (
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
                <h2>
                  Usuarios registrados
                </h2>

                <p>
                  {paginacion.total}
                  {' '}
                  usuario(s)
                  encontrado(s).
                </p>
              </div>

              <div className="admin-filtros-usuarios">
                <div className="admin-filtros-usuarios-titulo">
                  <span>
                    FILTROS
                  </span>

                  <strong>
                    Buscar usuarios
                  </strong>
                </div>

                <input
                  className="admin-buscador"
                  type="search"
                  placeholder="Nombre, correo, rol..."
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
                    rolFiltro
                  }
                  onChange={(event) =>
                    cambiarRolFiltro(
                      event.target.value
                    )
                  }
                >
                  <option value="TODOS">
                    Todos los roles
                  </option>

                  {roles.map(
                    (rol) => (
                      <option
                        key={
                          rol.id
                        }
                        value={
                          rol.id
                        }
                      >
                        {rol.nombre}
                      </option>
                    )
                  )}
                </select>

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

                <select
                  value={
                    origenFiltro
                  }
                  onChange={(event) =>
                    cambiarOrigenFiltro(
                      event.target.value
                    )
                  }
                >
                  <option value="TODOS">
                    Todos los orígenes
                  </option>

                  <option value="CORREO">
                    Correo
                  </option>

                  <option value="GOOGLE">
                    Google
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
                  Cargando usuarios...
                </p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="admin-listado-vacio">
                <p>
                  No se encontraron usuarios con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-tabla-contenedor">
                  <table className="admin-tabla admin-tabla-usuarios">
                    <thead>
                      <tr>
                        <th>
                          Usuario
                        </th>

                        <th>
                          Correo
                        </th>

                        <th>
                          Rol
                        </th>

                        <th>
                          Estado
                        </th>

                        <th>
                          Origen
                        </th>

                        <th>
                          Último acceso
                        </th>

                        <th>
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {usuarios.map(
                        (usuario) => {
                          const filaProcesando =
                            procesandoId
                            === usuario.id

                          const esActual =
                            usuarioAutenticado?.id
                            === usuario.id

                          return (
                            <tr
                              key={
                                usuario.id
                              }
                            >
                              <td>
                                <div className="usuario-tabla-identidad">
                                  <strong>
                                    {usuario.nombres}
                                    {' '}
                                    {usuario.apellidos}
                                  </strong>

                                  <span>
                                    Usuario #
                                    {usuario.id}
                                  </span>

                                  {esActual && (
                                    <small>
                                      Sesión actual
                                    </small>
                                  )}
                                </div>
                              </td>

                              <td>
                                <span className="usuario-tabla-correo">
                                  {usuario.correo}
                                </span>
                              </td>

                              <td>
                                <span className="usuario-tabla-rol">
                                  {
                                    usuario.rol
                                      ?.nombre
                                    ?? '-'
                                  }
                                </span>
                              </td>

                              <td>
                                <span
                                  className={
                                    obtenerClaseEstado(
                                      usuario.estado
                                    )
                                  }
                                >
                                  {usuario.estado}
                                </span>
                              </td>

                              <td>
                                <span className="usuario-tabla-origen">
                                  {
                                    obtenerOrigen(
                                      usuario
                                    )
                                  }
                                </span>
                              </td>

                              <td>
                                <span className="usuario-tabla-fecha">
                                  {
                                    formatearFecha(
                                      usuario
                                        .ultimo_acceso_en
                                    )
                                  }
                                </span>
                              </td>

                              <td>
                                <div className="admin-tabla-acciones usuario-tabla-acciones">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      editarUsuario(
                                        usuario
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
                                    className="admin-boton-eliminar"
                                    onClick={() =>
                                      solicitarEliminarUsuario(
                                        usuario
                                      )
                                    }
                                    disabled={
                                      filaProcesando
                                      || esActual
                                    }
                                    title={
                                      esActual
                                        ? 'No puedes eliminar tu propia cuenta'
                                        : 'Eliminar usuario'
                                    }
                                  >
                                    {
                                      filaProcesando
                                        ? 'Procesando...'
                                        : 'Eliminar'
                                    }
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

      {usuarioConfirmarEliminacion && (
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
            aria-labelledby="eliminar-usuario-titulo"
          >
            <div className="confirmacion-icono admin-confirmacion-icono-peligro">
              !
            </div>

            <span className="confirmacion-etiqueta admin-confirmacion-etiqueta-peligro">
              ELIMINAR USUARIO
            </span>

            <h2 id="eliminar-usuario-titulo">
              ¿Eliminar este usuario?
            </h2>

            <p className="confirmacion-descripcion">
              Revisa los datos antes de confirmar la eliminación.
            </p>

            <div className="confirmacion-resumen">
              <div>
                <span>
                  Usuario
                </span>

                <strong>
                  {
                    usuarioConfirmarEliminacion
                      .nombres
                  }
                  {' '}
                  {
                    usuarioConfirmarEliminacion
                      .apellidos
                  }
                </strong>
              </div>

              <div>
                <span>
                  Correo
                </span>

                <strong>
                  {
                    usuarioConfirmarEliminacion
                      .correo
                  }
                </strong>
              </div>

              <div>
                <span>
                  Rol
                </span>

                <strong>
                  {
                    usuarioConfirmarEliminacion
                      .rol
                      ?.nombre
                    ?? 'No disponible'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Estado
                </span>

                <strong>
                  {
                    usuarioConfirmarEliminacion
                      .estado
                  }
                </strong>
              </div>
            </div>

            <div className="admin-confirmacion-advertencia">
              <strong>
                Acción delicada
              </strong>

              <p>
                El usuario dejará de estar disponible en el sistema.
                Verifica que realmente deseas continuar.
              </p>
            </div>

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
                className="admin-confirmacion-eliminar"
                onClick={
                  confirmarEliminarUsuario
                }
                disabled={
                  procesando
                }
              >
                {
                  procesando
                    ? 'Eliminando...'
                    : 'Eliminar usuario'
                }
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminUsuarios