import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Category, Product } from '../api/types'
import { api } from '../api/client'
import { useSettings } from '../context/SettingsContext'
import { buildShowroomScene, type ShowroomScene } from './types'

interface ShowroomProviderValue {
  scenes: ShowroomScene[]
  featuredProducts: Product[]
  categories: Category[]
  loading: boolean
  showroomEnabled: boolean
}

const ShowroomContext = createContext<ShowroomProviderValue | null>(null)

/**
 * Loads the showroom data model — display categories plus the top products per
 * room. It never fetches 3D assets; the scene data is the contract the future
 * 3D showroom module will consume.
 */
export function ShowroomProvider({ children }: { children: ReactNode }) {
  const { showroomEnabled } = useSettings()
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      api.getCategories({ type: 'all' }),
      api.getProducts({ featured: true, limit: 12 }),
    ])
      .then(([catRes, prodRes]) => {
        if (!mounted) return
        setCategories(catRes.items)
        setFeaturedProducts(prodRes.items)
      })
      .catch(() => {
        // non-critical; the 2D experience falls back to defaults
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const scenes = useMemo<ShowroomScene[]>(() => {
    return categories.map((c, i) => {
      const top = featuredProducts.filter((p) => p.categoryId === c.id).slice(0, 5)
      const pooled = top.length > 0 ? top : featuredProducts.slice(0, 5)
      return buildShowroomScene(c, pooled, i)
    })
  }, [categories, featuredProducts])

  const value = useMemo(
    () => ({ scenes, featuredProducts, categories, loading, showroomEnabled }),
    [scenes, featuredProducts, categories, loading, showroomEnabled]
  )

  return <ShowroomContext.Provider value={value}>{children}</ShowroomContext.Provider>
}

export function useShowroom(): ShowroomProviderValue {
  const ctx = useContext(ShowroomContext)
  if (!ctx) throw new Error('useShowroom must be used within ShowroomProvider')
  return ctx
}
