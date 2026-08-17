import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Category, Product } from '../api/types'
import { api } from '../api/client'
import { SearchBar } from '../components/SearchBar'
import { ProductGrid } from '../components/ProductGrid'
import { Pagination } from '../components/Pagination'
import { ProductQuickView } from '../components/ProductQuickView'
import { useProductSearch } from '../hooks/useProductSearch'
import { FilterPanel, type FilterValues } from '../components/FilterPanel'

const LIMIT = 12

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''

  const [page, setPage] = useState(1)
  const [quickView, setQuickView] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const filterValues = useMemo<FilterValues>(
    () => ({
      q,
      category: params.get('category') || '',
      priceMin: params.get('priceMin') || '',
      priceMax: params.get('priceMax') || '',
      availability: params.get('availability') || '',
      featured: params.get('featured') === '1',
      sort: params.get('sort') || 'featured',
    }),
    [q, params]
  )

  useEffect(() => {
    api.getCategories({ type: 'all' }).then((r) => setCategories(r.items)).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(1)
  }, [q])

  const searchFilters = useMemo(
    () => ({
      q: q || undefined,
      category: filterValues.category || undefined,
      priceMin: filterValues.priceMin ? Number(filterValues.priceMin) : undefined,
      priceMax: filterValues.priceMax ? Number(filterValues.priceMax) : undefined,
      availability: filterValues.availability || undefined,
      featured: filterValues.featured || undefined,
      sort: filterValues.sort,
    }),
    [q, filterValues]
  )

  const { items, total, pages, loading, error, reload } = useProductSearch(searchFilters, LIMIT, page)

  const updateFilters = useCallback(
    (next: FilterValues) => {
      const p: Record<string, string> = {}
      if (q) p.q = q
      if (next.category) p.category = next.category
      if (next.priceMin) p.priceMin = next.priceMin
      if (next.priceMax) p.priceMax = next.priceMax
      if (next.availability) p.availability = next.availability
      if (next.featured) p.featured = '1'
      if (next.sort && next.sort !== 'featured') p.sort = next.sort
      setParams(p, { replace: true })
      setPage(1)
    },
    [setParams, q]
  )

  const changePage = useCallback(
    (p: number) => {
      setPage(p)
      setParams({ ...Object.fromEntries(params.entries()), page: p > 1 ? String(p) : '' }, { replace: true })
    },
    [setParams, params]
  )

  return (
    <section className="section section--tight">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <span>Search</span>
        </nav>

        <h1 className="page-title">Search the collection</h1>
        <div style={{ maxWidth: 640, margin: '20px 0 30px' }}>
          <SearchBar
            initialValue={q}
            onSearch={(next) => {
              const p: Record<string, string> = {}
              if (next) p.q = next
              setParams(p, { replace: true })
              setPage(1)
            }}
            size="lg"
          />
        </div>

        {q && (
          <>
            <div style={{ marginBottom: 24 }}>
              <FilterPanel
                values={filterValues}
                onChange={updateFilters}
                categories={categories}
                onClear={() => setParams({ q }, { replace: true })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <span className="muted" style={{ fontSize: 13.5 }}>
                {loading ? 'Searching…' : `${total} result${total === 1 ? '' : 's'} for “${q}”`}
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label htmlFor="sort" className="qty-label">Sort</label>
                <select id="sort" className="select sort-select" value={filterValues.sort} onChange={(e) => updateFilters({ ...filterValues, sort: e.target.value })}>
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name A–Z</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
            </div>

            <ProductGrid
              products={items}
              loading={loading}
              error={error}
              onRetry={() => reload()}
              onQuickView={setQuickView}
              emptyTitle="Nothing matched your search"
              emptyDescription="Try a different keyword, or browse the full collection."
            />
            <Pagination page={page} pages={pages} onChange={changePage} />
          </>
        )}
      </div>

      <ProductQuickView product={quickView} open={!!quickView} onClose={() => setQuickView(null)} />
    </section>
  )
}
