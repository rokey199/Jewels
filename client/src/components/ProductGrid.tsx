import type { Product } from '../api/types'
import { ProductCard } from './ProductCard'
import { EmptyState, ErrorState, SkeletonGrid } from './States'

export function ProductGrid({
  products,
  loading,
  error,
  onRetry,
  onQuickView,
  emptyTitle = 'No pieces found',
  emptyDescription = 'Try adjusting your filters or explore another category.',
}: {
  products: Product[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onQuickView?: (product: Product) => void
  emptyTitle?: string
  emptyDescription?: string
}) {
  if (loading) {
    return <SkeletonGrid count={8} />
  }

  if (error) {
    return <ErrorState title="Could not load pieces" description={error} onRetry={onRetry} />
  }

  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon="search" />
  }

  return (
    <div className="grid grid--4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
      ))}
    </div>
  )
}
