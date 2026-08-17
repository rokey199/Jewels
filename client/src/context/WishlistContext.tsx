import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface WishlistContextValue {
  ids: string[]
  toggle: (id: string) => void
  isWishlisted: (id: string) => boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

const KEY = 'md_wishlist'

function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      // storage unavailable — wishlist is non-critical
    }
  }, [ids])

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const isWishlisted = useCallback((id: string) => ids.includes(id), [ids])

  const value = useMemo(() => ({ ids, toggle, isWishlisted }), [ids, toggle, isWishlisted])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
