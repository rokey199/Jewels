import type { Category } from '../api/types'
import { AVAILABILITY_OPTIONS, classNames } from '../lib/format'

export interface FilterValues {
  q?: string
  category?: string
  priceMin?: string
  priceMax?: string
  availability?: string
  featured?: boolean
  sort: string
}

export function FilterPanel({
  values,
  onChange,
  categories,
  onClear,
  showCategory = true,
}: {
  values: FilterValues
  onChange: (next: FilterValues) => void
  categories: Category[]
  onClear: () => void
  showCategory?: boolean
}) {
  const set = (patch: Partial<FilterValues>) => onChange({ ...values, ...patch })

  const hasFilters =
    Boolean(values.q) ||
    Boolean(values.category) ||
    Boolean(values.priceMin) ||
    Boolean(values.priceMax) ||
    Boolean(values.availability) ||
    Boolean(values.featured)

  return (
    <div className="filter-drawer">
      <div className="filter-drawer__grid">
        <div className="field">
          <label htmlFor="f-q">Search</label>
          <input
            id="f-q"
            className="input"
            placeholder="Search pieces…"
            value={values.q || ''}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>

        {showCategory && (
          <div className="field">
            <label htmlFor="f-cat">Category</label>
            <select
              id="f-cat"
              className="select"
              value={values.category || ''}
              onChange={(e) => set({ category: e.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="f-price">Price Range</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="f-price"
              className="input"
              type="number"
              min={0}
              placeholder="Min $"
              value={values.priceMin || ''}
              onChange={(e) => set({ priceMin: e.target.value })}
              aria-label="Minimum price"
            />
            <input
              className="input"
              type="number"
              min={0}
              placeholder="Max $"
              value={values.priceMax || ''}
              onChange={(e) => set({ priceMax: e.target.value })}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      <div className="filter-group" style={{ marginTop: 6 }}>
        {AVAILABILITY_OPTIONS.map((a) => (
          <button
            key={a.value}
            className={classNames('chip', values.availability === a.value && 'chip--active')}
            onClick={() => set({ availability: values.availability === a.value ? '' : a.value })}
          >
            {a.label}
          </button>
        ))}
        <button
          className={classNames('chip', values.featured && 'chip--active')}
          onClick={() => set({ featured: !values.featured })}
        >
          Featured only
        </button>
        {hasFilters && (
          <button className="btn btn--ghost btn--sm" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
