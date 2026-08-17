import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ChatConversation, ChatMessage as ChatMessageType } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useUnread } from '../hooks/useUnread'
import { classNames, sameDay, timeAgo } from '../lib/format'
import { ChatMessage } from '../components/ChatMessage'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { Icon } from '../components/Icon'

export default function Chat() {
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const { refresh: refreshUnread } = useUnread(60000)

  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const requestedId = params.get('conversation') || ''
  const requestedProduct = params.get('product') || ''

  const [activeId, setActiveId] = useState<string | null>(requestedId || null)
  const [active, setActive] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [composer, setComposer] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<number | null>(null)

  const loadList = useCallback(async () => {
    setLoadingList(true)
    setListError(null)
    try {
      const res = await api.getConversations()
      setConversations(res.items)
      return res.items
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not load your chats')
      return []
    } finally {
      setLoadingList(false)
    }
  }, [])

  const openThread = useCallback(
    async (id: string) => {
      setActiveId(id)
      setThreadError(null)
      setLoadingThread(true)
      try {
        const res = await api.getConversation(id)
        setActive(res.conversation)
        setMessages(res.messages)
        refreshUnread()
      } catch (err) {
        setThreadError(err instanceof Error ? err.message : 'Could not open this conversation')
      } finally {
        setLoadingThread(false)
      }
    },
    [refreshUnread]
  )

  // Load list once on mount
  useEffect(() => {
    void loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-create/open a conversation for a product link
  useEffect(() => {
    if (!requestedProduct) return
    let cancelled = false
    const create = async () => {
      try {
        const res = await api.createConversation({ productId: requestedProduct })
        if (cancelled) return
        await openThread(res.conversation.id)
        setParams({ conversation: res.conversation.id }, { replace: true })
        await loadList()
      } catch (err) {
        if (!cancelled) {
          toast('Could not open chat', err instanceof ApiError ? err.message : 'Please try again.', 'error')
        }
      }
    }
    void create()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedProduct])

  // Open the requested conversation once the list loads
  useEffect(() => {
    if (!requestedId || activeId === requestedId) return
    void openThread(requestedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedId])

  // Select the newest conversation when none is requested
  useEffect(() => {
    if (conversations.length > 0 && !activeId) {
      const first = conversations[0]
      setParams({ conversation: first.id }, { replace: true })
      void openThread(first.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations])

  // Poll for new messages while a thread is open
  useEffect(() => {
    if (!activeId) return
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await api.getConversation(activeId)
        setMessages(res.messages)
        setActive(res.conversation)
        refreshUnread()
      } catch {
        // keep previous state on transient errors
      }
    }, 4000)
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [activeId, refreshUnread])

  // Auto-scroll to the newest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = composer.trim()
    if (!body || !activeId || sending) return
    setSending(true)
    try {
      const res = await api.sendMessage(activeId, body)
      setMessages((prev) => [...prev, res.message])
      setComposer('')
      refreshUnread()
    } catch (err) {
      toast('Could not send message', err instanceof ApiError ? err.message : 'Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  const groups = useMemo(() => {
    const out: { date: string; items: ChatMessageType[] }[] = []
    for (const m of messages) {
      const key = m.createdAt.slice(0, 10)
      const last = out[out.length - 1]
      if (last && last.date === key) {
        last.items.push(m)
      } else {
        out.push({ date: key, items: [m] })
      }
    }
    return out
  }, [messages])

  const select = (id: string) => {
    setParams({ conversation: id }, { replace: true })
    void openThread(id)
  }

  return (
    <section className="section section--tight">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Concierge</span>
            <h1 className="page-title" style={{ fontSize: 'clamp(28px,4vw,42px)' }}>Chat with our atelier</h1>
            <p className="page-sub">Discuss designs, sizes, materials or any modification before you commit.</p>
          </div>
          <Link to="/products" className="btn btn--outline btn--sm">
            Browse the collection
          </Link>
        </div>

        <div className="chat-layout">
          <aside className="chat-sidebar">
            <div className="chat-sidebar__head">
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>Conversations</strong>
            </div>
            <div className="chat-sidebar__list">
              {loadingList && (
                <div style={{ padding: 20 }}>
                  <LoadingState label="Loading conversations…" />
                </div>
              )}
              {listError && <ErrorState description={listError} onRetry={() => void loadList()} />}
              {!loadingList && !listError && conversations.length === 0 && (
                <div style={{ padding: 20 }}>
                  <EmptyState
                    title="No conversations yet"
                    description="Start one from any product, or order a piece to chat about it."
                  />
                </div>
              )}
              {!loadingList &&
                conversations.map((c) => (
                  <button key={c.id} className={classNames('chat-thread', c.id === activeId && 'is-active')} onClick={() => select(c.id)}>
                    <div className="chat-thread__title">{c.subject || 'Conversation'}</div>
                    <div className="chat-thread__sub">
                      {c.orderNumber ? `Order ${c.orderNumber}` : c.productTitle || 'General enquiry'}
                    </div>
                    <div className="chat-thread__meta">
                      <span className="chat-thread__time">{c.lastMessageAt ? timeAgo(c.lastMessageAt) : '—'}</span>
                      {c.unreadCustomer > 0 && <span className="chat-unread-dot" />}
                    </div>
                  </button>
                ))}
            </div>
          </aside>

          <div className="chat-main">
            {!active ? (
              <div className="chat-empty">
                <Icon name="chat" width="44" height="44" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: 0 }}>Select a conversation</h3>
                <p style={{ maxWidth: 380, margin: 0 }}>
                  Open a conversation to discuss a piece or an order with our atelier team.
                </p>
              </div>
            ) : (
              <>
                <div className="chat-main__head">
                  <div style={{ minWidth: 0 }}>
                    <h3 className="chat-main__title">{active.subject || 'Conversation'}</h3>
                    <div className="chat-main__ctx">
                      {active.orderNumber && (
                        <Link to={`/order/${active.orderId}`}>Order {active.orderNumber}</Link>
                      )}
                      {active.productTitle && (
                        <Link to={`/product/${active.productId}`}>{active.productTitle}</Link>
                      )}
                    </div>
                  </div>
                  <span className="badge badge--neutral">Concierge</span>
                </div>

                {threadError ? (
                  <ErrorState description={threadError} onRetry={() => activeId && openThread(activeId)} />
                ) : (
                  <div className="chat-messages" ref={scrollRef}>
                    {loadingThread && <LoadingState label="Loading messages…" />}
                    {!loadingThread && messages.length === 0 && (
                      <div className="chat-empty" style={{ padding: 30 }}>
                        <p style={{ maxWidth: 420 }}>No messages yet — say hello and tell us what you have in mind.</p>
                      </div>
                    )}
                    {!loadingThread &&
                      groups.map((g) => (
                        <div key={g.date} style={{ display: 'contents' }}>
                          <div className="chat-date-divider">
                            {sameDay(g.date, new Date().toISOString()) ? 'Today' : g.date}
                          </div>
                          {g.items.map((m) => (
                            <ChatMessage key={m.id} message={m} />
                          ))}
                        </div>
                      ))}
                  </div>
                )}

                <form className="chat-composer" onSubmit={send}>
                  <input
                    className="input"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Write a message…"
                    disabled={!!threadError}
                    maxLength={4000}
                  />
                  <button className="btn btn--dark" type="submit" disabled={sending || !composer.trim() || !!threadError}>
                    <Icon name="arrow-right" width="16" height="16" />
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
