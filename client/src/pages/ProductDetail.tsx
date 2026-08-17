import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { Product } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { classNames, formatPrice, AVAILABILITY_LABELS } from '../lib/format'
import { ProductGallery } from '../components/ProductGallery'
import { VariationSelector, type VariationSelection } from '../components/VariationSelector'
import { QuantitySelector } from '../components/QuantitySelector'
import { ReviewSection } from '../components/ReviewSection'
import { CheckoutModal } from '../components/CheckoutModal'
import { ProductCard } from '../components/ProductCard'
import { ErrorState, LoadingState } from '../components/States'
import { Icon } from '../components/Icon'

export default function ProductDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { customer } = useAuth()
  const { isWishlisted, toggle } = useWishlist()
  const { toast } = useToast()

  const [data, setData] = useState<Awaited<ReturnType<typeof api.getProduct>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<VariationSelection[]>([])
  const [quantity, setQuantity] = useState(1)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [chatting, setChatting] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .getProduct(slug)
      .then((d) => {
        setData(d)
        // Default to the first available option of each variation group
        const defaults = d.product.variations
          .map((g) => {
            const opt = g.options.find((o) => o.inStock !== false) || g.options[0]
            return opt ? { name: g.name, value: opt.value } : null
          })
          .filter(Boolean) as VariationSelection[]
        setSelected(defaults)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load this piece'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setData(null)
    setQuantity(1)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const product: Product | null = data?.product || null

  const variationTotal = useMemo(
    () =>
      selected.reduce((sum, v) => {
        const group = product?.variations.find((g) => g.name === v.name)
        const opt = group?.options.find((o) => o.value === v.value)
        return sum + (opt?.priceDelta || 0)
      }, 0),
    [selected, product]
  )

  const unitPrice = (product?.price || 0) + variationTotal
  const wished = product ? isWishlisted(product.id) : false

  const handleChatNow = async () => {
    if (!product) return
    if (!customer) {
      toast('Please sign in first', 'You need an account to chat with our atelier.')
      navigate('/account?mode=login&next=/product/' + product.slug)
      return
    }
    setChatting(true)
    try {
      const res = await api.createConversation({ productId: product.id })
      toast('Conversation opened', 'Our team will reply shortly.', 'success')
      navigate(`/chat?conversation=${res.conversation.id}`)
    } catch (err) {
      toast('Could not open chat', err instanceof ApiError ? err.message : 'Please try again.', 'error')
    } finally {
      setChatting(false)
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Preparing this piece…" />
        </div>
      </section>
    )
  }

  if (error || !product || !data) {
    return (
      <section className="section">
        <div className="container">
          <ErrorState
            title="Piece not found"
            description={error || 'This piece is no longer available.'}
            action={
              <Link to="/products" className="btn btn--dark">
                Browse the collection
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="section section--tight">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/products">Collection</Link>
            {product.category && (
              <>
                <span className="sep">/</span>
                <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link>
              </>
            )}
            <span className="sep">/</span>
            <span>{product.title}</span>
          </nav>

          <div className="pd-grid">
            <ProductGallery images={product.images} title={product.title} />

            <div className="pd-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {product.category && <span className="pd-info__cat">{product.category.name}</span>}
                  <h1 className="pd-info__title">{product.title}</h1>
                </div>
                <button
                  className={classNames('product-card__wish', wished && 'is-active')}
                  style={{ position: 'static', flex: 'none' }}
                  onClick={() => toggle(product.id)}
                  aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Icon name="heart" fill={wished ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="pd-info__price-row">
                <span className="price price--lg">{formatPrice(unitPrice)}</span>
                {product.mrp != null && product.mrp > unitPrice && (
                  <span className="price--mrp">{formatPrice(product.mrp)}</span>
                )}
                {product.discount != null && product.discount > 0 && (
                  <span className="badge badge--dark">Save {product.discount}%</span>
                )}
              </div>

              <div className="pd-info__meta">
                <span className={classNames('badge', product.availability === 'in_stock' ? 'badge--success' : product.availability === 'made_to_order' ? 'badge--gold' : 'badge--warning')}>
                  {AVAILABILITY_LABELS[product.availability]}
                </span>
                <span>SKU {product.sku}</span>
                {data.ratingSummary.count > 0 && (
                  <Link to="#reviews" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="star" width="15" height="15" fill="var(--gold)" />
                    {data.ratingSummary.average.toFixed(1)}
                    <span className="muted">({data.ratingSummary.count})</span>
                  </Link>
                )}
              </div>

              <p className="pd-info__desc">{product.description}</p>

              <VariationSelector groups={product.variations} selected={selected} onChange={setSelected} />

              <div className="qty-row">
                <span className="qty-label">Quantity</span>
                <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(1, product.stock || 99)} />
              </div>

              <div className="pd-actions">
                <button className="btn btn--dark btn--block" onClick={() => setCheckoutOpen(true)}>
                  Buy Now
                </button>
                <button className="btn btn--outline" onClick={handleChatNow} disabled={chatting}>
                  <Icon name="chat" width="16" height="16" />
                  {chatting ? 'Opening…' : 'Chat Now'}
                </button>
                <button
                  className="btn btn--outline"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(product.title.split(' ')[0])}`)}
                >
                  <Icon name="search" width="16" height="16" />
                  Find Similar
                </button>
              </div>

              <div className="pd-notice">
                <Icon name="truck" />
                <span>
                  Complimentary insured delivery worldwide. No payment is taken when you place an
                  order request — our team confirms every detail with you first.
                </span>
              </div>

              {product.specifications.length > 0 && (
                <dl className="pd-specs">
                  {product.specifications.map((s) => (
                    <div className="pd-specs__row" key={s.label}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="pd-notice">
                <Icon name="chat" />
                <span>
                  Want a personal design or any modification?{' '}
                  <Link to={`/chat?product=${product.id}`} style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
                    Continue this chat
                  </Link>{' '}
                  to order this design and discuss customization with our team.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(data.related.length > 0 || data.similar.length > 0) && (
        <section className="section section--muted">
          <div className="container">
            {data.related.length > 0 && (
              <>
                <div className="section-head">
                  <span className="eyebrow">From the same collection</span>
                  <h2 className="display-md">You may also love</h2>
                </div>
                <div className="grid grid--4">
                  {data.related.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
            {data.similar.length > 0 && (
              <>
                <div className="section-head" style={{ marginTop: 48 }}>
                  <span className="eyebrow">In a similar spirit</span>
                  <h2 className="display-md">Similar pieces</h2>
                </div>
                <div className="grid grid--4">
                  {data.similar.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <ReviewSection
        productId={product.id}
        reviews={data.reviews}
        ratingSummary={data.ratingSummary}
        ratingDistribution={data.ratingDistribution}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        product={product}
        variations={selected}
        quantity={quantity}
      />
    </>
  )
}
