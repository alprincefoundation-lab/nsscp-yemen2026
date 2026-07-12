'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthUser {
  id: string
  fullName: string
  rank: string
  role: string
  department: string
  roles: string[]
}

interface AuthContextType {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('nsscp_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('nsscp_user') }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ militaryId: username, password }),
      })
      const json = await res.json()
      if (json.success && json.data?.user) {
        const authUser: AuthUser = {
          id: json.data.user.id,
          fullName: json.data.user.fullName,
          rank: json.data.user.rank,
          role: json.data.user.roles?.[0] || 'OFFICER',
          department: json.data.user.department,
          roles: json.data.user.roles || [],
        }
        setUser(authUser)
        localStorage.setItem('nsscp_user', JSON.stringify(authUser))
        if (json.data.accessToken) {
          localStorage.setItem('nsscp_token', json.data.accessToken)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('nsscp_user')
    localStorage.removeItem('nsscp_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}