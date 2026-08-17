import { Router } from 'express'
import { nanoid } from 'nanoid'
import db, { now } from '../db.js'
import { getSessionCustomer } from '../auth.js'

const router = Router()

function recipientFor(customer) {
  if (!customer) return 'guest'
  return customer.role === 'admin' ? 'admin' : `customer:${customer.id}`
}

// GET /api/notifications — notifications for the current user
router.get('/', (req, res) => {
  const customer = getSessionCustomer(req)
  const recipient = recipientFor(customer)

  const rows = db
    .prepare(
      'SELECT * FROM notifications WHERE recipient = ? ORDER BY created_at DESC LIMIT 100'
    )
    .all(recipient)

  res.json({
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      relatedEntity: r.related_entity,
      read: !!r.read,
      createdAt: r.created_at,
    })),
  })
})

// GET /api/notifications/unread-count
router.get('/unread-count', (req, res) => {
  const customer = getSessionCustomer(req)
  const recipient = recipientFor(customer)
  const row = db
    .prepare('SELECT COUNT(*) AS c FROM notifications WHERE recipient = ? AND read = 0')
    .get(recipient)
  res.json({ count: row.c })
})

// POST /api/notifications/:id/read
router.post('/:id/read', (req, res) => {
  const customer = getSessionCustomer(req)
  const recipient = recipientFor(customer)
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND recipient = ?').run(
    req.params.id,
    recipient
  )
  res.json({ ok: true })
})

// POST /api/notifications/read-all
router.post('/read-all', (req, res) => {
  const customer = getSessionCustomer(req)
  const recipient = recipientFor(customer)
  db.prepare('UPDATE notifications SET read = 1 WHERE recipient = ?').run(recipient)
  res.json({ ok: true })
})

export default router
