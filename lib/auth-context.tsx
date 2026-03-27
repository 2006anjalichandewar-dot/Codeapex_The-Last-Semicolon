"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

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

// Simulated user database
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "john@company.com": {
    password: "password123",
    user: {
      id: "user-1",
      name: "John Doe",
      email: "john@company.com",
    },
  },
}

const AUTH_STORAGE_KEY = "zerotrust-auth"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const normalizedEmail = email.toLowerCase()
    const existingUser = MOCK_USERS[normalizedEmail]

    if (existingUser && existingUser.password === password) {
      setUser(existingUser.user)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(existingUser.user))
      return { success: true }
    }

    // For demo: allow any valid email/password combo
    if (email && password.length >= 6) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: normalizedEmail,
      }
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return { success: true }
    }

    return { success: false, error: "Invalid email or password" }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (!name || name.length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email" }
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    const normalizedEmail = email.toLowerCase()

    // Check if user exists
    if (MOCK_USERS[normalizedEmail]) {
      return { success: false, error: "An account with this email already exists" }
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email: normalizedEmail,
    }

    // Add to mock database
    MOCK_USERS[normalizedEmail] = { password, user: newUser }

    setUser(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
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
