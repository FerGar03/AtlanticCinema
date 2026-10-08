import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import api from '../services/api'
import { useAuth } from '../context/AuthContext'

import logoAtlantic from '../assets/branding/atlantic-cinema-logo.png'
import heroCinePersonas from '../assets/branding/hero-cine-personas.png'
import heroSalaCine from '../assets/branding/hero-sala-cine.png'

import './Cartelera.css'


function Cartelera() {
  const navigate = useNavigate()

  const {
    autenticado,
    usuario,
    logout,
  } = useAuth()

  const [funciones, setFunciones] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')

  const [slideActivo, setSlideActivo] =
    useState(0)


  useEffect(() => {
    const cargarFunciones =
      async () => {
        try {
          const response =
            await api.get('/funciones')

          const data =
            response.data.data
            ?? response.data

          setFunciones(
            Array.isArray(data)
              ? data
              : []
          )
        } catch (err) {
          setError(
            err.response?.data?.message
            || 'No fue posible cargar la cartelera.'
          )
        } finally {
          setCargando(false)
        }
      }

    cargarFunciones()
  }, [])


  useEffect(() => {
    const intervalo =
      window.setInterval(
        () => {
          setSlideActivo(
            (actual) =>
              (actual + 1) % 2
          )
        },
        5500
      )

    return () =>
      window.clearInterval(intervalo)
  }, [])


  const cerrarSesion =
    async () => {
      await logout()
      navigate('/')
    }


  const rol =
    usuario?.rol?.nombre

  const esPersonal = [
    'Administrador',
    'Empleado',
  ].includes(rol)

  const esAdministrador =
    rol === 'Administrador'


  const obtenerFecha = (
    fecha
  ) => {
    if (!fecha) {
      return 'Fecha no disponible'
    }

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        timeZone:
          'America/Guatemala',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }
    ).format(new Date(fecha))
  }


  const obtenerHora = (
    fecha
  ) => {
    if (!fecha) {
      return '--:--'
    }

    return new Intl.DateTimeFormat(
      'es-GT',
      {
        timeZone:
          'America/Guatemala',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    ).format(new Date(fecha))
  }


  const obtenerFechaHora = (
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
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    ).format(new Date(fecha))
  }


  const obtenerPrecio = (
    precio
  ) => {
    const numero =
      Number(precio ?? 0)

    return `Q${numero.toFixed(2)}`
  }


  const funcionesDisponibles =
    useMemo(() => {
      const ahora =
        new Date()

      return funciones
        .filter((funcion) => {
          if (
            funcion.estado
            !== 'PROGRAMADA'
          ) {
            return false
          }

          if (!funcion.inicia_en) {
            return true
          }

          return (
            new Date(
              funcion.inicia_en
            ) >= ahora
          )
        })
        .sort(
          (a, b) =>
            new Date(a.inicia_en)
            - new Date(b.inicia_en)
        )
    }, [funciones])


  const peliculas =
    useMemo(() => {
      const agrupadas =
        new Map()

      funcionesDisponibles.forEach(
        (funcion) => {
          const pelicula =
            funcion.pelicula

          const clave =
            pelicula?.id
            ?? pelicula?.titulo
            ?? `pelicula-${funcion.id}`

          if (
            !agrupadas.has(clave)
          ) {
            agrupadas.set(
              clave,
              {
                pelicula,
                funciones: [],
              }
            )
          }

          agrupadas
            .get(clave)
            .funciones
            .push(funcion)
        }
      )

      return Array.from(
        agrupadas.values()
      )
    }, [funcionesDisponibles])


  const totalFunciones =
    funcionesDisponibles.length

  const proximaFuncion =
    funcionesDisponibles[0] ?? null


  const formatosDisponibles =
    useMemo(() => {
      const formatos =
        new Set()

      funcionesDisponibles.forEach(
        (funcion) => {
          const nombre =
            funcion.formato?.nombre

          if (nombre) {
            formatos.add(nombre)
          }
        }
      )

      return Array.from(
        formatos
      )
    }, [funcionesDisponibles])


  const heroSlides = [
    {
      id: 1,
      imagen:
        heroCinePersonas,
      etiqueta:
        'EXPERIENCIA ATLANTIC',
      titulo:
        'Disfruta cada función con una experiencia inolvidable.',
      descripcion:
        'Compra tus entradas, selecciona tus asientos y recibe tus documentos electrónicos en un solo lugar.',
    },
    {
      id: 2,
      imagen:
        heroSalaCine,
      etiqueta:
        'CARTELERA DISPONIBLE',
      titulo:
        'Tu próxima película te espera en la gran pantalla.',
      descripcion:
        'Explora funciones disponibles, consulta horarios y elige la mejor opción para vivir el cine como se debe.',
    },
  ]


  const slideActual =
    heroSlides[slideActivo]


  if (cargando) {
    return (
      <main className="cartelera-cargando">
        <div className="cartelera-spinner" />

        <p>
          Preparando cartelera...
        </p>
      </main>
    )
  }


  return (
    <main className="cartelera-pagina">

      <header className="cartelera-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="cartelera-logo-contenedor">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="cartelera-logo-imagen"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <small>
              Vive la experiencia
            </small>
          </div>
        </Link>


        <nav className="cartelera-navegacion">

          {autenticado ? (
            <>
              <div className="cartelera-usuario">
                <span>
                  Bienvenido
                </span>

                <strong>
                  {usuario?.nombres
                    || 'Usuario'}
                </strong>
              </div>

              <Link
                to="/perfil"
                className="cartelera-nav-link"
              >
                Mi perfil
              </Link>

              <Link
                to="/mis-operaciones"
                className="cartelera-nav-link"
              >
                Mis operaciones
              </Link>

              {esPersonal && (
                <Link
                  to="/taquilla/reservas"
                  className="cartelera-nav-link"
                >
                  Taquilla
                </Link>
              )}

              {esAdministrador && (
                <Link
                  to="/admin"
                  className="cartelera-nav-link"
                >
                  Administración
                </Link>
              )}

              <button
                type="button"
                className="cartelera-boton-sesion"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="cartelera-nav-link"
              >
                Iniciar sesión
              </Link>

              <Link
                to="/registro"
                className="cartelera-boton-registro"
              >
                Crear cuenta
              </Link>
            </>
          )}

        </nav>
      </header>


      <section
        className="cartelera-hero-dinamico"
        style={{
          backgroundImage:
            `linear-gradient(
              rgba(7, 10, 12, 0.78),
              rgba(7, 10, 12, 0.88)
            ), url(${slideActual.imagen})`,
        }}
      >
        <div className="cartelera-hero-dinamico-overlay" />

        <div className="cartelera-hero-dinamico-contenido">

          <div className="cartelera-hero-copy">

            <span className="cartelera-etiqueta">
              {slideActual.etiqueta}
            </span>

            <h1>
              {slideActual.titulo}
            </h1>

            <p>
              {slideActual.descripcion}
            </p>

            <div className="cartelera-hero-acciones">

              <a
                href="#peliculas"
                className="cartelera-hero-boton"
              >
                Ver cartelera
              </a>

              {!autenticado && (
                <Link
                  to="/registro"
                  className="cartelera-hero-secundario"
                >
                  Crear cuenta
                </Link>
              )}

            </div>


            <div className="cartelera-hero-slides-indicadores">

              {heroSlides.map(
                (slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`cartelera-slide-dot ${
                      slideActivo
                      === index
                        ? 'activo'
                        : ''
                    }`}
                    onClick={() =>
                      setSlideActivo(
                        index
                      )
                    }
                    aria-label={`Ver imagen ${index + 1}`}
                  />
                )
              )}

            </div>

          </div>


          <aside className="cartelera-hero-panel">

            <div className="cartelera-hero-panel-marca">

              <img
                src={logoAtlantic}
                alt="Atlantic Cinema"
                className="cartelera-hero-panel-logo"
              />

              <div>
                <strong>
                  Atlantic Cinema
                </strong>

                <span>
                  Plataforma web de cine
                </span>
              </div>

            </div>


            <div className="cartelera-hero-kpis">

              <article>
                <strong>
                  {peliculas.length}
                </strong>

                <span>
                  {peliculas.length === 1
                    ? 'película en cartelera'
                    : 'películas en cartelera'}
                </span>
              </article>


              <article>
                <strong>
                  {totalFunciones}
                </strong>

                <span>
                  {totalFunciones === 1
                    ? 'función disponible'
                    : 'funciones disponibles'}
                </span>
              </article>


              <article>
                <strong>
                  {formatosDisponibles.length > 0
                    ? formatosDisponibles.join(' / ')
                    : '—'}
                </strong>

                <span>
                  formatos disponibles
                </span>
              </article>

            </div>


            <div className="cartelera-hero-proxima">

              <span>
                Próxima función
              </span>

              <strong>
                {proximaFuncion
                  ? (
                    proximaFuncion
                      .pelicula
                      ?.titulo
                    || 'Película'
                  )
                  : 'Sin funciones próximas'}
              </strong>

              <small>
                {proximaFuncion
                  ? `${obtenerFechaHora(
                    proximaFuncion.inicia_en
                  )} · ${
                    proximaFuncion
                      .sala
                      ?.nombre
                    || 'Sala'
                  }`
                  : 'Próximamente anunciaremos nuevos horarios.'}
              </small>

            </div>

          </aside>

        </div>
      </section>


      <section
        id="peliculas"
        className="cartelera-contenido"
      >

        <div className="cartelera-titulo-seccion">

          <div>
            <span className="cartelera-etiqueta">
              EN CARTELERA
            </span>

            <h2>
              Películas y funciones
            </h2>
          </div>

          <p>
            Consulta horarios disponibles
            y selecciona la función que
            prefieras.
          </p>

        </div>


        {error && (
          <div className="cartelera-mensaje-error">

            <strong>
              No pudimos cargar la cartelera.
            </strong>

            <span>
              {error}
            </span>

          </div>
        )}


        {!error
          && peliculas.length === 0
          && (
            <div className="cartelera-vacia">

              <div>
                🎬
              </div>

              <h3>
                No hay funciones disponibles
              </h3>

              <p>
                Próximamente tendremos
                nuevas películas y horarios.
              </p>

            </div>
          )}


        <div className="cartelera-grid">

          {peliculas.map(
            ({
              pelicula,
              funciones:
                funcionesPelicula,
            }) => (

              <article
                className="pelicula-card"
                key={
                  pelicula?.id
                  ?? pelicula?.titulo
                }
              >

                <div className="pelicula-poster">

                  <div className="pelicula-poster-fallback">

                    <span>
                      ATLANTIC CINEMA
                    </span>

                    <strong>
                      {pelicula?.titulo
                        || 'Película'}
                    </strong>

                  </div>


                  {pelicula?.imagen_url && (
                    <>
                      <img
                        src={pelicula.imagen_url}
                        alt=""
                        aria-hidden="true"
                        className="pelicula-poster-fondo"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            'none'
                        }}
                      />

                      <img
                        src={pelicula.imagen_url}
                        alt={`Póster de ${
                          pelicula?.titulo
                          || 'la película'
                        }`}
                        className="pelicula-poster-principal"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            'none'
                        }}
                      />
                    </>
                  )}


                  <div className="pelicula-poster-overlay">
                    <span>
                      EN CARTELERA
                    </span>
                  </div>

                </div>


                <div className="pelicula-contenido">

                  <div className="pelicula-cabecera">

                    <div>
                      <h3>
                        {pelicula?.titulo
                          || 'Película sin título'}
                      </h3>

                      {pelicula?.titulo_original
                        && pelicula.titulo_original
                          !== pelicula.titulo
                        && (
                          <small className="pelicula-titulo-original">
                            {
                              pelicula
                                .titulo_original
                            }
                          </small>
                        )}
                    </div>

                  </div>


                  <div className="pelicula-datos">

                    {pelicula?.duracion_minutos && (
                      <span>
                        {
                          pelicula
                            .duracion_minutos
                        } min
                      </span>
                    )}

                    {pelicula
                      ?.clasificacion
                      ?.nombre && (
                        <span>
                          {
                            pelicula
                              .clasificacion
                              .nombre
                          }
                        </span>
                      )}

                    {pelicula
                      ?.generos
                      ?.slice(0, 2)
                      .map(
                        (genero) => (
                          <span
                            key={genero.id}
                          >
                            {genero.nombre}
                          </span>
                        )
                      )}

                  </div>


                  {pelicula?.sinopsis && (
                    <p className="pelicula-sinopsis">
                      {pelicula.sinopsis}
                    </p>
                  )}


                  <div className="pelicula-funciones-titulo">

                    <strong>
                      Próximas funciones
                    </strong>

                    <span>
                      {
                        funcionesPelicula.length
                      }{' '}
                      {funcionesPelicula.length
                      === 1
                        ? 'función'
                        : 'funciones'}
                    </span>

                  </div>


                  <div className="pelicula-funciones">

                    {funcionesPelicula.map(
                      (funcion) => (

                        <Link
                          key={funcion.id}
                          to={`/funciones/${funcion.id}`}
                          className="funcion-card-cartelera"
                        >

                          <div className="funcion-fecha">

                            <strong>
                              {obtenerFecha(
                                funcion.inicia_en
                              )}
                            </strong>

                            <span>
                              {obtenerHora(
                                funcion.inicia_en
                              )}
                            </span>

                          </div>


                          <div className="funcion-detalles-cartelera">

                            <span>
                              {funcion
                                .sala
                                ?.nombre
                                || 'Sala'}
                            </span>

                            <small>
                              {funcion
                                .formato
                                ?.nombre
                                || 'Formato'}
                            </small>

                          </div>


                          <strong className="funcion-precio">
                            {obtenerPrecio(
                              funcion.precio_base
                            )}
                          </strong>


                          <span className="funcion-flecha">
                            →
                          </span>

                        </Link>

                      )
                    )}

                  </div>

                </div>

              </article>

            )
          )}

        </div>

      </section>


      <section className="cartelera-experiencia">

        <div>

          <span className="cartelera-etiqueta">
            TU EXPERIENCIA
          </span>

          <h2>
            Del asiento a la pantalla,
            todo en un solo lugar.
          </h2>

        </div>


        <div className="cartelera-beneficios">

          <article>

            <span>
              01
            </span>

            <strong>
              Elige tu función
            </strong>

            <p>
              Consulta horarios, sala,
              formato y precio antes
              de continuar.
            </p>

          </article>


          <article>

            <span>
              02
            </span>

            <strong>
              Selecciona tu asiento
            </strong>

            <p>
              Visualiza la disponibilidad
              de la sala en tiempo real.
            </p>

          </article>


          <article>

            <span>
              03
            </span>

            <strong>
              Compra en línea
            </strong>

            <p>
              Completa tu compra y recibe
              tus documentos electrónicos.
            </p>

          </article>

        </div>

      </section>


      <footer className="cartelera-footer">

        <div className="cartelera-footer-marca">

          <div className="cartelera-logo-contenedor cartelera-logo-footer">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
              className="cartelera-logo-imagen"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <span>
              Vive la experiencia.
            </span>
          </div>

        </div>


        <div className="cartelera-footer-enlaces">

          <a href="#peliculas">
            Cartelera
          </a>

          {autenticado ? (
            <Link to="/perfil">
              Mi perfil
            </Link>
          ) : (
            <Link to="/login">
              Iniciar sesión
            </Link>
          )}

        </div>


        <small>
          © 2026 Atlantic Cinema
        </small>

      </footer>

    </main>
  )
}


export default Cartelera