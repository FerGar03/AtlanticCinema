import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Registro() {
  const navigate = useNavigate()
  const { registro } = useAuth()

  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    password: '',
    password_confirmation: '',
    telefono: '',
    nit: '',
    direccion: '',
    nombre_dispositivo: 'Atlantic Cinema Web',
  })

  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const manejarCambio = (event) => {
    const { name, value } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }))
  }

  const manejarSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setEnviando(true)

    try {
      await registro(formulario)
      navigate('/')
    } catch (err) {
      const errores = err.response?.data?.errors

      if (errores) {
        const mensajes = Object.values(errores).flat()
        setError(mensajes.join(' '))
      } else {
        setError(
          err.response?.data?.message ||
            'No fue posible completar el registro.',
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main>
      <h1>Atlantic Cinema</h1>
      <h2>Crear cuenta</h2>

      {error && <p>{error}</p>}

      <form onSubmit={manejarSubmit}>
        <div>
          <label htmlFor="nombres">Nombres</label>
          <input
            id="nombres"
            name="nombres"
            type="text"
            value={formulario.nombres}
            onChange={manejarCambio}
            required
          />
        </div>

        <div>
          <label htmlFor="apellidos">Apellidos</label>
          <input
            id="apellidos"
            name="apellidos"
            type="text"
            value={formulario.apellidos}
            onChange={manejarCambio}
            required
          />
        </div>

        <div>
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            name="correo"
            type="email"
            value={formulario.correo}
            onChange={manejarCambio}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formulario.password}
            onChange={manejarCambio}
            required
          />
        </div>

        <div>
          <label htmlFor="password_confirmation">
            Confirmar contraseña
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            value={formulario.password_confirmation}
            onChange={manejarCambio}
            required
          />
        </div>

        <div>
          <label htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            name="telefono"
            type="text"
            value={formulario.telefono}
            onChange={manejarCambio}
          />
        </div>

        <div>
          <label htmlFor="nit">NIT</label>
          <input
            id="nit"
            name="nit"
            type="text"
            value={formulario.nit}
            onChange={manejarCambio}
          />
        </div>

        <div>
          <label htmlFor="direccion">Dirección</label>
          <input
            id="direccion"
            name="direccion"
            type="text"
            value={formulario.direccion}
            onChange={manejarCambio}
          />
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <p>
        ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </main>
  )
}

export default Registro