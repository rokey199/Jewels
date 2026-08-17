import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Customer } from '../api/types'

interface AuthContextValue {
  customer: Customer | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<Customer>
  register: (payload: { name: string; email: string; phone?: string; password: string }) => Promise<Customer>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setCustomer: (c: Customer) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await api.me()
      setCustomerState(res.customer)
    } catch {
      setCustomerState(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    setCustomerState(res.customer)
    return res.customer
  }, [])

  const register = useCallback(async (payload: { name: string; email: string; phone?: string; password: string }) => {
    const res = await api.register(payload)
    setCustomerState(res.customer)
    return res.customer
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setCustomerState(null)
    }
  }, [])

  const setCustomer = useCallback((c: Customer) => setCustomerState(c), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      customer,
      loading,
      isAdmin: customer?.role === 'admin',
      login,
      register,
      logout,
      refresh,
      setCustomer,
    }),
    [customer, loading, login, register, logout, refresh, setCustomer]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
