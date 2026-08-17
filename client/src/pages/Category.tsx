import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Category, Product } from '../api/types'
import { FilterPanel, type FilterValues } from '../components/FilterPanel'
import { ProductGrid } from '../components/ProductGrid'
import { Pagination } from '../components/Pagination'
import { ProductQuickView } from '../components/ProductQuickView'
import { ErrorState, LoadingState } from '../components/States'
import { ShowroomExperience } from '../showroom/ShowroomExperience'
import { useShowroom } from '../showroom/ShowroomProvider'
import { useProductSearch } from '../hooks/useProductSearch'

const LIMIT = 12

export default function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [params, setParams] = useSearchParams()
  const { scenes } = useShowroom()

  const [category, setCategory] = useState<Category | null>(null)
  const [loadingCategory, setLoadingCategory] = useState(true)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [quickView, setQuickView] = useState<Product | null>(null)

  const filterValues = useMemo<FilterValues>(
    () => ({
      q: params.get('q') || '',
      category: params.get('category') || '',
      priceMin: params.get('priceMin') || '',
      priceMax: params.get('priceMax') || '',
      availability: params.get('availability') || '',
      featured: params.get('featured') === '1',
      sort: params.get('sort') || 'featured',
    }),
    [params]
  )

  useEffect(() => {
    let mounted = true
    setLoadingCategory(true)
    setCategoryError(null)
    api
      .getCategory(slug)
      .then((c) => {
        if (mounted) setCategory(c)
      })
      .catch(() => {
        if (mounted) setCategoryError('This collection could not be found.')
      })
      .finally(() => {
        if (mounted) setLoadingCategory(false)
      })
    return () => {
      mounted = false
    }
  }, [slug])

  useEffect(() => {
    setPage(1)
  }, [filterValues, slug])

  const searchFilters = useMemo(
    () => ({
      category: slug,
      q: filterValues.q || undefined,
      priceMin: filterValues.priceMin ? Number(filterValues.priceMin) : undefined,
      priceMax: filterValues.priceMax ? Number(filterValues.priceMax) : undefined,
      availability: filterValues.availability || undefined,
      featured: filterValues.featured || undefined,
      sort: filterValues.sort,
    }),
    [slug, filterValues]
  )

  const { items, total, pages, loading, error, reload } = useProductSearch(searchFilters, LIMIT, page)

  const updateFilters = useCallback(
    (next: FilterValues) => {
      const p: Record<string, string> = {}
      if (next.q) p.q = next.q
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

  const changePage = useCallback(
    (p: number) => {
      setPage(p)
      setParams({ ...Object.fromEntries(params.entries()), page: p > 1 ? String(p) : '' }, { replace: true })
    },
    [setParams, params]
  )

  const scene = scenes.find((s) => s.category?.slug === slug) || null

  if (loadingCategory) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Loading collection…" />
        </div>
      </section>
    )
  }

  if (categoryError || !category) {
    return (
      <section className="section">
        <div className="container">
          <ErrorState
            title="Collection not found"
            description={categoryError || 'This collection is no longer available.'}
            action={
              <Link to="/products" className="btn btn--dark">
                Browse all pieces
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  const isDisplay = category.type === 'display'

  return (
    <>
      <section className="section section--tight" style={{ paddingBottom: 0 }}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/products">Collection</Link>
            <span className="sep">/</span>
            <span>{category.name}</span>
          </nav>

          {isDisplay ? (
            <>
              <ShowroomExperience scene={scene || undefined} variant="featured" eyebrow="Bespoke & Commissions" />
              <hr className="divider" />
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginBottom: 28 }}>
              <h1 className="page-title">{category.name}</h1>
              <p className="page-sub">{category.description}</p>
              <span className="muted" style={{ fontSize: 13 }}>
                {total} piece{total === 1 ? '' : 's'} in this collection
              </span>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <FilterPanel values={filterValues} onChange={updateFilters} categories={[]} onClear={clearFilters} showCategory={false} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <span className="muted" style={{ fontSize: 13.5 }}>
              {loading ? 'Searching…' : `${total} piece${total === 1 ? '' : 's'}`}
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

          <ProductGrid products={items} loading={loading} error={error} onRetry={() => reload()} onQuickView={setQuickView} />

          <Pagination page={page} pages={pages} onChange={changePage} />
        </div>
      </section>

      <ProductQuickView product={quickView} open={!!quickView} onClose={() => setQuickView(null)} />
    </>
  )
}
