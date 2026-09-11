import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './context/AuthContext'

import Cartelera from './pages/Cartelera'
import FuncionDetalle from './pages/FuncionDetalle'
import Login from './pages/Login'
import PagoCompra from './pages/PagoCompra'
import Registro from './pages/Registro'
import ReservaDetalle from './pages/ReservaDetalle'
import TaquillaReservaDetalle from './pages/TaquillaReservaDetalle'
import TaquillaReservas from './pages/TaquillaReservas'

import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminFacturas from './pages/Admin/AdminFacturas'
import AdminFunciones from './pages/Admin/AdminFunciones'
import AdminNotificaciones from './pages/Admin/AdminNotificaciones'
import AdminPagos from './pages/Admin/AdminPagos'
import AdminPeliculas from './pages/Admin/AdminPeliculas'
import AdminReportes from './pages/Admin/AdminReportes'
import AdminReservas from './pages/Admin/AdminReservas'
import AdminSalas from './pages/Admin/AdminSalas'
import AdminTickets from './pages/Admin/AdminTickets'
import AdminUsuarios from './pages/Admin/AdminUsuarios'
import AdminVentas from './pages/Admin/AdminVentas'

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

  const rol = usuario?.rol?.nombre

  if (
    rol !== 'Administrador'
    && rol !== 'Empleado'
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return children
}

function RutaAdministrador({ children }) {
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

  const rol = usuario?.rol?.nombre

  if (rol !== 'Administrador') {
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
        path="/login"
        element={<Login />}
      />

      <Route
        path="/registro"
        element={<Registro />}
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
        path="/admin"
        element={
          <RutaAdministrador>
            <AdminDashboard />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/peliculas"
        element={
          <RutaAdministrador>
            <AdminPeliculas />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/funciones"
        element={
          <RutaAdministrador>
            <AdminFunciones />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/salas"
        element={
          <RutaAdministrador>
            <AdminSalas />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/usuarios"
        element={
          <RutaAdministrador>
            <AdminUsuarios />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/reservas"
        element={
          <RutaAdministrador>
            <AdminReservas />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/ventas"
        element={
          <RutaAdministrador>
            <AdminVentas />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/pagos"
        element={
          <RutaAdministrador>
            <AdminPagos />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/facturas"
        element={
          <RutaAdministrador>
            <AdminFacturas />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/tickets"
        element={
          <RutaAdministrador>
            <AdminTickets />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/notificaciones"
        element={
          <RutaAdministrador>
            <AdminNotificaciones />
          </RutaAdministrador>
        }
      />

      <Route
        path="/admin/reportes"
        element={
          <RutaAdministrador>
            <AdminReportes />
          </RutaAdministrador>
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