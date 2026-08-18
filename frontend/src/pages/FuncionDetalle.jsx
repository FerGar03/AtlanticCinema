import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function FuncionDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { autenticado } = useAuth()

  const [funcion, setFuncion] = useState(null)
  const [seleccionados, setSeleccionados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [creandoReserva, setCreandoReserva] = useState(false)
  const [creandoCompra, setCreandoCompra] = useState(false)
  const [error, setError] = useState('')

  const cargarFuncion = useCallback(async () => {
    try {
      const response = await api.get(
        `/funciones/${id}`,
      )

      const data =
        response.data.data ?? response.data

      setFuncion(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No fue posible cargar la información de la función.',
      )
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    cargarFuncion()
  }, [cargarFuncion])

  const asientos = useMemo(() => {
    if (!funcion) {
      return []
    }

    return (
      funcion.funcion_asientos ??
      funcion.asientos ??
      []
    )
  }, [funcion])

  const filas = useMemo(() => {
    const agrupadas = {}

    asientos.forEach((funcionAsiento) => {
      const asiento = funcionAsiento.asiento

      if (!asiento) {
        return
      }

      const fila = asiento.fila

      if (!agrupadas[fila]) {
        agrupadas[fila] = []
      }

      agrupadas[fila].push(funcionAsiento)
    })

    Object.values(agrupadas).forEach((fila) => {
      fila.sort((a, b) => {
        const numeroA =
          Number(a.asiento?.numero)

        const numeroB =
          Number(b.asiento?.numero)

        if (
          !Number.isNaN(numeroA) &&
          !Number.isNaN(numeroB)
        ) {
          return numeroA - numeroB
        }

        return String(
          a.asiento?.numero,
        ).localeCompare(
          String(b.asiento?.numero),
          undefined,
          {
            numeric: true,
          },
        )
      })
    })

    return Object.entries(agrupadas).sort(
      ([filaA], [filaB]) =>
        filaA.localeCompare(filaB),
    )
  }, [asientos])

  const estaSeleccionado = (
    idFuncionAsiento,
  ) =>
    seleccionados.includes(
      idFuncionAsiento,
    )

  const asientoDisponible = (
    funcionAsiento,
  ) =>
    funcionAsiento.estado ===
    'DISPONIBLE'

  const alternarAsiento = (
    funcionAsiento,
  ) => {
    if (
      !asientoDisponible(funcionAsiento)
    ) {
      return
    }

    setError('')

    setSeleccionados((actuales) => {
      if (
        actuales.includes(
          funcionAsiento.id,
        )
      ) {
        return actuales.filter(
          (idSeleccionado) =>
            idSeleccionado !==
            funcionAsiento.id,
        )
      }

      if (actuales.length >= 5) {
        setError(
          'Solo puedes seleccionar hasta cinco asientos por operación.',
        )

        return actuales
      }

      return [
        ...actuales,
        funcionAsiento.id,
      ]
    })
  }

  const total = useMemo(() => {
    return seleccionados.reduce(
      (
        acumulado,
        idSeleccionado,
      ) => {
        const asientoSeleccionado =
          asientos.find(
            (item) =>
              item.id ===
              idSeleccionado,
          )

        const precio = Number(
          asientoSeleccionado?.precio ??
            funcion?.precio_base ??
            0,
        )

        return acumulado + precio
      },
      0,
    )
  }, [
    seleccionados,
    asientos,
    funcion,
  ])

  const obtenerMensajeError = (
    err,
    mensajePredeterminado,
  ) => {
    const errores =
      err.response?.data?.errors

    if (errores) {
      return Object.values(errores)
        .flat()
        .join(' ')
    }

    return (
      err.response?.data?.message ||
      mensajePredeterminado
    )
  }

  const continuarReserva = async () => {
    if (!autenticado) {
      navigate('/login')
      return
    }

    if (seleccionados.length === 0) {
      setError(
        'Selecciona al menos un asiento para continuar.',
      )
      return
    }

    setError('')
    setCreandoReserva(true)

    try {
      const response = await api.post(
        '/reservas',
        {
          funcion_id: Number(id),
          funcion_asiento_ids:
            seleccionados,
        },
      )

      const data =
        response.data.data ??
        response.data

      navigate(
        `/reservas/${data.id}`,
      )
    } catch (err) {
      setError(
        obtenerMensajeError(
          err,
          'No fue posible crear la reserva.',
        ),
      )
    } finally {
      setCreandoReserva(false)
    }
  }

  const comprarAhora = async () => {
    if (!autenticado) {
      navigate('/login')
      return
    }

    if (seleccionados.length === 0) {
      setError(
        'Selecciona al menos un asiento para continuar.',
      )
      return
    }

    setError('')
    setCreandoCompra(true)

    try {
      const response = await api.post(
        '/ventas/directa',
        {
          funcion_id: Number(id),
          funcion_asiento_ids:
            seleccionados,
        },
      )

      const data =
        response.data.data ??
        response.data

      navigate(
        `/compras/${data.id}/pago`,
      )
    } catch (err) {
      setError(
        obtenerMensajeError(
          err,
          'No fue posible iniciar la compra.',
        ),
      )
    } finally {
      setCreandoCompra(false)
    }
  }

  const obtenerClaseAsiento = (
    funcionAsiento,
  ) => {
    if (
      estaSeleccionado(
        funcionAsiento.id,
      )
    ) {
      return 'asiento asiento-seleccionado'
    }

    switch (funcionAsiento.estado) {
      case 'DISPONIBLE':
        return 'asiento asiento-disponible'

      case 'RESERVADO':
        return 'asiento asiento-reservado'

      case 'VENDIDO':
      case 'COMPRADO':
        return 'asiento asiento-vendido'

      case 'BLOQUEADO':
        return 'asiento asiento-bloqueado'

      default:
        return 'asiento asiento-no-disponible'
    }
  }

  if (cargando) {
    return (
      <main className="funcion-detalle">
        <p>Cargando función...</p>
      </main>
    )
  }

  if (error && !funcion) {
    return (
      <main className="funcion-detalle">
        <h1>Atlantic Cinema</h1>

        <p>{error}</p>

        <Link to="/">
          Volver a cartelera
        </Link>
      </main>
    )
  }

  if (!funcion) {
    return null
  }

  const procesando =
    creandoReserva ||
    creandoCompra

  return (
    <main className="funcion-detalle">
      <Link to="/">
        ← Volver a cartelera
      </Link>

      <h1>Atlantic Cinema</h1>

      <section className="informacion-funcion">
        <h2>
          {funcion.pelicula?.titulo ??
            'Película'}
        </h2>

        {funcion.pelicula?.sinopsis && (
          <p>
            {
              funcion.pelicula
                .sinopsis
            }
          </p>
        )}

        <p>
          <strong>Sala:</strong>{' '}
          {funcion.sala?.nombre}
        </p>

        <p>
          <strong>Formato:</strong>{' '}
          {funcion.formato?.nombre}
        </p>

        <p>
          <strong>Inicio:</strong>{' '}
          {funcion.inicia_en}
        </p>

        <p>
          <strong>
            Finalización:
          </strong>{' '}
          {funcion.finaliza_en}
        </p>

        <p>
          <strong>
            Precio base:
          </strong>{' '}
          Q
          {Number(
            funcion.precio_base,
          ).toFixed(2)}
        </p>
      </section>

      <section className="seleccion-asientos">
        <h2>
          Selecciona tus asientos
        </h2>

        <div className="leyenda-asientos">
          <span>Disponible</span>
          <span>Seleccionado</span>
          <span>Reservado</span>
          <span>Vendido</span>
          <span>Bloqueado</span>
        </div>

        <div className="pantalla-cine">
          PANTALLA
        </div>

        <div className="mapa-asientos">
          {filas.map(
            ([
              fila,
              asientosFila,
            ]) => (
              <div
                className="fila-asientos"
                key={fila}
              >
                <span className="nombre-fila">
                  {fila}
                </span>

                <div className="asientos-fila">
                  {asientosFila.map(
                    (
                      funcionAsiento,
                    ) => (
                      <button
                        key={
                          funcionAsiento.id
                        }
                        type="button"
                        className={obtenerClaseAsiento(
                          funcionAsiento,
                        )}
                        disabled={
                          !asientoDisponible(
                            funcionAsiento,
                          ) ||
                          procesando
                        }
                        onClick={() =>
                          alternarAsiento(
                            funcionAsiento,
                          )
                        }
                        title={`Asiento ${funcionAsiento.asiento?.fila}${funcionAsiento.asiento?.numero}`}
                      >
                        {
                          funcionAsiento
                            .asiento
                            ?.fila
                        }
                        {
                          funcionAsiento
                            .asiento
                            ?.numero
                        }
                      </button>
                    ),
                  )}
                </div>

                <span className="nombre-fila">
                  {fila}
                </span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="resumen-seleccion">
        <h2>Resumen</h2>

        <p>
          Asientos seleccionados:{' '}
          <strong>
            {seleccionados.length}
          </strong>
        </p>

        <p>
          Total:{' '}
          <strong>
            Q{total.toFixed(2)}
          </strong>
        </p>

        {error && (
          <p className="mensaje-error">
            {error}
          </p>
        )}

        {!autenticado && (
          <p>
            Debes iniciar sesión para
            reservar o comprar entradas.
          </p>
        )}

        <div className="acciones-compra">
          <button
            type="button"
            onClick={
              continuarReserva
            }
            disabled={
              seleccionados.length ===
                0 ||
              procesando
            }
          >
            {creandoReserva
              ? 'Creando reserva...'
              : 'Continuar con reserva'}
          </button>

          <button
            type="button"
            onClick={comprarAhora}
            disabled={
              seleccionados.length ===
                0 ||
              procesando
            }
          >
            {creandoCompra
              ? 'Iniciando compra...'
              : 'Comprar ahora'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default FuncionDetalle