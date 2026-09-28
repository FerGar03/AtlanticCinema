import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'

function TaquillaReservas() {
  const { usuario } =
    useAuth()

  const [
    reservas,
    setReservas,
  ] = useState([])

  const [
    busqueda,
    setBusqueda,
  ] = useState('')

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState('TODOS')

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    const cargarReservas =
      async () => {
        try {
          setError('')

          const response =
            await api.get(
              '/reservas'
            )

          const data =
            response.data.data
            ?? response.data

          setReservas(
            Array.isArray(data)
              ? data
              : []
          )
        } catch (err) {
          setError(
            err.response?.data
              ?.message
            || 'No fue posible cargar las reservas.'
          )
        } finally {
          setCargando(false)
        }
      }

    cargarReservas()
  }, [])

  const formatearMonto = (
    valor
  ) => {
    return `Q${Number(
      valor ?? 0
    ).toFixed(2)}`
  }

  const formatearFecha = (
    fecha
  ) => {
    if (!fecha) {
      return 'No disponible'
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
      new Date(fecha)
    )
  }

  const obtenerNombreCliente = (
    reserva
  ) => {
    const nombre =
      [
        reserva.usuario
          ?.nombres,
        reserva.usuario
          ?.apellidos,
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

    return nombre
      || 'Sin cliente'
  }

  const obtenerAsientos = (
    reserva
  ) => {
    if (
      !Array.isArray(
        reserva.detalles
      )
    ) {
      return []
    }

    return reserva.detalles
      .map(
        (detalle) => {
          const asiento =
            detalle.funcion_asiento
              ?.asiento
            ?? detalle.funcionAsiento
              ?.asiento

          if (!asiento) {
            return null
          }

          return `${asiento.fila}${asiento.numero}`
        }
      )
      .filter(Boolean)
  }

  const obtenerTextoEstado = (
    estado
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente'

      case 'VENCIDA':
      case 'EXPIRADA':
        return 'Vencida'

      case 'CANCELADA':
        return 'Cancelada'

      case 'CONVERTIDA':
        return 'Confirmada'

      default:
        return estado
    }
  }

  const obtenerClaseEstado = (
    estado
  ) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'taquilla-estado taquilla-estado-pendiente'

      case 'CONVERTIDA':
        return 'taquilla-estado taquilla-estado-confirmada'

      case 'CANCELADA':
        return 'taquilla-estado taquilla-estado-cancelada'

      case 'VENCIDA':
      case 'EXPIRADA':
        return 'taquilla-estado taquilla-estado-vencida'

      default:
        return 'taquilla-estado'
    }
  }

  const reservasFiltradas =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toUpperCase()

      return reservas.filter(
        (reserva) => {
          if (
            estadoFiltro
              !== 'TODOS'
            && reserva.estado
              !== estadoFiltro
          ) {
            return false
          }

          if (!termino) {
            return true
          }

          const codigo =
            String(
              reserva.codigo
              ?? ''
            ).toUpperCase()

          const nombreCliente =
            obtenerNombreCliente(
              reserva
            ).toUpperCase()

          const pelicula =
            String(
              reserva.funcion
                ?.pelicula
                ?.titulo
              ?? ''
            ).toUpperCase()

          return (
            codigo.includes(
              termino
            )
            || nombreCliente
              .includes(termino)
            || pelicula
              .includes(termino)
          )
        }
      )
    }, [
      reservas,
      busqueda,
      estadoFiltro,
    ])

  const resumenEstados =
    useMemo(() => {
      return {
        total:
          reservas.length,

        pendientes:
          reservas.filter(
            (reserva) =>
              reserva.estado
              === 'PENDIENTE'
          ).length,

        confirmadas:
          reservas.filter(
            (reserva) =>
              reserva.estado
              === 'CONVERTIDA'
          ).length,

        vencidas:
          reservas.filter(
            (reserva) =>
              reserva.estado
              === 'VENCIDA'
              || reserva.estado
              === 'EXPIRADA'
          ).length,
      }
    }, [reservas])

  if (cargando) {
    return (
      <main className="taquilla-reservas-pagina">
        <div className="taquilla-cargando">
          <div className="cartelera-spinner" />

          <p>
            Cargando reservas...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="taquilla-reservas-pagina">
      <header className="taquilla-navbar">
        <Link
          to="/"
          className="taquilla-marca"
        >
          <img
            src={logoAtlantic}
            alt="Atlantic Cinema"
            className="taquilla-logo taquilla-logo-imagen"
          />

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <span>
              Taquilla
            </span>
          </div>
        </Link>

        <nav className="funcion-nav">
          <Link
            to="/perfil"
            className="taquilla-volver"
          >
            Mi perfil
          </Link>

          <Link
            to="/"
            className="taquilla-volver"
          >
            ← Volver a cartelera
          </Link>
        </nav>
      </header>

      <div className="taquilla-reservas-contenido">
        <section className="taquilla-listado-encabezado">
          <div>
            <p className="taquilla-etiqueta">
              TAQUILLA
            </p>

            <h1>
              Reservas
            </h1>

            <p>
              Busca una reserva y atiende
              al cliente desde este panel.
            </p>

            <div className="taquilla-accesos">
              <Link
                to="/taquilla/venta"
                className="taquilla-acceso"
              >
                Venta presencial
              </Link>

              <Link
                to="/taquilla/reservas"
                className="taquilla-acceso taquilla-acceso-activo"
              >
                Reservas
              </Link>

              <Link
                to="/taquilla/tickets"
                className="taquilla-acceso"
              >
                Validar tickets
              </Link>
            </div>
          </div>

          <div className="taquilla-empleado">
            <span>
              SESIÓN ACTIVA
            </span>

            <strong>
              {usuario?.nombres}
              {' '}
              {usuario?.apellidos}
            </strong>

            <small>
              {
                usuario?.rol
                  ?.nombre
                ?? '-'
              }
            </small>
          </div>
        </section>

        <section className="taquilla-resumen-estados">
          <article>
            <span>
              Reservas
            </span>

            <strong>
              {
                resumenEstados
                  .total
              }
            </strong>
          </article>

          <article>
            <span>
              Pendientes
            </span>

            <strong className="taquilla-contador-pendiente">
              {
                resumenEstados
                  .pendientes
              }
            </strong>
          </article>

          <article>
            <span>
              Confirmadas
            </span>

            <strong className="taquilla-contador-confirmada">
              {
                resumenEstados
                  .confirmadas
              }
            </strong>
          </article>

          <article>
            <span>
              Vencidas
            </span>

            <strong>
              {
                resumenEstados
                  .vencidas
              }
            </strong>
          </article>
        </section>

        <section className="taquilla-buscador-panel">
          <div className="taquilla-buscador-texto">
            <span>
              BUSCAR RESERVA
            </span>

            <h2>
              Localizar cliente
            </h2>

            <p>
              Puedes buscar por código de
              reserva, nombre del cliente
              o película.
            </p>
          </div>

          <div className="taquilla-buscador-controles">
            <input
              id="buscar-reserva"
              type="search"
              value={busqueda}
              onChange={
                (event) =>
                  setBusqueda(
                    event.target
                      .value
                  )
              }
              placeholder="Código, cliente o película..."
            />

            <select
              value={
                estadoFiltro
              }
              onChange={
                (event) =>
                  setEstadoFiltro(
                    event.target
                      .value
                  )
              }
            >
              <option value="TODOS">
                Todos los estados
              </option>

              <option value="PENDIENTE">
                Pendientes
              </option>

              <option value="CONVERTIDA">
                Confirmadas
              </option>

              <option value="CANCELADA">
                Canceladas
              </option>

              <option value="VENCIDA">
                Vencidas
              </option>
            </select>
          </div>
        </section>

        {error && (
          <div className="taquilla-mensaje-error">
            {error}
          </div>
        )}

        {!error && (
          <section className="taquilla-reservas-listado">
            <div className="taquilla-listado-titulo">
              <div>
                <h2>
                  Reservas encontradas
                </h2>

                <p>
                  {
                    reservasFiltradas
                      .length
                  }
                  {' '}
                  resultado(s).
                </p>
              </div>
            </div>

            {reservasFiltradas
              .length
              === 0 ? (
                <div className="taquilla-vacio">
                  <strong>
                    No se encontraron
                    reservas
                  </strong>

                  <p>
                    Intenta modificar el
                    código, nombre del
                    cliente o filtro de
                    estado.
                  </p>
                </div>
              ) : (
                <div className="taquilla-tabla-contenedor">
                  <table className="taquilla-tabla-reservas">
                    <thead>
                      <tr>
                        <th>
                          Reserva
                        </th>

                        <th>
                          Cliente
                        </th>

                        <th>
                          Función
                        </th>

                        <th>
                          Asientos
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Estado
                        </th>

                        <th>
                          Vence
                        </th>

                        <th>
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {reservasFiltradas.map(
                        (reserva) => {
                          const asientos =
                            obtenerAsientos(
                              reserva
                            )

                          return (
                            <tr
                              key={
                                reserva.id
                              }
                            >
                              <td>
                                <div className="taquilla-tabla-codigo">
                                  <strong>
                                    {
                                      reserva
                                        .codigo
                                    }
                                  </strong>

                                  <span>
                                    ID #
                                    {
                                      reserva
                                        .id
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="taquilla-tabla-cliente">
                                  <strong>
                                    {
                                      obtenerNombreCliente(
                                        reserva
                                      )
                                    }
                                  </strong>

                                  <span>
                                    {
                                      reserva
                                        .usuario
                                        ?.correo
                                      ?? '-'
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="taquilla-tabla-funcion">
                                  <strong>
                                    {
                                      reserva
                                        .funcion
                                        ?.pelicula
                                        ?.titulo
                                      ?? 'No disponible'
                                    }
                                  </strong>

                                  <span>
                                    {
                                      reserva
                                        .funcion
                                        ?.sala
                                        ?.nombre
                                      ?? '-'
                                    }
                                    {' · '}
                                    {
                                      reserva
                                        .funcion
                                        ?.formato
                                        ?.nombre
                                      ?? '-'
                                    }
                                  </span>

                                  <small>
                                    {
                                      formatearFecha(
                                        reserva
                                          .funcion
                                          ?.inicia_en
                                      )
                                    }
                                  </small>
                                </div>
                              </td>

                              <td>
                                <div className="taquilla-tabla-asientos">
                                  {asientos.length
                                    > 0 ? (
                                      asientos.map(
                                        (
                                          asiento
                                        ) => (
                                          <span
                                            key={
                                              asiento
                                            }
                                          >
                                            {
                                              asiento
                                            }
                                          </span>
                                        )
                                      )
                                    ) : (
                                      <small>
                                        -
                                      </small>
                                    )}
                                </div>
                              </td>

                              <td>
                                <strong className="taquilla-tabla-total">
                                  {
                                    formatearMonto(
                                      reserva
                                        .total
                                    )
                                  }
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={
                                    obtenerClaseEstado(
                                      reserva
                                        .estado
                                    )
                                  }
                                >
                                  {
                                    obtenerTextoEstado(
                                      reserva
                                        .estado
                                    )
                                  }
                                </span>
                              </td>

                              <td>
                                <span className="taquilla-tabla-fecha">
                                  {
                                    formatearFecha(
                                      reserva
                                        .expira_en
                                    )
                                  }
                                </span>
                              </td>

                              <td>
                                <Link
                                  to={
                                    `/taquilla/reservas/${reserva.id}`
                                  }
                                  className="taquilla-atender"
                                >
                                  {reserva.estado
                                  === 'PENDIENTE'
                                    ? 'Atender'
                                    : 'Ver detalle'}
                                </Link>
                              </td>
                            </tr>
                          )
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        )}
      </div>
    </main>
  )
}

export default TaquillaReservas
