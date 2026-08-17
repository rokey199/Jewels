import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Order } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate, formatDateTime, formatPrice, ORDER_STATUS_LABELS } from '../lib/format'
import { OrderStatusBadge, OrderStatusTimeline } from '../components/OrderStatus'
import { ErrorState, LoadingState } from '../components/States'
import { Icon } from '../components/Icon'

export default function OrderDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customer } = useAuth()
  const { toast } = useToast()

  const [order, setOrder] = useState<Order | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getOrder(id)
      setOrder(res.order)
      setConversationId(res.conversation?.id || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this order')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (customer === undefined) return
    if (customer === null) {
      navigate(`/account?mode=login&next=/order/${id}`, { replace: true })
      return
    }
    void load()
  }, [customer, id, load, navigate])

  const openChat = async () => {
    if (conversationId) {
      navigate(`/chat?conversation=${conversationId}`)
      return
    }
    try {
      const res = await api.createConversation({ orderId: id })
      setConversationId(res.conversation.id)
      toast('Conversation opened', 'Continue the discussion in chat.', 'success')
      navigate(`/chat?conversation=${res.conversation.id}`)
    } catch (err) {
      toast('Could not open chat', err instanceof Error ? err.message : 'Please try again.', 'error')
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Loading your order…" />
        </div>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="section">
        <div className="container">
          <ErrorState
            title="Order not found"
            description={error || 'This order is not available.'}
            action={
              <Link to="/account" className="btn btn--dark">
                Go to my account
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  const isFresh = order.status === 'PENDING_CONFIRMATION'
  const item = order.items?.[0]

  return (
    <section className="section section--tight">
      <div className="container" style={{ maxWidth: 860 }}>
        {isFresh && (
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="success-check">
              <Icon name="check" width="38" height="38" />
            </div>
            <h1 className="display-md">Your order request has been received successfully</h1>
            <p className="lead" style={{ maxWidth: 520, margin: '10px auto 0' }}>
              Reference <strong>{order.orderNumber}</strong>. Our team will review the details and
              confirm everything with you — nothing is paid today.
            </p>
          </div>
        )}

        <div className="card card--pad" style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 6 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0 }}>Order {order.orderNumber}</h2>
              <span className="muted" style={{ fontSize: 13 }}>Placed {formatDateTime(order.createdAt)}</span>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <OrderStatusTimeline status={order.status} />
        </div>

        <div className="grid grid--2" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: 22 }}>
          <div className="card card--pad">
            <span className="eyebrow" style={{ marginBottom: 10 }}>Pieces</span>
            {item && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {item.image && (
                  <img src={item.image} alt={item.title} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--line)', flex: 'none' }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <Link to={`/product/${item.slug}`} style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
                    {item.title}
                  </Link>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                    {order.selectedVariations.map((v) => `${v.name}: ${v.value}`).join(' · ') || 'Standard configuration'}
                    {' · '}Qty {order.quantity}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4, color: 'var(--gold-deep)' }}>
                    {formatPrice(item.unitPrice + (item.priceDelta || 0))} each
                  </div>
                </div>
              </div>
            )}
            {order.customerNotes && (
              <div style={{ marginTop: 18, background: 'var(--ivory-2)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13.5, color: 'var(--ink-soft)' }}>
                <strong style={{ display: 'block', marginBottom: 2 }}>Your notes</strong>
                {order.customerNotes}
              </div>
            )}
          </div>

          <div className="card card--pad">
            <span className="eyebrow" style={{ marginBottom: 10 }}>Summary</span>
            <div style={{ fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="muted">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.customizationCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span className="muted">Customisation</span>
                  <span>{formatPrice(order.customizationCharge)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span className="muted">Discount</span>
                  <span style={{ color: 'var(--success)' }}>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="muted">Delivery</span>
                <span>{formatPrice(order.shippingCharge)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px solid var(--line-strong)', marginTop: 8, fontWeight: 600, fontSize: 16 }}>
                <span>Estimated total</span>
                <span>{formatPrice(order.finalAmount)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>
                No payment taken — we confirm the final amount with you before any payment is requested.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid--2" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 22 }}>
          <div className="card card--pad">
            <span className="eyebrow" style={{ marginBottom: 10 }}>Delivery address</span>
            {order.address && (
              <dl className="detail-list">
                <div className="detail-item">
                  <dt>Name</dt>
                  <dd>{order.address.name}</dd>
                </div>
                <div className="detail-item">
                  <dt>Phone</dt>
                  <dd>{order.address.phone}</dd>
                </div>
                <div className="detail-item">
                  <dt>Email</dt>
                  <dd>{order.address.email}</dd>
                </div>
                <div className="detail-item">
                  <dt>Address</dt>
                  <dd>
                    {order.address.addressLine1}
                    {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}
                    <br />
                    {order.address.city}
                    {order.address.state ? `, ${order.address.state}` : ''} {order.address.postalCode}
                    <br />
                    {order.address.country}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="eyebrow" style={{ marginBottom: 10 }}>Next steps</span>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 12 }}>
                <strong>{ORDER_STATUS_LABELS[order.status] || order.status}.</strong> Continue the
                conversation about this order — our team can discuss design changes, customisation,
                sizing and any other modifications, and will confirm payment details with you.
              </p>
            </div>
            <button className="btn btn--dark btn--block" onClick={openChat}>
              <Icon name="chat" width="16" height="16" />
              {conversationId ? 'Continue this order chat' : 'Start a chat about this order'}
            </button>
          </div>
        </div>

        <div className="pd-notice" style={{ marginTop: 4 }}>
          <Icon name="shield" />
          <span>
            Placed on {formatDate(order.createdAt)}. All order requests are reviewed by our atelier
            before confirmation — you will never be charged without your explicit approval.
          </span>
        </div>
      </div>
    </section>
  )
}
