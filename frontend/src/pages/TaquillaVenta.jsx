import {



  useCallback,



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







function TaquillaVenta() {



  const navigate = useNavigate()







  const {



    usuario,



    logout,



  } = useAuth()







  const [



    funciones,



    setFunciones,



  ] = useState([])







  const [



    funcionId,



    setFuncionId,



  ] = useState('')







  const [



    funcion,



    setFuncion,



  ] = useState(null)







  const [



    seleccionados,



    setSeleccionados,



  ] = useState([])







  const [



    cargandoFunciones,



    setCargandoFunciones,



  ] = useState(true)







  const [



    cargandoFuncion,



    setCargandoFuncion,



  ] = useState(false)







  const [



    creandoVenta,



    setCreandoVenta,



  ] = useState(false)







  const [



    registrandoPago,



    setRegistrandoPago,



  ] = useState(false)







  const [



    error,



    setError,



  ] = useState('')







  const [



    confirmacionVenta,



    setConfirmacionVenta,



  ] = useState(false)







  const [



    modalPago,



    setModalPago,



  ] = useState(false)







  const [



    metodoPago,



    setMetodoPago,



  ] = useState('')







  const [



    efectivoRecibido,



    setEfectivoRecibido,



  ] = useState('')







  const [



    proveedorPos,



    setProveedorPos,



  ] = useState('')







  const [



    referenciaPos,



    setReferenciaPos,



  ] = useState('')







  const [



    autorizacionPos,



    setAutorizacionPos,



  ] = useState('')







  const [



    tipoFacturacion,



    setTipoFacturacion,



  ] = useState('CF')







  const [



    nitReceptor,



    setNitReceptor,



  ] = useState('')







  const [



    nombreReceptor,



    setNombreReceptor,



  ] = useState('')









  const [

    consultandoNit,

    setConsultandoNit,

  ] = useState('')



const [



    documentos,



    setDocumentos,



  ] = useState(null)







  const [



    procesandoDocumento,



    setProcesandoDocumento,



  ] = useState('')







  const [



    ventaCreada,



    setVentaCreada,



  ] = useState(null)







  const [



    pagoRegistrado,



    setPagoRegistrado,



  ] = useState(null)







  const obtenerMensajeError = (



    err,



    mensajePredeterminado



  ) => {



    const errores =



      err.response?.data?.errors







    if (errores) {



      return Object.values(



        errores



      )



        .flat()



        .join(' ')



    }







    return (



      err.response?.data?.message



      || mensajePredeterminado



    )



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







        weekday: 'short',



        day: 'numeric',



        month: 'short',



        year: 'numeric',



      }



    ).format(



      new Date(fecha)



    )



  }







  const formatearHora = (



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



    ).format(



      new Date(fecha)



    )



  }







  const cargarFunciones =



    useCallback(



      async () => {



        setCargandoFunciones(



          true



        )



        setError('')







        try {



          const response =



            await api.get(



              '/funciones'



            )







          const data =



            response.data.data



            ?? response.data







          const ahora =



            new Date()







          const disponibles =



            (



              Array.isArray(data)



                ? data



                : []



            )



              .filter(



                (item) => {



                  if (



                    item.estado



                    !== 'PROGRAMADA'



                  ) {



                    return false



                  }







                  if (



                    !item.inicia_en



                  ) {



                    return true



                  }







                  return (



                    new Date(



                      item.inicia_en



                    ) >= ahora



                  )



                }



              )



              .sort(



                (a, b) =>



                  new Date(



                    a.inicia_en



                  )



                  - new Date(



                    b.inicia_en



                  )



              )







          setFunciones(



            disponibles



          )



        } catch (err) {



          setError(



            obtenerMensajeError(



              err,



              'No fue posible cargar las funciones.'



            )



          )



        } finally {



          setCargandoFunciones(



            false



          )



        }



      },



      []



    )







  useEffect(() => {



    cargarFunciones()



  }, [cargarFunciones])







  const cargarFuncion =



    useCallback(



      async (id) => {



        if (!id) {



          setFuncion(null)



          setSeleccionados([])



          return



        }







        setCargandoFuncion(true)



        setError('')



        setSeleccionados([])



        setVentaCreada(null)



        setPagoRegistrado(null)







        try {



          const response =



            await api.get(



              `/funciones/${id}`



            )







          const data =



            response.data.data



            ?? response.data







          setFuncion(data)



        } catch (err) {



          setFuncion(null)







          setError(



            obtenerMensajeError(



              err,



              'No fue posible cargar la función seleccionada.'



            )



          )



        } finally {



          setCargandoFuncion(



            false



          )



        }



      },



      []



    )







  const seleccionarFuncion = (



    event



  ) => {



    const id =



      event.target.value







    setFuncionId(id)



    cargarFuncion(id)



  }







  const asientos =



    useMemo(() => {



      if (!funcion) {



        return []



      }







      return (



        funcion.funcion_asientos



        ?? funcion.asientos



        ?? []



      )



    }, [funcion])







  const filas =



    useMemo(() => {



      const agrupadas = {}







      asientos.forEach(



        (funcionAsiento) => {



          const asiento =



            funcionAsiento.asiento







          if (!asiento) {



            return



          }







          const fila =



            asiento.fila







          if (



            !agrupadas[fila]



          ) {



            agrupadas[fila] =



              []



          }







          agrupadas[fila]



            .push(



              funcionAsiento



            )



        }



      )







      Object.values(



        agrupadas



      ).forEach(



        (asientosFila) => {



          asientosFila.sort(



            (a, b) => {



              const numeroA =



                Number(



                  a.asiento



                    ?.numero



                )







              const numeroB =



                Number(



                  b.asiento



                    ?.numero



                )







              if (



                !Number.isNaN(



                  numeroA



                )



                && !Number.isNaN(



                  numeroB



                )



              ) {



                return (



                  numeroA



                  - numeroB



                )



              }







              return String(



                a.asiento



                  ?.numero



              ).localeCompare(



                String(



                  b.asiento



                    ?.numero



                ),



                undefined,



                {



                  numeric: true,



                }



              )



            }



          )



        }



      )







      return Object.entries(



        agrupadas



      ).sort(



        (



          [filaA],



          [filaB]



        ) =>



          filaA.localeCompare(



            filaB



          )



      )



    }, [asientos])







  const asientoDisponible = (



    funcionAsiento



  ) =>



    funcionAsiento.estado



    === 'DISPONIBLE'







  const estaSeleccionado = (



    id



  ) =>



    seleccionados.includes(



      id



    )







  const alternarAsiento = (



    funcionAsiento



  ) => {



    if (



      !asientoDisponible(



        funcionAsiento



      )



      || ventaCreada



    ) {



      return



    }







    setError('')







    setSeleccionados(



      (actuales) => {



        if (



          actuales.includes(



            funcionAsiento.id



          )



        ) {



          return actuales.filter(



            (id) =>



              id



              !== funcionAsiento.id



          )



        }







        if (



          actuales.length



          >= 5



        ) {



          setError(



            'Solo se pueden vender hasta cinco asientos por operación.'



          )







          return actuales



        }







        return [



          ...actuales,



          funcionAsiento.id,



        ]



      }



    )



  }







  const asientosSeleccionados =



    useMemo(() => {



      return seleccionados



        .map(



          (id) =>



            asientos.find(



              (item) =>



                item.id === id



            )



        )



        .filter(Boolean)



    }, [



      seleccionados,



      asientos,



    ])







  const total =



    useMemo(() => {



      return asientosSeleccionados



        .reduce(



          (



            acumulado,



            item



          ) => {



            const precio =



              Number(



                item.precio



                ?? funcion



                  ?.precio_base



                ?? 0



              )







            return (



              acumulado



              + precio



            )



          },



          0



        )



    }, [



      asientosSeleccionados,



      funcion,



    ])







  const totalVenta =



    Number(



      ventaCreada?.total



      ?? total



      ?? 0



    )







  const efectivoNumero =



    Number(



      efectivoRecibido



      || 0



    )







  const cambio =



    Math.max(



      0,



      efectivoNumero



      - totalVenta



    )







  const obtenerNombresAsientos =



    () =>



      asientosSeleccionados



        .map(



          (item) =>



            `${item.asiento?.fila}${item.asiento?.numero}`



        )



        .join(', ')







  const obtenerClaseAsiento = (



    funcionAsiento



  ) => {



    if (



      estaSeleccionado(



        funcionAsiento.id



      )



    ) {



      return (



        'asiento '



        + 'asiento-seleccionado'



      )



    }







    switch (



      funcionAsiento.estado



    ) {



      case 'DISPONIBLE':



        return (



          'asiento '



          + 'asiento-disponible'



        )







      case 'RESERVADO':



        return (



          'asiento '



          + 'asiento-reservado'



        )







      case 'VENDIDO':



      case 'COMPRADO':



        return (



          'asiento '



          + 'asiento-vendido'



        )







      case 'BLOQUEADO':



        return (



          'asiento '



          + 'asiento-bloqueado'



        )







      default:



        return (



          'asiento '



          + 'asiento-no-disponible'



        )



    }



  }







  const abrirConfirmacionVenta =



    () => {



      if (!funcion) {



        setError(



          'Selecciona una función para continuar.'



        )







        return



      }







      if (



        seleccionados.length



        === 0



      ) {



        setError(



          'Selecciona al menos un asiento.'



        )







        return



      }







      setError('')



      setConfirmacionVenta(



        true



      )



    }







  const cerrarConfirmacionVenta =



    () => {



      if (creandoVenta) {



        return



      }







      setConfirmacionVenta(



        false



      )



    }







  const crearVenta =



    async () => {



      setCreandoVenta(true)



      setError('')







      try {



        const response =



          await api.post(



            '/ventas/taquilla',



            {



              funcion_id:



                Number(



                  funcion.id



                ),







              funcion_asiento_ids:



                seleccionados,



            }



          )







        const data =



          response.data.data



          ?? response.data







        setVentaCreada(data)







        setConfirmacionVenta(



          false



        )



      } catch (err) {



        setConfirmacionVenta(



          false



        )







        setError(



          obtenerMensajeError(



            err,



            'No fue posible crear la venta de taquilla.'



          )



        )



      } finally {



        setCreandoVenta(false)



      }



    }







  const abrirPago = () => {



    setMetodoPago('')



    setEfectivoRecibido('')



    setProveedorPos('')



    setReferenciaPos('')



    setAutorizacionPos('')



    setTipoFacturacion('CF')



    setNitReceptor('')



    setNombreReceptor('')



    setError('')



    setModalPago(true)



  }







  const cerrarPago = () => {



    if (

      registrandoPago

      || consultandoNit

    ) {

      return

    }







    setModalPago(false)



  }







  const consultarNit =

    async () => {

      const nit =

        nitReceptor.trim()



      if (!nit) {

        setNombreReceptor('')

        setError(

          'Ingresa el NIT para consultar los datos fiscales.'

        )



        return false

      }



      setConsultandoNit(true)

      setError('')

      setNombreReceptor('')



      try {

        const response =

          await api.post(

            '/pagos/consultar-nit',

            {

              nit,

            }

          )



        const data =

          response.data.data

          ?? response.data



        setNitReceptor(

          data.nit

          ?? nit

        )



        setNombreReceptor(

          data.nombre

          ?? ''

        )



        return Boolean(

          data.nombre

        )

      } catch (err) {

        setNombreReceptor('')



        setError(

          obtenerMensajeError(

            err,

            'No fue posible consultar el NIT.'

          )

        )



        return false

      } finally {

        setConsultandoNit(false)

      }

    }







  const registrarPago =



    async () => {



      if (!metodoPago) {



        setError(



          'Selecciona un método de pago.'



        )







        return



      }







      if (



        metodoPago



        === 'EFECTIVO'



        && efectivoNumero



        < totalVenta



      ) {



        setError(



          'El efectivo recibido es menor que el total de la venta.'



        )







        return



      }







      if (



        metodoPago



        === 'TARJETA'



        && !proveedorPos.trim()



      ) {



        setError(



          'Ingresa el proveedor del POS.'



        )







        return



      }







      if (



        metodoPago



        === 'TARJETA'



        && !autorizacionPos.trim()



      ) {



        setError(



          'Ingresa el código de autorización del POS.'



        )







        return



      }







      if (



        tipoFacturacion === 'NIT'



        && !nitReceptor.trim()



      ) {



        setError(



          'Ingresa el NIT para la factura.'



        )







        return



      }







      if (

        tipoFacturacion === 'NIT'

        && !nombreReceptor.trim()

      ) {

        const nitValido =

          await consultarNit()



        if (!nitValido) {

          return

        }

      }







setRegistrandoPago(true)



      setError('')







      try {



        const payload = {



          venta_id:



            ventaCreada.id,







          metodo:



            metodoPago,







          nit_receptor:



            tipoFacturacion === 'CF'



              ? 'CF'



              : nitReceptor.trim(),



        }







        if (



          metodoPago



          === 'EFECTIVO'



        ) {



          payload.efectivo_recibido =



            efectivoNumero



        }







        if (



          metodoPago



          === 'TARJETA'



        ) {



          payload.proveedor_pos =



            proveedorPos.trim()







          payload.referencia_proveedor =



            referenciaPos.trim()



            || null







          payload.autorizacion_codigo =



            autorizacionPos.trim()



        }







        const response =



          await api.post(



            '/pagos/taquilla',



            payload



          )







        const data =



          response.data.data



          ?? response.data







        setPagoRegistrado(



          data



        )







        setDocumentos(



          response.data.documentos



          ?? null



        )







        setVentaCreada(



          (actual) => ({



            ...actual,



            estado:



              'PAGADA',



          })



        )







        setModalPago(false)



      } catch (err) {



        setError(



          obtenerMensajeError(



            err,



            'No fue posible registrar el pago.'



          )



        )



      } finally {



        setRegistrandoPago(



          false



        )



      }



    }







  const obtenerDocumento = async (



    ruta,



    nombreArchivo,



    abrir = false



  ) => {



    try {



      setProcesandoDocumento(ruta)



      setError('')







      const response =



        await api.get(



          ruta,



          {



            responseType: 'blob',



          }



        )







      const url =



        window.URL.createObjectURL(



          response.data



        )







      if (abrir) {



        window.open(



          url,



          '_blank',



          'noopener,noreferrer'



        )







        window.setTimeout(



          () =>



            window.URL.revokeObjectURL(url),



          60000



        )







        return



      }







      const enlace =



        document.createElement('a')







      enlace.href = url



      enlace.download = nombreArchivo



      document.body.appendChild(enlace)



      enlace.click()



      enlace.remove()



      window.URL.revokeObjectURL(url)



    } catch (err) {



      setError(



        obtenerMensajeError(



          err,



          'No fue posible obtener el documento.'



        )



      )



    } finally {



      setProcesandoDocumento('')



    }



  }







  const nuevaVenta =



    () => {



      setFuncionId('')



      setFuncion(null)



      setSeleccionados([])



      setVentaCreada(null)



      setPagoRegistrado(null)



      setDocumentos(null)







      setMetodoPago('')



      setEfectivoRecibido('')



      setProveedorPos('')



      setReferenciaPos('')



      setAutorizacionPos('')



      setTipoFacturacion('CF')



      setNitReceptor('')



      setNombreReceptor('')







      setError('')







      cargarFunciones()



    }







  const cerrarSesion =



    async () => {



      await logout()



      navigate('/')



    }







  return (



    <main className="funcion-pagina">



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







            <small>



              Taquilla



            </small>



          </div>



        </Link>







        <nav className="funcion-nav">



          <Link



            to="/"



            className="funcion-nav-volver"



          >



            ← Volver a cartelera



          </Link>







          <Link



            to="/perfil"



            className="funcion-nav-volver"



          >



            Mi perfil



          </Link>







          <button



            type="button"



            onClick={cerrarSesion}



            className="funcion-nav-sesion"



          >



            Cerrar sesión



          </button>



        </nav>



      </header>







      <section className="taquilla-venta-encabezado taquilla-cabecera-extendida">



        <div className="taquilla-cabecera-principal">



          <span className="funcion-etiqueta">



            TAQUILLA



          </span>







          <h1>



            Nueva venta



          </h1>







          <p>



            Selecciona una función,



            elige los asientos y registra



            el cobro presencial desde un



            único flujo de atención.



          </p>







          <div className="taquilla-accesos">



            <Link



              to="/taquilla/venta"



              className="taquilla-acceso taquilla-acceso-activo"



            >



              Venta presencial



            </Link>







            <Link



              to="/taquilla/reservas"



              className="taquilla-acceso"



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







        <div className="taquilla-operador-card taquilla-empleado-destacado">



          <span>



            SESIÓN ACTIVA



          </span>







          <strong>



            {usuario?.nombres}



            {' '}



            {usuario?.apellidos}



          </strong>







          <small>



            {usuario?.rol?.nombre}



          </small>



        </div>



      </section>







      <section className="taquilla-selector-funcion">



        <div>



          <label htmlFor="funcion">



            Función



          </label>







          <select



            id="funcion"



            value={funcionId}



            onChange={



              seleccionarFuncion



            }



            disabled={



              cargandoFunciones



              || Boolean(



                ventaCreada



              )



            }



          >



            <option value="">



              {cargandoFunciones



                ? 'Cargando funciones...'



                : 'Selecciona una función'}



            </option>







            {funciones.map(



              (item) => (



                <option



                  key={item.id}



                  value={item.id}



                >



                  {



                    item.pelicula



                      ?.titulo



                    ?? 'Película'



                  }



                  {' · '}



                  {



                    formatearFecha(



                      item.inicia_en



                    )



                  }



                  {' · '}



                  {



                    formatearHora(



                      item.inicia_en



                    )



                  }



                  {' · '}



                  {



                    item.sala



                      ?.nombre



                    ?? 'Sala'



                  }



                </option>



              )



            )}



          </select>



        </div>



      </section>







      {error && (



        <div className="taquilla-venta-error">



          {error}



        </div>



      )}







      {cargandoFuncion && (



        <section className="taquilla-venta-cargando">



          <div className="cartelera-spinner" />







          <p>



            Cargando mapa de asientos...



          </p>



        </section>



      )}







      {!cargandoFuncion



        && !funcion



        && (



          <section className="taquilla-venta-vacia">



            <span>



              🎟



            </span>







            <h2>



              Selecciona una función



            </h2>







            <p>



              Selecciona una función para



              consultar disponibilidad, elegir



              hasta cinco asientos y preparar



              el cobro presencial.



            </p>



          </section>



        )}







      {funcion && (



        <section className="funcion-contenido">



          <div className="funcion-sala-panel">



            <div className="funcion-sala-cabecera">



              <div>



                <span className="funcion-etiqueta">



                  {



                    funcion.sala



                      ?.nombre



                    ?? 'SALA'



                  }



                </span>







                <h2>



                  {



                    funcion.pelicula



                      ?.titulo



                    ?? 'Película'



                  }



                </h2>







                <p>



                  {



                    formatearFecha(



                      funcion.inicia_en



                    )



                  }



                  {' · '}



                  {



                    formatearHora(



                      funcion.inicia_en



                    )



                  }



                  {' · '}



                  {



                    funcion.formato



                      ?.nombre



                    ?? 'Formato'



                  }



                </p>



              </div>







              <div className="funcion-contador-asientos">



                <strong>



                  {seleccionados.length}



                </strong>







                <span>



                  de 5 seleccionados



                </span>



              </div>



            </div>







            <div className="leyenda-asientos">



              <span>



                <i className="leyenda-color leyenda-disponible" />



                Disponible



              </span>







              <span>



                <i className="leyenda-color leyenda-seleccionado" />



                Seleccionado



              </span>







              <span>



                <i className="leyenda-color leyenda-reservado" />



                Reservado



              </span>







              <span>



                <i className="leyenda-color leyenda-vendido" />



                Vendido



              </span>







              <span>



                <i className="leyenda-color leyenda-bloqueado" />



                En proceso



              </span>



            </div>







            <div className="pantalla-contenedor">



              <div className="pantalla-luz" />







              <div className="pantalla-cine">



                PANTALLA



              </div>







              <span>



                Todos los asientos miran



                hacia la pantalla



              </span>



            </div>







            <div className="taquilla-mapa-scroll">



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



                            funcionAsiento



                          ) => (



                            <button



                              key={



                                funcionAsiento.id



                              }



                              type="button"



                              className={



                                obtenerClaseAsiento(



                                  funcionAsiento



                                )



                              }



                              disabled={



                                !asientoDisponible(



                                  funcionAsiento



                                )



                                || creandoVenta



                                || Boolean(



                                  ventaCreada



                                )



                              }



                              onClick={() =>



                                alternarAsiento(



                                  funcionAsiento



                                )



                              }



                            >



                              {



                                funcionAsiento



                                  .asiento



                                  ?.numero



                              }



                            </button>



                          )



                        )}



                      </div>







                      <span className="nombre-fila">



                        {fila}



                      </span>



                    </div>



                  )



                )}



              </div>



            </div>



          </div>







          <aside className="resumen-seleccion">



            <div className="resumen-cabecera">



              <span className="funcion-etiqueta">



                VENTA DE TAQUILLA



              </span>







              <h2>



                Resumen



              </h2>



            </div>







            <div className="resumen-funcion-datos">



              <div>



                <span>



                  Película



                </span>







                <strong>



                  {



                    funcion.pelicula



                      ?.titulo



                    ?? 'Película'



                  }



                </strong>



              </div>







              <div>



                <span>



                  Sala



                </span>







                <strong>



                  {



                    funcion.sala



                      ?.nombre



                    ?? '-'



                  }



                </strong>



              </div>







              <div>



                <span>



                  Función



                </span>







                <strong>



                  {



                    formatearHora(



                      funcion.inicia_en



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



                    funcion.formato



                      ?.nombre



                    ?? '-'



                  }



                </strong>



              </div>



            </div>







            <div className="resumen-asientos">



              <div className="resumen-linea">



                <span>



                  Asientos



                </span>







                <strong>



                  {seleccionados.length}



                </strong>



              </div>







              {asientosSeleccionados



                .length



                > 0 ? (



                  <div className="resumen-asientos-lista">



                    {asientosSeleccionados.map(



                      (item) => (



                        <span



                          key={item.id}



                        >



                          {



                            item.asiento



                              ?.fila



                          }



                          {



                            item.asiento



                              ?.numero



                          }



                        </span>



                      )



                    )}



                  </div>



                ) : (



                  <p className="resumen-sin-asientos">



                    Selecciona los asientos.



                  </p>



                )}



            </div>







            <div className="resumen-total">



              <span>



                Total



              </span>







              <strong>



                Q



                {totalVenta.toFixed(2)}



              </strong>



            </div>







            {!ventaCreada && (



              <button



                type="button"



                className="boton-comprar"



                onClick={



                  abrirConfirmacionVenta



                }



                disabled={



                  seleccionados.length



                    === 0



                  || creandoVenta



                }



              >



                Crear venta



              </button>



            )}







            {ventaCreada



              && !pagoRegistrado



              && (



                <div className="taquilla-venta-creada">



                  <span>



                    VENTA CREADA



                  </span>







                  <strong>



                    {



                      ventaCreada



                        .numero_venta



                    }



                  </strong>







                  <p>



                    La venta quedó pendiente



                    de pago.



                  </p>







                  <div className="taquilla-venta-creada-total">



                    <span>



                      Total



                    </span>







                    <strong>



                      Q



                      {



                        totalVenta



                          .toFixed(2)



                      }



                    </strong>



                  </div>







                  <button



                    type="button"



                    className="boton-comprar"



                    onClick={abrirPago}



                  >



                    Registrar pago



                  </button>







                  <small>



                    Los asientos permanecerán



                    bloqueados hasta completar



                    el cobro.



                  </small>



                </div>



              )}







            {pagoRegistrado && (



              <div className="taquilla-pago-exitoso">



                <span>



                  PAGO APROBADO



                </span>







                <strong>



                  Venta completada



                </strong>







                <p>



                  La venta fue marcada como



                  PAGADA y las entradas ya



                  son válidas.



                </p>







                <div>



                  <span>



                    Método



                  </span>







                  <strong>



                    {



                      pagoRegistrado



                        .metodo_pago



                        ?.nombre



                      ?? metodoPago



                    }



                  </strong>



                </div>







                <div>



                  <span>



                    Total



                  </span>







                  <strong>



                    Q



                    {



                      Number(



                        pagoRegistrado



                          .monto



                        ?? totalVenta



                      ).toFixed(2)



                    }



                  </strong>



                </div>







                {pagoRegistrado



                  .autorizacion_codigo



                  && (



                    <div>



                      <span>



                        Autorización



                      </span>







                      <strong>



                        {



                          pagoRegistrado



                            .autorizacion_codigo



                        }



                      </strong>



                    </div>



                  )}







                <button



                  type="button"



                  className="boton-comprar"



                  onClick={nuevaVenta}



                >



                  Nueva venta



                </button>



              </div>



            )}











          </aside>



        </section>



      )}



      {pagoRegistrado && documentos && (



        <div



          className="taquilla-panel taquilla-panel-destacado"



          style={{



            marginTop: '18px',



          }}



        >



          <div className="taquilla-panel-titulo">



            <div>



              <span>DOCUMENTOS DE VENTA</span>



              <h2>Documentos disponibles</h2>



              <p>



                En taquilla no se envían por correo. Puedes verlos en PDF o descargarlos.



              </p>



            </div>



          </div>







          {(documentos.tickets ?? []).map((ticket) => (



            <div



              key={ticket.id}



              className="taquilla-mini-card"



              style={{ marginBottom: '10px' }}



            >



              <span>Ticket</span>



              <strong>{ticket.codigo}</strong>



              <div className="confirmacion-acciones">



                <button



                  type="button"



                  onClick={() =>



                    obtenerDocumento(



                      `/tickets/${ticket.id}/pdf`,



                      `Ticket-${ticket.codigo}.pdf`,



                      true



                    )



                  }



                  disabled={Boolean(procesandoDocumento)}



                >



                  Ver PDF



                </button>



                <button



                  type="button"



                  className="confirmacion-cancelar"



                  onClick={() =>



                    obtenerDocumento(



                      `/tickets/${ticket.id}/pdf?descargar=1`,



                      `Ticket-${ticket.codigo}.pdf`



                    )



                  }



                  disabled={Boolean(procesandoDocumento)}



                >



                  Descargar PDF



                </button>



              </div>



            </div>



          ))}







          {documentos.factura && (



            <div className="taquilla-mini-card">



              <span>Factura FEL</span>



              <strong>{documentos.factura.numero_interno}</strong>



              <p>Estado: {documentos.factura.estado}</p>







              {documentos.factura.estado === 'CERTIFICADA' && (



                <div className="confirmacion-acciones">



                  <button



                    type="button"



                    onClick={() =>



                      obtenerDocumento(



                        `/facturas/${documentos.factura.id}/pdf`,



                        `Factura-${documentos.factura.numero_interno}.pdf`,



                        true



                      )



                    }



                    disabled={Boolean(procesandoDocumento)}



                  >



                    Ver PDF



                  </button>



                  <button



                    type="button"



                    className="confirmacion-cancelar"



                    onClick={() =>



                      obtenerDocumento(



                        `/facturas/${documentos.factura.id}/pdf?descargar=1`,



                        `Factura-${documentos.factura.numero_interno}.pdf`



                      )



                    }



                    disabled={Boolean(procesandoDocumento)}



                  >



                    Descargar PDF



                  </button>



                  <button



                    type="button"



                    className="confirmacion-cancelar"



                    onClick={() =>



                      obtenerDocumento(



                        `/facturas/${documentos.factura.id}/xml`,



                        `Factura-${documentos.factura.numero_interno}.xml`



                      )



                    }



                    disabled={Boolean(procesandoDocumento)}



                  >



                    Descargar XML



                  </button>



                </div>



              )}



            </div>



          )}







          {Object.keys(documentos.errores ?? {}).length > 0 && (



            <div className="taquilla-mensaje-error">



              Algún documento no pudo generarse automáticamente. El pago sigue siendo válido y puede recuperarse desde administración.



            </div>



          )}



        </div>



      )}







      <footer className="cartelera-footer">



        <div>



          <strong>



            Atlantic Cinema



          </strong>







          <span>



            Sistema de taquilla.



          </span>



        </div>







        <small>



          © 2026 Atlantic Cinema



        </small>



      </footer>







      {confirmacionVenta && (



        <div



          className="confirmacion-overlay"



          role="presentation"



          onMouseDown={



            (event) => {



              if (



                event.target



                === event.currentTarget



              ) {



                cerrarConfirmacionVenta()



              }



            }



          }



        >



          <section



            className="confirmacion-modal"



            role="dialog"



            aria-modal="true"



          >



            <div className="confirmacion-icono confirmacion-icono-compra">



              $



            </div>







            <span className="confirmacion-etiqueta">



              CONFIRMAR VENTA



            </span>







            <h2>



              ¿Crear esta venta



              de taquilla?



            </h2>







            <p className="confirmacion-descripcion">



              Revisa los datos antes



              de preparar el cobro.



            </p>







            <div className="confirmacion-resumen">



              <div>



                <span>



                  Película



                </span>







                <strong>



                  {



                    funcion



                      ?.pelicula



                      ?.titulo



                  }



                </strong>



              </div>







              <div>



                <span>



                  Asientos



                </span>







                <strong>



                  {



                    obtenerNombresAsientos()



                  }



                </strong>



              </div>







              <div>



                <span>



                  Total



                </span>







                <strong className="confirmacion-total">



                  Q



                  {



                    total



                      .toFixed(2)



                  }



                </strong>



              </div>



            </div>







            <div className="confirmacion-aviso">



              <strong>



                La venta quedará



                pendiente de pago



              </strong>







              <p>



                Los asientos serán



                bloqueados mientras se



                completa el cobro.



              </p>



            </div>







            <div className="confirmacion-acciones">



              <button



                type="button"



                className="confirmacion-cancelar"



                onClick={



                  cerrarConfirmacionVenta



                }



                disabled={



                  creandoVenta



                }



              >



                Volver



              </button>







              <button



                type="button"



                className="confirmacion-confirmar"



                onClick={crearVenta}



                disabled={



                  creandoVenta



                }



              >



                {creandoVenta



                  ? 'Creando venta...'



                  : 'Crear venta'}



              </button>



            </div>



          </section>



        </div>



      )}







      {modalPago && (



        <div



          className="confirmacion-overlay"



          role="presentation"



          onMouseDown={



            (event) => {



              if (



                event.target



                === event.currentTarget



              ) {



                cerrarPago()



              }



            }



          }



        >



          <section



            className="confirmacion-modal taquilla-pago-modal"



            role="dialog"



            aria-modal="true"



          >



            <span className="confirmacion-etiqueta">



              REGISTRAR PAGO



            </span>







            <h2>



              Completar venta



            </h2>







            <div className="taquilla-pago-total">



              <span>



                Total a cobrar



              </span>







              <strong>



                Q



                {



                  totalVenta



                    .toFixed(2)



                }



              </strong>



            </div>







            <div className="taquilla-metodos-pago">



              <button



                type="button"



                className={



                  metodoPago



                  === 'EFECTIVO'



                    ? 'taquilla-metodo activo'



                    : 'taquilla-metodo'



                }



                onClick={() => {



                  setMetodoPago(



                    'EFECTIVO'



                  )







                  setError('')



                }}



              >



                <strong>



                  Efectivo



                </strong>







                <span>



                  Cobro en caja



                </span>



              </button>







              <button



                type="button"



                className={



                  metodoPago



                  === 'TARJETA'



                    ? 'taquilla-metodo activo'



                    : 'taquilla-metodo'



                }



                onClick={() => {



                  setMetodoPago(



                    'TARJETA'



                  )







                  setError('')



                }}



              >



                <strong>



                  Tarjeta POS



                </strong>







                <span>



                  Terminal físico



                </span>



              </button>



            </div>







            {metodoPago



              === 'EFECTIVO'



              && (



                <div className="taquilla-form-pago">



                  <label>



                    Efectivo recibido







                    <input



                      type="number"



                      min="0"



                      step="0.01"



                      value={



                        efectivoRecibido



                      }



                      onChange={



                        (event) =>



                          setEfectivoRecibido(



                            event.target



                              .value



                          )



                      }



                      placeholder="0.00"



                    />



                  </label>







                  <div className="taquilla-cambio">



                    <span>



                      Cambio



                    </span>







                    <strong>



                      Q



                      {



                        cambio



                          .toFixed(2)



                      }



                    </strong>



                  </div>



                </div>



              )}







            {metodoPago



              === 'TARJETA'



              && (



                <div className="taquilla-form-pago">



                  <div className="confirmacion-aviso">



                    <strong>



                      Confirma primero



                      el cobro en el POS



                    </strong>







                    <p>



                      Registra estos datos



                      únicamente cuando el



                      terminal físico indique



                      que la transacción fue



                      aprobada.



                    </p>



                  </div>







                  <label>



                    Proveedor del POS







                    <input



                      type="text"



                      value={



                        proveedorPos



                      }



                      onChange={



                        (event) =>



                          setProveedorPos(



                            event.target



                              .value



                          )



                      }



                      placeholder="Ej. BAC, Banco Industrial, G&T Continental"



                    />



                  </label>







                  <label>



                    Número de referencia







                    <small>



                      Opcional



                    </small>







                    <input



                      type="text"



                      value={



                        referenciaPos



                      }



                      onChange={



                        (event) =>



                          setReferenciaPos(



                            event.target



                              .value



                          )



                      }



                      placeholder="Ej. 4542935758"



                    />



                  </label>







                  <label>



                    Código de autorización







                    <input



                      type="text"



                      value={



                        autorizacionPos



                      }



                      onChange={



                        (event) =>



                          setAutorizacionPos(



                            event.target



                              .value



                          )



                      }



                      placeholder="Ej. 053290"



                    />



                  </label>



                </div>



              )}







            <div className="taquilla-form-pago">



              <div className="confirmacion-aviso">



                <strong>



                  Datos de facturación



                </strong>







                <p>



                  Selecciona Consumidor Final o ingresa el NIT del cliente. El nombre fiscal se consultará automáticamente.



                </p>



              </div>







              <div className="taquilla-metodos-pago">



                <button



                  type="button"



                  className={



                    tipoFacturacion === 'CF'



                      ? 'taquilla-metodo activo'



                      : 'taquilla-metodo'



                  }



                  onClick={() => {



                    setTipoFacturacion('CF')



                    setNitReceptor('')



                    setNombreReceptor('')



                    setError('')



                  }}



                >



                  <strong>Consumidor Final</strong>



                  <span>NIT CF</span>



                </button>







                <button



                  type="button"



                  className={



                    tipoFacturacion === 'NIT'



                      ? 'taquilla-metodo activo'



                      : 'taquilla-metodo'



                  }



                  onClick={() => {



                    setTipoFacturacion('NIT')



                    setError('')



                  }}



                >



                  <strong>Facturar con NIT</strong>



                  <span>Datos del cliente</span>



                </button>



              </div>







              {tipoFacturacion === 'NIT' && (

                <>

                  <label>

                    NIT



                    <input

                      type="text"

                      value={nitReceptor}

                      onChange={(event) => {

                        setNitReceptor(

                          event.target.value

                        )

                        setNombreReceptor('')

                        setError('')

                      }}

                      onBlur={() => {

                        if (

                          nitReceptor.trim()

                          && !nombreReceptor.trim()

                          && !consultandoNit

                        ) {

                          consultarNit()

                        }

                      }}

                      placeholder="Ej. 1234567-8"

                      disabled={consultandoNit}

                    />

                  </label>







                  <button

                    type="button"

                    className="confirmacion-cancelar"

                    onClick={consultarNit}

                    disabled={

                      consultandoNit

                      || !nitReceptor.trim()

                    }

                  >

                    {consultandoNit

                      ? 'Consultando NIT...'

                      : 'Consultar NIT'}

                  </button>







                  <label>

                    Nombre fiscal



                    <input

                      type="text"

                      value={nombreReceptor}

                      readOnly

                      placeholder="Se completará automáticamente"

                    />

                  </label>

                </>

              )}



            </div>







            <div className="confirmacion-acciones">



              <button



                type="button"



                className="confirmacion-cancelar"



                onClick={cerrarPago}



                disabled={



                  registrandoPago



                }



              >



                Volver



              </button>







              <button



                type="button"



                className="confirmacion-confirmar"



                onClick={



                  registrarPago



                }



                disabled={



                  !metodoPago



                  || registrandoPago

                    || consultandoNit



                }



              >



                {registrandoPago



                  ? 'Registrando pago...'



                  : 'Confirmar pago'}



              </button>



            </div>



          </section>



        </div>



      )}



    </main>



  )



}







export default TaquillaVenta
