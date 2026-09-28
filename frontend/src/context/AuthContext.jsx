import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({
  children,
}) {
  const [
    usuario,
    setUsuario,
  ] = useState(null)

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const obtenerUsuario =
    useCallback(
      async () => {
        const response =
          await api.get(
            '/auth/usuario'
          )

        const data =
          response.data.data
          ?? response.data

        const usuarioAutenticado =
          data.usuario
          ?? data

        setUsuario(
          usuarioAutenticado
        )

        return usuarioAutenticado
      },
      []
    )

  useEffect(() => {
    const cargarUsuario =
      async () => {
        const token =
          localStorage.getItem(
            'token'
          )

        if (
          !token
          || token === 'undefined'
          || token === 'null'
        ) {
          localStorage.removeItem(
            'token'
          )

          setUsuario(null)
          setCargando(false)

          return
        }

        try {
          await obtenerUsuario()
        } catch {
          localStorage.removeItem(
            'token'
          )

          setUsuario(null)
        } finally {
          setCargando(false)
        }
      }

    cargarUsuario()
  }, [obtenerUsuario])

  const guardarSesion =
    useCallback(
      async (token) => {
        if (
          !token
          || token === 'undefined'
          || token === 'null'
        ) {
          throw new Error(
            'No se recibió un token de autenticación válido.'
          )
        }

        localStorage.setItem(
          'token',
          token
        )

        try {
          return await obtenerUsuario()
        } catch (error) {
          localStorage.removeItem(
            'token'
          )

          setUsuario(null)

          throw error
        }
      },
      [obtenerUsuario]
    )

  const login =
    useCallback(
      async (credenciales) => {
        const response =
          await api.post(
            '/auth/login',
            credenciales
          )

        const data =
          response.data.data
          ?? response.data

        const token =
          data.token

        if (!token) {
          throw new Error(
            'No se recibió un token de autenticación válido.'
          )
        }

        localStorage.setItem(
          'token',
          token
        )

        setUsuario(
          data.usuario
        )

        return data
      },
      []
    )

  const registro =
    useCallback(
      async (datos) => {
        const response =
          await api.post(
            '/auth/registro',
            datos
          )

        const data =
          response.data.data
          ?? response.data

        const token =
          data.token

        if (!token) {
          throw new Error(
            'No se recibió un token de autenticación válido.'
          )
        }

        localStorage.setItem(
          'token',
          token
        )

        setUsuario(
          data.usuario
        )

        return data
      },
      []
    )

  const actualizarPerfil =
    useCallback(
      async (datos) => {
        const response =
          await api.patch(
            '/auth/perfil',
            datos
          )

        const data =
          response.data.data
          ?? response.data

        setUsuario(data)

        return data
      },
      []
    )

  const actualizarAvatar =
    useCallback(
      async (archivo) => {
        const formulario =
          new FormData()

        formulario.append(
          'avatar',
          archivo
        )

        const response =
          await api.post(
            '/auth/perfil/avatar',
            formulario
          )

        const data =
          response.data.data
          ?? response.data

        setUsuario(data)

        return data
      },
      []
    )

  const cambiarPassword =
    useCallback(
      async (datos) => {
        const response =
          await api.patch(
            '/auth/password',
            datos
          )

        return response.data
      },
      []
    )

  const logout =
    useCallback(
      async () => {
        try {
          await api.post(
            '/auth/logout'
          )
        } finally {
          localStorage.removeItem(
            'token'
          )

          setUsuario(null)
        }
      },
      []
    )

  const autenticado =
    Boolean(usuario)

  const valorContexto =
    useMemo(
      () => ({
        usuario,
        cargando,
        autenticado,
        login,
        registro,
        guardarSesion,
        obtenerUsuario,
        actualizarPerfil,
        actualizarAvatar,
        cambiarPassword,
        logout,
      }),
      [
        usuario,
        cargando,
        autenticado,
        login,
        registro,
        guardarSesion,
        obtenerUsuario,
        actualizarPerfil,
        actualizarAvatar,
        cambiarPassword,
        logout,
      ]
    )

  return (
    <AuthContext.Provider
      value={valorContexto}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}