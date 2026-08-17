import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface ToastItem {
  id: number
  title: string
  message?: string
  tone: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toasts: ToastItem[]
  toast: (title: string, message?: string, tone?: ToastItem['tone']) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (title: string, message?: string, tone: ToastItem['tone'] = 'info') => {
      const id = nextId++
      setToasts((prev) => [...prev.slice(-4), { id, title, message, tone }])
      window.setTimeout(() => dismiss(id), 5200)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
