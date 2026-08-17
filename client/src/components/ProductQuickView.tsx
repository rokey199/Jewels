import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../api/types'
import { formatPrice, AVAILABILITY_LABELS, classNames } from '../lib/format'
import { Modal } from './Modal'
import { Icon } from './Icon'
import { QuantitySelector } from './QuantitySelector'
import { VariationSelector, type VariationSelection } from './VariationSelector'
import { CheckoutModal } from './CheckoutModal'

export function ProductQuickView({
  product,
  open,
  onClose,
}: {
  product: Product | null
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<VariationSelection[]>([])
  const [quantity, setQuantity] = useState(1)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  if (!product) return null

  return (
    <>
      <Modal open={open} onClose={onClose} title="Quick View" wide>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 28, alignItems: 'start' }}>
          <div>
            <img
              src={product.images[0]}
              alt={product.title}
              style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
            />
          </div>
          <div>
            {product.category && <span className="product-card__cat">{product.category.name}</span>}
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, margin: '4px 0 10px' }}>{product.title}</h3>
            <div className="pd-info__price-row">
              <span className="price price--lg">{formatPrice(product.price)}</span>
              {product.mrp != null && product.mrp > product.price && <span className="price--mrp">{formatPrice(product.mrp)}</span>}
            </div>
            <div className="pd-info__meta" style={{ marginBottom: 12 }}>
              <span className={classNames('badge', product.availability === 'in_stock' ? 'badge--success' : product.availability === 'made_to_order' ? 'badge--gold' : 'badge--warning')}>
                {AVAILABILITY_LABELS[product.availability]}
              </span>
              <span>SKU {product.sku}</span>
            </div>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14.5 }}>{product.shortDescription || product.description?.slice(0, 200)}</p>

            <VariationSelector groups={product.variations} selected={selected} onChange={setSelected} />

            <div className="qty-row" style={{ marginTop: 6 }}>
              <span className="qty-label">Quantity</span>
              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>

            <div className="pd-actions">
              <button
                className="btn btn--dark btn--block"
                onClick={() => {
                  onClose()
                  navigate(`/product/${product.slug}`)
                }}
              >
                View Full Details
              </button>
              <button className="btn btn--primary btn--block" onClick={() => setCheckoutOpen(true)}>
                Buy Now
              </button>
              <button className="btn btn--outline btn--block" onClick={() => { onClose(); navigate(`/chat?product=${product.id}`) }}>
                <Icon name="chat" width="16" height="16" /> Chat About This
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {product && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          product={product}
          variations={selected}
          quantity={quantity}
        />
      )}
    </>
  )
}
