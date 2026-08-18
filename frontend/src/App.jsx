import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Cartelera from './pages/Cartelera'
import FuncionDetalle from './pages/FuncionDetalle'
import ReservaDetalle from './pages/ReservaDetalle'
import TaquillaReservas from './pages/TaquillaReservas'
import TaquillaReservaDetalle from './pages/TaquillaReservaDetalle'
import PagoCompra from './pages/PagoCompra'
import { useAuth } from './context/AuthContext'

function RutaPublica({ children }) {
  const {
    autenticado,
    cargando,
  } = useAuth()

  if (cargando) {
    return <p>Cargando...</p>
  }

  if (autenticado) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return children
}

function RutaProtegida({ children }) {
  const {
    autenticado,
    cargando,
  } = useAuth()

  if (cargando) {
    return <p>Cargando...</p>
  }

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return children
}

function RutaPersonal({ children }) {
  const {
    autenticado,
    cargando,
    usuario,
  } = useAuth()

  if (cargando) {
    return <p>Cargando...</p>
  }

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  const rol =
    usuario?.rol?.nombre

  const personalAutorizado = [
    'Administrador',
    'Empleado',
  ].includes(rol)

  if (!personalAutorizado) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Cartelera />}
      />

      <Route
        path="/funciones/:id"
        element={<FuncionDetalle />}
      />

      <Route
        path="/reservas/:id"
        element={
          <RutaProtegida>
            <ReservaDetalle />
          </RutaProtegida>
        }
      />

      <Route
        path="/compras/:ventaId/pago"
        element={
          <RutaProtegida>
            <PagoCompra />
          </RutaProtegida>
        }
      />

      <Route
        path="/taquilla/reservas"
        element={
          <RutaPersonal>
            <TaquillaReservas />
          </RutaPersonal>
        }
      />

      <Route
        path="/taquilla/reservas/:id"
        element={
          <RutaPersonal>
            <TaquillaReservaDetalle />
          </RutaPersonal>
        }
      />

      <Route
        path="/login"
        element={
          <RutaPublica>
            <Login />
          </RutaPublica>
        }
      />

      <Route
        path="/registro"
        element={
          <RutaPublica>
            <Registro />
          </RutaPublica>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App