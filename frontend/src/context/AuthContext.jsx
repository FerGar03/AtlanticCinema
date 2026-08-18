import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarUsuario = async () => {
      const token = localStorage.getItem('token')

      if (!token || token === 'undefined') {
        localStorage.removeItem('token')
        setCargando(false)
        return
      }

      try {
        const response = await api.get('/auth/usuario')

        const data = response.data.data ?? response.data

        setUsuario(data.usuario ?? data)
      } catch {
        localStorage.removeItem('token')
        setUsuario(null)
      } finally {
        setCargando(false)
      }
    }

    cargarUsuario()
  }, [])

  const login = async (credenciales) => {
    const response = await api.post('/auth/login', credenciales)

    const data = response.data.data ?? response.data

    const token = data.token
    const usuarioAutenticado = data.usuario

    localStorage.setItem('token', token)
    setUsuario(usuarioAutenticado)

    return data
  }

  const registro = async (datos) => {
    const response = await api.post('/auth/registro', datos)

    const data = response.data.data ?? response.data

    const token = data.token
    const usuarioRegistrado = data.usuario

    localStorage.setItem('token', token)
    setUsuario(usuarioRegistrado)

    return data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      setUsuario(null)
    }
  }

  const autenticado = Boolean(usuario)

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        autenticado,
        login,
        registro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return context
}