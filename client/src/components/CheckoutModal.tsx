import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../api/types'
import { api, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { classNames, formatPrice } from '../lib/format'
import type { VariationSelection } from './VariationSelector'
import { Icon } from './Icon'

interface CheckoutForm {
  name: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  notes: string
}

function emptyForm(customer?: { name: string; phone: string; email: string } | null): CheckoutForm {
  return {
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    notes: '',
  }
}

export function CheckoutModal({
  open,
  onClose,
  product,
  variations,
  quantity,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  product: Product
  variations: VariationSelection[]
  quantity: number
  onSuccess?: (orderId: string, conversationId: string) => void
}) {
  const { customer } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState<CheckoutForm>(() => emptyForm(customer))
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')

  const variationTotal = useMemo(
    () =>
      variations.reduce((sum, v) => {
        const group = product.variations.find((g) => g.name === v.name)
        const opt = group?.options.find((o) => o.value === v.value)
        return sum + (opt?.priceDelta || 0)
      }, 0),
    [variations, product]
  )

  useEffect(() => {
    if (customer) setForm(emptyForm(customer))
  }, [customer])

  const unitPrice = product.price + variationTotal
  const total = unitPrice * quantity

  const set = (patch: Partial<CheckoutForm>) => setForm((f) => ({ ...f, ...patch }))

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    try {
      if (authMode === 'login') {
        await api.login(authEmail, authPassword)
      } else {
        await api.register({ name: authName, email: authEmail, password: authPassword })
      }
      toast('Welcome', authMode === 'login' ? 'You are signed in.' : 'Your account has been created.')
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Could not sign in')
    }
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Valid email is required'
    if (form.phone.trim().length < 6) next.phone = 'Valid phone is required'
    if (!form.addressLine1.trim()) next.addressLine1 = 'Street address is required'
    if (!form.city.trim()) next.city = 'City is required'
    if (!form.postalCode.trim()) next.postalCode = 'Postal code is required'
    if (!form.country.trim()) next.country = 'Country is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await api.createOrder({
        productId: product.id,
        quantity,
        variations,
        customerNotes: form.notes,
        name: form.name,
        phone: form.phone,
        email: form.email,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
      })
      toast('Order request received', 'Our team will confirm the details shortly.', 'success')
      onClose()
      onSuccess?.(res.order.id, res.conversation.id)
      navigate(`/order/${res.order.id}`)
    } catch (err) {
      toast('Could not place order', err instanceof ApiError ? err.message : 'Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Order request">
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h3 className="modal__title">Order Request</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <Icon name="close" width="18" height="18" />
          </button>
        </div>
        <div className="modal__body">
          <div className="pd-notice" style={{ marginTop: 0, marginBottom: 22 }}>
            <Icon name="gem" />
            <span>
              You are not paying today. This places an <strong>order request</strong> — our team will
              confirm every detail with you before any payment is requested.
            </span>
          </div>

          {/* Product summary */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 16px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', marginBottom: 22 }}>
            {product.images[0] && (
              <img src={product.images[0]} alt={product.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--line)', flex: 'none' }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{product.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
                {variations.map((v) => `${v.name}: ${v.value}`).join(' · ') || 'Standard configuration'}
                {' · '}Qty {quantity}
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: 'none' }}>
              <div style={{ fontWeight: 600 }}>{formatPrice(unitPrice)}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>× {quantity} = {formatPrice(total)}</div>
            </div>
          </div>

          {!customer ? (
            <div>
              <p className="lead" style={{ fontSize: 15, marginBottom: 18 }}>
                Sign in or create an account to place your order request and track it in your account.
              </p>
              <div className="tabs">
                <button className={classNames('tab-btn', authMode === 'login' && 'is-active')} onClick={() => { setAuthMode('login'); setAuthError('') }}>
                  Sign In
                </button>
                <button className={classNames('tab-btn', authMode === 'register' && 'is-active')} onClick={() => { setAuthMode('register'); setAuthError('') }}>
                  Create Account
                </button>
              </div>
              <form onSubmit={handleAuth}>
                {authMode === 'register' && (
                  <div className="field">
                    <label>Full name</label>
                    <input className="input" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" />
                  </div>
                )}
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input className="input" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="At least 8 characters" />
                </div>
                {authError && <p className="field-error" role="alert">{authError}</p>}
                <button className="btn btn--dark btn--block" type="submit" disabled={submitting}>
                  {authMode === 'login' ? 'Sign In to Continue' : 'Create Account & Continue'}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="field--row">
                <div className="field">
                  <label>Full name <span className="req">*</span></label>
                  <input className={classNames('input', errors.name && 'input-error')} value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Phone <span className="req">*</span></label>
                  <input className={classNames('input', errors.phone && 'input-error')} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+1 …" />
                </div>
              </div>
              <div className="field">
                <label>Email <span className="req">*</span></label>
                <input className={classNames('input', errors.email && 'input-error')} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </div>

              <div className="field--row">
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Street address <span className="req">*</span></label>
                  <input className={classNames('input', errors.addressLine1 && 'input-error')} value={form.addressLine1} onChange={(e) => set({ addressLine1: e.target.value })} placeholder="Street and number" />
                </div>
                <div className="field">
                  <label>Apartment, suite (optional)</label>
                  <input className="input" value={form.addressLine2} onChange={(e) => set({ addressLine2: e.target.value })} />
                </div>
                <div className="field">
                  <label>Country <span className="req">*</span></label>
                  <input className={classNames('input', errors.country && 'input-error')} value={form.country} onChange={(e) => set({ country: e.target.value })} />
                </div>
                <div className="field">
                  <label>City <span className="req">*</span></label>
                  <input className={classNames('input', errors.city && 'input-error')} value={form.city} onChange={(e) => set({ city: e.target.value })} />
                </div>
                <div className="field">
                  <label>State / Region</label>
                  <input className="input" value={form.state} onChange={(e) => set({ state: e.target.value })} />
                </div>
                <div className="field">
                  <label>Postal code <span className="req">*</span></label>
                  <input className={classNames('input', errors.postalCode && 'input-error')} value={form.postalCode} onChange={(e) => set({ postalCode: e.target.value })} />
                </div>
              </div>

              <div className="field">
                <label>Notes for our atelier (optional)</label>
                <textarea className="textarea" value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Gift wrapping, sizing, personalisation…" />
              </div>

              <div style={{ background: 'var(--ivory-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '3px 0' }}>
                  <span className="muted">Subtotal ({quantity} × {formatPrice(product.price)})</span>
                  <span>{formatPrice(product.price * quantity)}</span>
                </div>
                {variationTotal !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '3px 0' }}>
                    <span className="muted">Customisation</span>
                    <span>{formatPrice(variationTotal * quantity)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, paddingTop: 10, borderTop: '1px solid var(--line-strong)', marginTop: 8 }}>
                  <span>Estimated total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8 }}>
                  No payment is taken now. Our team confirms the final amount with you before any payment is requested.
                </div>
              </div>

              <button className="btn btn--dark btn--block" type="submit" disabled={submitting}>
                {submitting ? 'Placing order request…' : 'Submit Order Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
