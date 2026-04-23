'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SessionPayload } from '@/lib/types'

interface AppContextType {
  user: SessionPayload | null
  token: string | null
  login: (token: string, user: SessionPayload) => void
  logout: () => void
  authHeader: () => Record<string, string>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionPayload | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('session_token')
    const storedUser = localStorage.getItem('session_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  function login(newToken: string, newUser: SessionPayload) {
    localStorage.setItem('session_token', newToken)
    localStorage.setItem('session_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('session_token')
    localStorage.removeItem('session_user')
    setToken(null)
    setUser(null)
  }

  function authHeader(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return (
    <AppContext.Provider value={{ user, token, login, logout, authHeader }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
