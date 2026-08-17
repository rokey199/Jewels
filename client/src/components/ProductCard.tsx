import { Link } from 'react-router-dom'
import type { Product } from '../api/types'
import { classNames, formatPrice, AVAILABILITY_LABELS } from '../lib/format'
import { Icon } from './Icon'
import { useWishlist } from '../context/WishlistContext'

export function ProductCard({
  product,
  onQuickView,
}: {
  product: Product
  onQuickView?: (product: Product) => void
}) {
  const { isWishlisted, toggle } = useWishlist()
  const wished = isWishlisted(product.id)
  const image = product.images?.[0]

  const availability = product.availability

  return (
    <article className="product-card">
      <div className="product-card__media">
        {product.discount && product.discount > 0 && (
          <div className="product-card__badges">
            <span className="badge badge--dark">Save {product.discount}%</span>
          </div>
        )}
        {availability !== 'in_stock' && availability !== 'made_to_order' && (
          <div className="product-card__badges" style={{ top: product.discount ? 44 : 12 }}>
            <span className="badge badge--neutral">{AVAILABILITY_LABELS[availability]}</span>
          </div>
        )}
        <Link to={`/product/${product.slug}`} aria-label={product.title}>
          {image ? (
            <img src={image} alt={product.title} loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%' }} className="skeleton" />
          )}
        </Link>
        <button
          className={classNames('product-card__wish', wished && 'is-active')}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={() => toggle(product.id)}
        >
          <Icon name="heart" width="18" height="18" fill={wished ? 'currentColor' : 'none'} />
        </button>
        {onQuickView && (
          <div className="product-card__quick">
            <button className="btn" onClick={() => onQuickView(product)}>
              <Icon name="eye" width="16" height="16" />
              Quick View
            </button>
          </div>
        )}
      </div>
      <div className="product-card__body">
        {product.category && <span className="product-card__cat">{product.category.name}</span>}
        <h3 className="product-card__name">
          <Link to={`/product/${product.slug}`}>{product.title}</Link>
        </h3>
        <div className="product-card__price-row">
          <span className="price">{formatPrice(product.price)}</span>
          {product.mrp != null && product.mrp > product.price && (
            <span className="price--mrp">{formatPrice(product.mrp)}</span>
          )}
        </div>
        <span
          className={classNames(
            'badge',
            availability === 'in_stock' && 'badge--success',
            availability === 'made_to_order' && 'badge--gold',
            availability === 'pre_order' && 'badge--warning',
            availability === 'out_of_stock' && 'badge--error'
          )}
          style={{ alignSelf: 'flex-start' }}
        >
          <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {AVAILABILITY_LABELS[availability]}
        </span>
      </div>
    </article>
  )
}
