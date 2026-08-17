import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Product, ProductFilters } from '../api/types'

export interface ProductSearchState {
  items: Product[]
  total: number
  pages: number
  page: number
  limit: number
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Centralized product listing logic powering Homepage, Products, Category and
 * Search — one data path, no duplicated fetching.
 */
export function useProductSearch(filters: ProductFilters, limit = 12, page = 1): ProductSearchState {
  const [items, setItems] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const res = await api.getProducts({ ...filters, page, limit })
      if (id !== requestId.current) return
      setItems(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) {
      if (id !== requestId.current) return
      setError(err instanceof Error ? err.message : 'Could not load pieces')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [filters, page, limit])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, total, pages, page, limit, loading, error, reload }
}
