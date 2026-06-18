import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { apiClient } from '../api'

interface User {
  id: number
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, passwordConfirm: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'heliometrica_token'

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const data = await apiClient.get<User>('/auth/me/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(data)
    } catch {
      setStoredToken(null)
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiClient.post<{ access: string; refresh: string }>(
      '/auth/login/',
      { username, password },
    )
    setStoredToken(data.access)
    setToken(data.access)
    const userData = await apiClient.get<User>('/auth/me/', {
      headers: { Authorization: `Bearer ${data.access}` },
    })
    setUser(userData)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string, passwordConfirm: string) => {
    await apiClient.post('/auth/register/', {
      username, email, password,
      password_confirm: passwordConfirm,
    })
    await login(username, password)
  }, [login])

  const logout = useCallback(() => {
    setStoredToken(null)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
