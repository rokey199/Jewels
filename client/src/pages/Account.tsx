import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ChatConversation, Order, Review } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { classNames, formatDate, formatPrice, initials } from '../lib/format'
import { OrderStatusBadge } from '../components/OrderStatus'
import { RatingStars } from '../components/RatingStars'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { Icon } from '../components/Icon'

type Tab = 'overview' | 'profile' | 'address' | 'orders' | 'conversations' | 'reviews' | 'settings'

export default function Account() {
  const { customer, login, register, logout, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const mode = params.get('mode') || 'login'
  const next = params.get('next') || ''
  const requestedTab = (params.get('tab') || 'overview') as Tab

  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    setTab(requestedTab)
  }, [requestedTab])

  // Auth form state
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthBusy(true)
    try {
      if (mode === 'register') {
        await register({ name: authName, email: authEmail, phone: authPhone, password: authPassword })
        toast('Welcome to Maison Dorée', 'Your account has been created.', 'success')
      } else {
        await login(authEmail, authPassword)
        toast('Welcome back', 'You are signed in.', 'success')
      }
      if (next) navigate(next)
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Could not sign in')
    } finally {
      setAuthBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Loading…" />
        </div>
      </section>
    )
  }

  if (!customer) {
    return (
      <section className="section">
        <div className="container">
          <div className="auth-card">
            <span className="eyebrow">Client Account</span>
            <h1 className="display-md">{mode === 'register' ? 'Create your account' : 'Sign in'}</h1>
            <p className="lead" style={{ fontSize: 15, marginBottom: 22 }}>
              {mode === 'register'
                ? 'Track orders, chat with our atelier and review pieces you have received.'
                : 'Access your orders, conversations and reviews.'}
            </p>

            <div className="tabs">
              <Link
                to={next ? `/account?mode=login&next=${encodeURIComponent(next)}` : '/account?mode=login'}
                className={classNames('tab-btn', mode !== 'register' && 'is-active')}
              >
                Sign In
              </Link>
              <Link
                to={next ? `/account?mode=register&next=${encodeURIComponent(next)}` : '/account?mode=register'}
                className={classNames('tab-btn', mode === 'register' && 'is-active')}
              >
                Create Account
              </Link>
            </div>

            <form onSubmit={handleAuth}>
              {mode === 'register' && (
                <>
                  <div className="field">
                    <label>Full name <span className="req">*</span></label>
                    <input className="input" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input className="input" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="+1 …" />
                  </div>
                </>
              )}
              <div className="field">
                <label>Email <span className="req">*</span></label>
                <input className="input" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="field">
                <label>Password <span className="req">*</span></label>
                <input className="input" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} />
              </div>
              {authError && <p className="field-error" role="alert">{authError}</p>}
              <button className="btn btn--dark btn--block" type="submit" disabled={authBusy}>
                {authBusy ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  return <AccountDashboard customer={customer} tab={tab} setTab={setTab} onLogout={async () => { await logout(); navigate('/') }} />
}

const TABS: { key: Tab; label: string; icon: IconNameType }[] = [
  { key: 'overview', label: 'Overview', icon: 'home' },
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'address', label: 'Addresses', icon: 'map-pin' },
  { key: 'orders', label: 'Orders', icon: 'package' },
  { key: 'conversations', label: 'Conversations', icon: 'chat' },
  { key: 'reviews', label: 'Reviews', icon: 'star' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
]

type IconNameType = 'home' | 'user' | 'map-pin' | 'package' | 'chat' | 'star' | 'settings' | 'logout'

function AccountDashboard({
  customer,
  tab,
  setTab,
  onLogout,
}: {
  customer: NonNullable<ReturnType<typeof useAuth>['customer']>
  tab: Tab
  setTab: (t: Tab) => void
  onLogout: () => void
}) {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[] | null>(null)
  const [reviews, setReviews] = useState<(Review & { productTitle?: string; productSlug?: string; productImage?: string | null })[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadAccount = useCallback(async () => {
    setLoadError(null)
    try {
      const [o, c, r] = await Promise.all([api.getMyOrders(), api.getConversations(), api.getMyReviews()])
      setOrders(o.items)
      setConversations(c.items)
      setReviews(r.items)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your account')
    }
  }, [])

  useEffect(() => {
    if (tab === 'orders' || tab === 'conversations' || tab === 'reviews' || tab === 'overview') {
      void loadAccount()
    }
  }, [tab, loadAccount])

  const orderCount = useMemo(() => orders?.length ?? 0, [orders])

  return (
    <section className="section section--tight">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 26 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ivory-2)', border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--gold-deep)' }}>
              {initials(customer.name)}
            </span>
            <div>
              <h1 className="display-md" style={{ margin: 0 }}>Hello, {customer.name.split(' ')[0]}</h1>
              <span className="muted" style={{ fontSize: 13.5 }}>{customer.email}</span>
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onLogout}>
            <Icon name="logout" width="16" height="16" /> Sign out
          </button>
        </div>

        <div className="account-layout">
          <nav className="account-nav" aria-label="Account">
            {TABS.map((t) => (
              <button key={t.key} className={classNames('account-nav__item', tab === t.key && 'is-active')} onClick={() => setTab(t.key)}>
                <Icon name={t.icon} width="18" height="18" />
                {t.label}
                {t.key === 'orders' && orderCount > 0 && <span style={{ marginLeft: 'auto', fontSize: 12 }}>({orderCount})</span>}
              </button>
            ))}
          </nav>

          <div>
            {loadError && (
              <div style={{ marginBottom: 18 }}>
                <ErrorState description={loadError} onRetry={() => void loadAccount()} />
              </div>
            )}

            {tab === 'overview' && (
              <OverviewPanel customer={customer} orders={orders} conversations={conversations} onNavigate={setTab} />
            )}
            {tab === 'profile' && <ProfilePanel />}
            {tab === 'address' && <AddressPanel />}
            {tab === 'orders' && <OrdersPanel orders={orders} loading={!orders && !loadError} />}
            {tab === 'conversations' && <ConversationsPanel conversations={conversations} loading={!conversations && !loadError} />}
            {tab === 'reviews' && <ReviewsPanel reviews={reviews} loading={!reviews && !loadError} />}
            {tab === 'settings' && <SettingsPanel />}
          </div>
        </div>
      </div>
    </section>
  )
}

function OverviewPanel({
  customer,
  orders,
  conversations,
  onNavigate,
}: {
  customer: NonNullable<ReturnType<typeof useAuth>['customer']>
  orders: Order[] | null
  conversations: ChatConversation[] | null
  onNavigate: (t: Tab) => void
}) {
  const recentOrders = orders?.slice(0, 3) || []
  const recentConvs = conversations?.slice(0, 3) || []

  return (
    <div>
      <div className="grid grid--2" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 22 }}>
        <div className="card card--pad">
          <span className="eyebrow">Contact details</span>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Name</dt>
              <dd>{customer.name}</dd>
            </div>
            <div className="detail-item">
              <dt>Email</dt>
              <dd>{customer.email}</dd>
            </div>
            <div className="detail-item">
              <dt>Phone</dt>
              <dd>{customer.phone || '—'}</dd>
            </div>
          </dl>
          <button className="btn btn--outline btn--sm" onClick={() => onNavigate('profile')}>
            Edit profile
          </button>
        </div>
        <div className="card card--pad">
          <span className="eyebrow">Delivery address</span>
          {customer.addressLine1 ? (
            <dl className="detail-list">
              <div className="detail-item">
                <dt>Address</dt>
                <dd>
                  {customer.addressLine1}
                  {customer.addressLine2 ? `, ${customer.addressLine2}` : ''}
                  <br />
                  {customer.city}
                  {customer.state ? `, ${customer.state}` : ''} {customer.postalCode}
                  <br />
                  {customer.country}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="muted" style={{ fontSize: 14 }}>No delivery address saved yet.</p>
          )}
          <button className="btn btn--outline btn--sm" onClick={() => onNavigate('address')}>
            Update address
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Recent orders</strong>
          <button className="btn btn--ghost btn--sm" onClick={() => onNavigate('orders')}>View all</button>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: 24 }} className="muted">
            No orders yet. Find a piece you love and place your first order request.
          </div>
        ) : (
          recentOrders.map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.orderNumber}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{formatDate(o.createdAt)} · {formatPrice(o.finalAmount)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <OrderStatusBadge status={o.status} />
                <Link to={`/order/${o.id}`} className="btn btn--outline btn--sm">View</Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Recent conversations</strong>
          <button className="btn btn--ghost btn--sm" onClick={() => onNavigate('conversations')}>View all</button>
        </div>
        {recentConvs.length === 0 ? (
          <div style={{ padding: 24 }} className="muted">
            No conversations yet. Chat with our atelier from any product page.
          </div>
        ) : (
          recentConvs.map((c) => (
            <Link key={c.id} to={`/chat?conversation=${c.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.subject || 'Conversation'}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{c.orderNumber ? `Order ${c.orderNumber}` : c.productTitle || 'General'}</div>
              </div>
              {c.unreadCustomer > 0 && <span className="badge badge--gold">New</span>}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

function ProfilePanel() {
  const { customer, setCustomer } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [busy, setBusy] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.updateProfile({ name, phone })
      setCustomer(res.customer)
      toast('Profile updated', '', 'success')
    } catch (err) {
      toast('Could not update', err instanceof ApiError ? err.message : 'Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card--pad">
      <span className="eyebrow">Profile</span>
      <h2 className="display-md" style={{ fontSize: 26 }}>Contact details</h2>
      <form onSubmit={save} style={{ maxWidth: 460 }}>
        <div className="field">
          <label>Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" value={customer?.email || ''} disabled />
          <div className="form-hint">Email cannot be changed at the moment.</div>
        </div>
        <div className="field">
          <label>Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 …" />
        </div>
        <button className="btn btn--dark" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

function AddressPanel() {
  const { customer, setCustomer } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({
    addressLine1: customer?.addressLine1 || '',
    addressLine2: customer?.addressLine2 || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postalCode: customer?.postalCode || '',
    country: customer?.country || '',
  })
  const [busy, setBusy] = useState(false)

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.updateAddress(form)
      setCustomer(res.customer)
      toast('Address saved', '', 'success')
    } catch (err) {
      toast('Could not save address', err instanceof ApiError ? err.message : 'Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card--pad">
      <span className="eyebrow">Addresses</span>
      <h2 className="display-md" style={{ fontSize: 26 }}>Delivery address</h2>
      <form onSubmit={save} style={{ maxWidth: 560 }}>
        <div className="field">
          <label>Street address</label>
          <input className="input" value={form.addressLine1} onChange={(e) => set({ addressLine1: e.target.value })} />
        </div>
        <div className="field">
          <label>Apartment, suite (optional)</label>
          <input className="input" value={form.addressLine2} onChange={(e) => set({ addressLine2: e.target.value })} />
        </div>
        <div className="field--row">
          <div className="field">
            <label>City</label>
            <input className="input" value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </div>
          <div className="field">
            <label>State / Region</label>
            <input className="input" value={form.state} onChange={(e) => set({ state: e.target.value })} />
          </div>
          <div className="field">
            <label>Postal code</label>
            <input className="input" value={form.postalCode} onChange={(e) => set({ postalCode: e.target.value })} />
          </div>
          <div className="field">
            <label>Country</label>
            <input className="input" value={form.country} onChange={(e) => set({ country: e.target.value })} />
          </div>
        </div>
        <button className="btn btn--dark" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save address'}
        </button>
      </form>
    </div>
  )
}

function OrdersPanel({ orders, loading }: { orders: Order[] | null; loading: boolean }) {
  if (loading) return <LoadingState label="Loading your orders…" />
  if (!orders) return <ErrorState description="Could not load your orders." />
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Browse the collection and place your first order request — you will not be charged until you approve."
        icon="package"
        action={
          <Link to="/products" className="btn btn--dark">
            Browse the collection
          </Link>
        }
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {orders.map((o) => {
        const item = o.items[0]
        return (
          <div className="order-card" key={o.id}>
            <div className="order-card__head">
              <div>
                <div className="order-card__number">{o.orderNumber}</div>
                <div className="order-card__date">{formatDate(o.createdAt)}</div>
              </div>
              <OrderStatusBadge status={o.status} />
            </div>
            <div className="order-card__body">
              {item?.image && <img className="order-card__img" src={item.image} alt={item.title} />}
              <div className="order-card__product">
                <div className="order-card__product-title">{item?.title}</div>
                <div className="order-card__variant">
                  {o.selectedVariations.map((v) => `${v.name}: ${v.value}`).join(' · ') || 'Standard configuration'}
                  {' · '}Qty {o.quantity}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>{formatPrice(o.finalAmount)}</div>
            </div>
            <div className="order-card__foot">
              <span className="muted" style={{ fontSize: 12.5 }}>Updated {formatDate(o.updatedAt)}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to={`/order/${o.id}`} className="btn btn--outline btn--sm">
                  View order
                </Link>
                {o.conversation && (
                  <Link to={`/chat?conversation=${o.conversation.id}`} className="btn btn--dark btn--sm">
                    <Icon name="chat" width="15" height="15" /> Continue chat
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ConversationsPanel({ conversations, loading }: { conversations: ChatConversation[] | null; loading: boolean }) {
  if (loading) return <LoadingState label="Loading conversations…" />
  if (!conversations) return <ErrorState description="Could not load your conversations." />
  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Chat with our atelier from any product, or start one about an order."
        icon="chat"
        action={
          <Link to="/products" className="btn btn--dark">
            Browse pieces
          </Link>
        }
      />
    )
  }

  return (
    <div className="card">
      {conversations.map((c) => (
        <Link key={c.id} to={`/chat?conversation=${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
          {c.productImage ? (
            <img src={c.productImage} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius)', border: '1px solid var(--line)', objectFit: 'cover', flex: 'none' }} />
          ) : (
            <span style={{ width: 56, height: 56, borderRadius: 'var(--radius)', background: 'var(--ivory-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-deep)', flex: 'none' }}>
              <Icon name="chat" width="22" height="22" />
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.subject || 'Conversation'}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {c.orderNumber ? `Order ${c.orderNumber}` : c.productTitle || 'General enquiry'}
            </div>
          </div>
          {c.unreadCustomer > 0 && <span className="badge badge--gold">New</span>}
          <Icon name="chevron-right" width="16" height="16" className="muted" />
        </Link>
      ))}
    </div>
  )
}

function ReviewsPanel({
  reviews,
  loading,
}: {
  reviews: (Review & { productTitle?: string; productSlug?: string; productImage?: string | null })[] | null
  loading: boolean
}) {
  if (loading) return <LoadingState label="Loading your reviews…" />
  if (!reviews) return <ErrorState description="Could not load your reviews." />
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="After receiving a piece, share your experience on the product page."
        icon="star"
      />
    )
  }

  const statusLabel: Record<string, string> = { PENDING: 'Under review', APPROVED: 'Published', REJECTED: 'Not approved', HIDDEN: 'Hidden' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {reviews.map((r) => (
        <div className="card card--pad" key={r.id}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {r.productImage && (
              <img src={r.productImage} alt="" style={{ width: 64, height: 64, borderRadius: 'var(--radius)', border: '1px solid var(--line)', objectFit: 'cover' }} />
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <Link to={`/product/${r.productSlug}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>
                {r.productTitle}
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <RatingStars rating={r.rating} size="sm" />
                <span className="badge badge--neutral">{statusLabel[r.status] || r.status}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '10px 0 0' }}>{r.reviewText}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SettingsPanel() {
  const { customer } = useAuth()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast('Password too short', 'Use at least 8 characters.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', '', 'error')
      return
    }
    setBusy(true)
    try {
      await api.updatePassword({ currentPassword, newPassword })
      toast('Password changed', '', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast('Could not change password', err instanceof ApiError ? err.message : 'Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card card--pad">
        <span className="eyebrow">Settings</span>
        <h2 className="display-md" style={{ fontSize: 24 }}>Change password</h2>
        <form onSubmit={changePassword} style={{ maxWidth: 420 }}>
          <div className="field">
            <label>Current password</label>
            <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>New password</label>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button className="btn btn--dark" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="card card--pad">
        <span className="eyebrow">Account</span>
        <dl className="detail-list">
          <div className="detail-item">
            <dt>Member since</dt>
            <dd>{formatDate(customer?.createdAt)}</dd>
          </div>
          <div className="detail-item">
            <dt>Status</dt>
            <dd>Active</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
