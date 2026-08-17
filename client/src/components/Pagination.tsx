import { Icon } from './Icon'
import { classNames } from '../lib/format'

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (p: number) => void
}) {
  if (pages <= 1) return null

  const window: number[] = []
  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const end = Math.min(pages, start + 4)
  for (let i = start; i <= end; i++) window.push(i)

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <Icon name="chevron-left" width="16" height="16" />
      </button>
      {start > 1 && (
        <>
          <button className="page-btn" onClick={() => onChange(1)}>
            1
          </button>
          {start > 2 && <span className="page-btn" style={{ border: 'none', background: 'none' }}>…</span>}
        </>
      )}
      {window.map((p) => (
        <button
          key={p}
          className={classNames('page-btn', p === page && 'is-active')}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="page-btn" style={{ border: 'none', background: 'none' }}>…</span>}
          <button className="page-btn" onClick={() => onChange(pages)}>
            {pages}
          </button>
        </>
      )}
      <button className="page-btn" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <Icon name="chevron-right" width="16" height="16" />
      </button>
    </nav>
  )
}
