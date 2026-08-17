import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function useUnread(pollMs = 20000) {
  const { customer } = useAuth()
  const [chat, setChat] = useState(0)
  const [notifications, setNotifications] = useState(0)
  const timer = useRef<number | null>(null)

  const refresh = useCallback(() => {
    if (!customer) {
      setChat(0)
      setNotifications(0)
      return
    }
    void api.getUnreadChat().then((r) => setChat(r.count)).catch(() => {})
    void api.getUnreadNotifications().then((r) => setNotifications(r.count)).catch(() => {})
  }, [customer])

  useEffect(() => {
    refresh()
    timer.current = window.setInterval(refresh, pollMs)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [refresh, pollMs])

  return { chat, notifications, refresh }
}
