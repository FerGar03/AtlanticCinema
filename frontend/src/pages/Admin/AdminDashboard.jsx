import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminDashboard() {
  const { usuario, logout } = useAuth()

  const modulos = [
    {
      titulo: 'Películas',
      descripcion: 'Gestionar películas, clasificaciones y géneros.',
      ruta: '/admin/peliculas',
    },
    {
      titulo: 'Funciones',
      descripcion: 'Programar y consultar funciones del cine.',
      ruta: '/admin/funciones',
    },
    {
      titulo: 'Salas y asientos',
      descripcion: 'Consultar salas y su distribución de asientos.',
      ruta: '/admin/salas',
    },
    {
      titulo: 'Usuarios',
      descripcion: 'Administrar usuarios, roles y estados.',
      ruta: '/admin/usuarios',
    },
    {
      titulo: 'Reservas',
      descripcion: 'Consultar las reservas registradas.',
      ruta: '/admin/reservas',
    },
    {
      titulo: 'Ventas',
      descripcion: 'Consultar las ventas realizadas.',
      ruta: '/admin/ventas',
    },
    {
      titulo: 'Pagos',
      descripcion: 'Consultar pagos e intentos de pago.',
      ruta: '/admin/pagos',
    },
    {
      titulo: 'Facturas',
      descripcion: 'Consultar y gestionar la facturación.',
      ruta: '/admin/facturas',
    },
    {
      titulo: 'Tickets',
      descripcion: 'Consultar y gestionar tickets.',
      ruta: '/admin/tickets',
    },
    {
      titulo: 'Notificaciones',
      descripcion: 'Consultar las notificaciones del sistema.',
      ruta: '/admin/notificaciones',
    },
  ]

  const cerrarSesion = async () => {
    await logout()
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-marca">
          <h2>Atlantic Cinema</h2>
          <p>Administración</p>
        </div>

        <nav className="admin-menu">
          <Link to="/admin">Inicio</Link>

          {modulos.map((modulo) => (
            <Link
              key={modulo.ruta}
              to={modulo.ruta}
            >
              {modulo.titulo}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-pie">
          <Link to="/">Ver cartelera</Link>

          <button
            type="button"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-contenido">
        <header className="admin-encabezado">
          <div>
            <p className="admin-etiqueta">PANEL ADMINISTRATIVO</p>
            <h1>Bienvenido, {usuario?.nombres}</h1>
            <p>
              Desde este panel podrás administrar las principales
              operaciones de Atlantic Cinema.
            </p>
          </div>

          <div className="admin-usuario">
            <strong>
              {usuario?.nombres} {usuario?.apellidos}
            </strong>
            <span>{usuario?.rol?.nombre}</span>
          </div>
        </header>

        <section className="admin-dashboard">
          <h2>Módulos del sistema</h2>

          <div className="admin-modulos-grid">
            {modulos.map((modulo) => (
              <Link
                className="admin-modulo-card"
                key={modulo.ruta}
                to={modulo.ruta}
              >
                <h3>{modulo.titulo}</h3>
                <p>{modulo.descripcion}</p>
                <span>Administrar →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminDashboard