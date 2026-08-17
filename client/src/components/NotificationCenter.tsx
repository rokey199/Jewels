import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Notification } from '../api/types'
import { useUnread } from '../hooks/useUnread'
import { formatDateTime } from '../lib/format'
import { Icon } from './Icon'

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const { notifications, refresh } = useUnread()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api
      .getNotifications()
      .then(async (res) => {
        setItems(res.items)
        await api.markAllNotificationsRead()
        refresh()
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [open, refresh])

  const goTo = (n: Notification) => {
    setOpen(false)
    if (n.relatedEntity?.startsWith('order:')) {
      navigate(`/order/${n.relatedEntity.slice(6)}`)
    } else if (n.relatedEntity?.startsWith('conversation:')) {
      navigate(`/chat?conversation=${n.relatedEntity.slice(13)}`)
    } else if (n.relatedEntity?.startsWith('product:')) {
      navigate(`/product/${n.relatedEntity.slice(8)}`)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" />
        {notifications > 0 && <span className="icon-btn__dot">{notifications > 9 ? '9+' : notifications}</span>}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: 360,
            maxHeight: 460,
            overflowY: 'auto',
            zIndex: 120,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>Notifications</strong>
          </div>
          {loading && <div style={{ padding: 20 }} className="muted">Loading…</div>}
          {!loading && items.length === 0 && (
            <div style={{ padding: 26, textAlign: 'center' }} className="muted">You are all caught up.</div>
          )}
          {!loading &&
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => goTo(n)}
                style={{
                  display: 'flex',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 18px',
                  border: 'none',
                  borderBottom: '1px solid var(--line)',
                  background: n.read ? 'transparent' : 'rgba(184,147,78,0.07)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ flex: 'none', color: 'var(--gold-deep)', marginTop: 2 }}>
                  <Icon name={n.type === 'chat' ? 'chat' : n.type === 'order' ? 'package' : n.type === 'payment' ? 'check-circle' : 'bell'} width="17" height="17" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 13.5, color: 'var(--ink)' }}>{n.title}</strong>
                  {n.message && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>{n.message}</span>}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>{formatDateTime(n.createdAt)}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
