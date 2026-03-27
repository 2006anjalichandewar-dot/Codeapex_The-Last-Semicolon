"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { apiFetch } from "@/lib/api"
import { clearStoredUser, clearToken, getStoredUser, getToken, setStoredUser, setToken } from "@/lib/token"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwt(token: string): { sub?: string } {
  try {
    const payload = token.split(".")[1]
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const stored = getStoredUser()
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      } catch {
        clearStoredUser()
        clearToken()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiFetch<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      setToken(res.access_token)
      const jwt = parseJwt(res.access_token)
      const newUser: User = {
        id: jwt.sub || "",
        name: email.split("@")[0],
        email,
      }
      setUser(newUser)
      setStoredUser(JSON.stringify(newUser))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || "Login failed" }
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      return await login(email, password)
    } catch (err: any) {
      return { success: false, error: err.message || "Signup failed" }
    }
  }, [login])

  const logout = useCallback(() => {
    setUser(null)
    clearStoredUser()
    clearToken()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
