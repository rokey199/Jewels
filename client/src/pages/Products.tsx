import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Category, Product } from '../api/types'
import { FilterPanel, type FilterValues } from '../components/FilterPanel'
import { ProductGrid } from '../components/ProductGrid'
import { Pagination } from '../components/Pagination'
import { ProductQuickView } from '../components/ProductQuickView'
import { useProductSearch } from '../hooks/useProductSearch'

const LIMIT = 12

function filtersFromParams(params: URLSearchParams): FilterValues {
  return {
    q: params.get('q') || '',
    category: params.get('category') || '',
    priceMin: params.get('priceMin') || '',
    priceMax: params.get('priceMax') || '',
    availability: params.get('availability') || '',
    featured: params.get('featured') === '1',
    sort: params.get('sort') || 'featured',
  }
}

export default function Products() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => filtersFromParams(params), [params])
  const [page, setPage] = useState(() => Math.max(1, parseInt(params.get('page') || '1', 10) || 1))
  const [categories, setCategories] = useState<Category[]>([])
  const [quickView, setQuickView] = useState<Product | null>(null)

  useEffect(() => {
    api.getCategories({ type: 'all' }).then((r) => setCategories(r.items)).catch(() => {})
  }, [])

  const searchFilters = useMemo(
    () => ({
      q: filters.q || undefined,
      category: filters.category || undefined,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      availability: filters.availability || undefined,
      featured: filters.featured || undefined,
      sort: filters.sort,
    }),
    [filters]
  )

  const { items, total, pages, loading, error, reload } = useProductSearch(searchFilters, LIMIT, page)

  const updateFilters = useCallback(
    (next: FilterValues) => {
      const p: Record<string, string> = {}
      if (next.q) p.q = next.q
      if (next.category) p.category = next.category
      if (next.priceMin) p.priceMin = next.priceMin
      if (next.priceMax) p.priceMax = next.priceMax
      if (next.availability) p.availability = next.availability
      if (next.featured) p.featured = '1'
      if (next.sort && next.sort !== 'featured') p.sort = next.sort
      setParams(p, { replace: true })
      setPage(1)
    },
    [setParams]
  )

  const clearFilters = useCallback(() => {
    setParams({}, { replace: true })
    setPage(1)
  }, [setParams])

  const setSort = (sort: string) => updateFilters({ ...filters, sort })

  const changePage = useCallback(
    (p: number) => {
      setPage(p)
      setParams(
        {
          ...Object.fromEntries(params.entries()),
          page: p > 1 ? String(p) : '',
        },
        { replace: true }
      )
    },
    [setParams, params]
  )

  return (
    <>
      <section className="section section--tight" style={{ paddingBottom: 0 }}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span className="sep">/</span>
            <span>Collection</span>
          </nav>
          <h1 className="page-title">The Collection</h1>
          <p className="page-sub">
            Every piece is designed, cast and finished by hand in our atelier. Filter by category,
            stone, metal and price — or search for something specific.
          </p>

          <div style={{ marginTop: 28 }}>
            <FilterPanel values={filters} onChange={updateFilters} categories={categories} onClear={clearFilters} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <span className="muted" style={{ fontSize: 13.5 }}>
              {loading ? 'Searching…' : `${total} piece${total === 1 ? '' : 's'}`}
            </span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label htmlFor="sort" className="qty-label">Sort</label>
              <select id="sort" className="select sort-select" value={filters.sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name A–Z</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>

          <ProductGrid products={items} loading={loading} error={error} onRetry={() => reload()} onQuickView={setQuickView} />

          <Pagination page={page} pages={pages} onChange={changePage} />
        </div>
      </section>

      <ProductQuickView product={quickView} open={!!quickView} onClose={() => setQuickView(null)} />
    </>
  )
}
