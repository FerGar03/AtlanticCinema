import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../../context/AuthContext'

import logoAtlantic
  from '../../assets/branding/atlantic-cinema-logo.png'

function AdminSidebar() {
  const navigate = useNavigate()

  const {
    logout,
  } = useAuth()

  const modulos = [
    {
      titulo: 'Películas',
      ruta: '/admin/peliculas',
    },
    {
      titulo: 'Funciones',
      ruta: '/admin/funciones',
    },
    {
      titulo: 'Salas y asientos',
      ruta: '/admin/salas',
    },
    {
      titulo: 'Usuarios',
      ruta: '/admin/usuarios',
    },
    {
      titulo: 'Reservas',
      ruta: '/admin/reservas',
    },
    {
      titulo: 'Ventas',
      ruta: '/admin/ventas',
    },
    {
      titulo: 'Pagos',
      ruta: '/admin/pagos',
    },
    {
      titulo: 'Facturas',
      ruta: '/admin/facturas',
    },
    {
      titulo: 'Tickets',
      ruta: '/admin/tickets',
    },
    {
      titulo: 'Notificaciones',
      ruta: '/admin/notificaciones',
    },
    {
      titulo: 'Reportes',
      ruta: '/admin/reportes',
    },
  ]

  const obtenerClaseMenu = ({
    isActive,
  }) =>
    isActive
      ? 'admin-menu-enlace admin-menu-activo'
      : 'admin-menu-enlace'

  const cerrarSesion = async () => {
    try {
      await logout()
    } finally {
      navigate('/')
    }
  }

  return (
    <aside className="admin-sidebar admin-sidebar-final">
      <div className="admin-sidebar-superior">
        <Link
          to="/admin"
          className="admin-marca admin-marca-link admin-marca-final"
        >
          <div className="admin-sidebar-logo">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
            />
          </div>

          <div className="admin-sidebar-marca-texto">
            <strong>
              Atlantic Cinema
            </strong>

            <span>
              Administración
            </span>
          </div>
        </Link>

        <div className="admin-sidebar-separador" />

        <nav
          className="admin-menu admin-menu-final"
          aria-label="Navegación administrativa"
        >
          <NavLink
            to="/admin"
            end
            className={
              obtenerClaseMenu
            }
          >
            <span className="admin-menu-texto">
              Panel principal
            </span>
          </NavLink>

          <div className="admin-menu-grupo-titulo">
            Gestión
          </div>

          {modulos.map(
            (modulo) => (
              <NavLink
                key={modulo.ruta}
                to={modulo.ruta}
                className={
                  obtenerClaseMenu
                }
              >
                <span className="admin-menu-texto">
                  {modulo.titulo}
                </span>
              </NavLink>
            )
          )}
        </nav>
      </div>

      <div className="admin-sidebar-pie admin-sidebar-pie-final">
        <span className="admin-sidebar-pie-etiqueta">
          CUENTA
        </span>

        <Link
          to="/perfil"
          className="admin-sidebar-pie-enlace"
        >
          <span>
            Mi perfil
          </span>

          <span>
            →
          </span>
        </Link>

        <Link
          to="/"
          className="admin-sidebar-pie-enlace"
        >
          <span>
            Volver al inicio
          </span>

          <span>
            →
          </span>
        </Link>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={
            cerrarSesion
          }
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar