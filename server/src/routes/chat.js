import { Router } from 'express'
import { nanoid } from 'nanoid'
import db, { now } from '../db.js'
import { requireCustomer, requireAdmin } from '../auth.js'
import {
  clean,
  sendError,
  rowToConversation,
  rowToMessage,
  ensureConversation,
  addMessage,
  createNotification,
} from '../helpers.js'

const router = Router()

// GET /api/chat/conversations — my conversations (customer)
router.get('/conversations', requireCustomer, (req, res) => {
  const rows = db
    .prepare(
      `SELECT cv.*, p.title AS product_title, p.images AS product_images, o.order_number,
              c.name AS customer_name
       FROM chat_conversations cv
       LEFT JOIN products p ON p.id = cv.product_id
       LEFT JOIN orders o ON o.id = cv.order_id
       LEFT JOIN customers c ON c.id = cv.customer_id
       WHERE cv.customer_id = ?
       ORDER BY COALESCE(cv.last_message_at, cv.created_at) DESC`
    )
    .all(req.customer.id)

  const items = rows.map((r) => {
    const conv = rowToConversation(r)
    conv.productImage = r.product_images ? JSON.parse(r.product_images)[0] ?? null : null
    return conv
  })

  res.json({ items })
})

// POST /api/chat/conversations — create or open a conversation
// { productId?, orderId?, subject? }
router.post('/conversations', requireCustomer, (req, res) => {
  const productId = clean(req.body.productId) || null
  const orderId = clean(req.body.orderId) || null
  const subject = clean(req.body.subject) || null

  let product = null
  if (productId) {
    product = db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').get(productId, productId)
    if (!product) return sendError(res, 404, 'Product not found')
  }
  if (orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (!order) return sendError(res, 404, 'Order not found')
    if (order.customer_id !== req.customer.id) return sendError(res, 403, 'Order not found')
  }

  const conversation = ensureConversation({
    customerId: req.customer.id,
    productId: product ? product.id : null,
    orderId: orderId || null,
    subject: subject || (product ? product.title : null),
  })

  // For a fresh product-linked conversation, seed the welcome guidance once.
  const messageCount = db
    .prepare('SELECT COUNT(*) AS c FROM chat_messages WHERE conversation_id = ?')
    .get(conversation.id).c
  if (messageCount === 0) {
    addMessage({
      conversationId: conversation.id,
      sender: 'system',
      body: 'Continue this chat to order this design. If you would like a personal design or any modification, tell us and our team can discuss the customization with you.',
    })
  }

  const full = db
    .prepare(
      `SELECT cv.*, p.title AS product_title, p.images AS product_images, o.order_number, c.name AS customer_name
       FROM chat_conversations cv
       LEFT JOIN products p ON p.id = cv.product_id
       LEFT JOIN orders o ON o.id = cv.order_id
       LEFT JOIN customers c ON c.id = cv.customer_id
       WHERE cv.id = ?`
    )
    .get(conversation.id)
  const conv = rowToConversation(full)
  conv.productImage = full.product_images ? JSON.parse(full.product_images)[0] ?? null : null

  res.status(201).json({ conversation: conv })
})

// GET /api/chat/conversations/:id
router.get('/conversations/:id', requireCustomer, (req, res) => {
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id)
  if (!conv) return sendError(res, 404, 'Conversation not found')
  if (conv.customer_id !== req.customer.id && req.customer.role !== 'admin') {
    return sendError(res, 403, 'You do not have access to this conversation')
  }

  if (conv.customer_id === req.customer.id) {
    db.prepare('UPDATE chat_conversations SET unread_customer = 0 WHERE id = ?').run(conv.id)
  } else {
    db.prepare('UPDATE chat_conversations SET unread_admin = 0 WHERE id = ?').run(conv.id)
  }

  const messages = db
    .prepare('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conv.id)
    .map(rowToMessage)

  const full = db
    .prepare(
      `SELECT cv.*, p.title AS product_title, p.images AS product_images, o.order_number, c.name AS customer_name
       FROM chat_conversations cv
       LEFT JOIN products p ON p.id = cv.product_id
       LEFT JOIN orders o ON o.id = cv.order_id
       LEFT JOIN customers c ON c.id = cv.customer_id
       WHERE cv.id = ?`
    )
    .get(conv.id)
  const conversation = rowToConversation(full)
  conversation.productImage = full.product_images ? JSON.parse(full.product_images)[0] ?? null : null

  res.json({ conversation, messages })
})

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', requireCustomer, (req, res) => {
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id)
  if (!conv) return sendError(res, 404, 'Conversation not found')
  if (conv.customer_id !== req.customer.id && req.customer.role !== 'admin') {
    return sendError(res, 403, 'You do not have access to this conversation')
  }

  const body = clean(req.body.body)
  if (!body) return sendError(res, 400, 'Message cannot be empty')
  if (body.length > 4000) return sendError(res, 400, 'Message is too long')

  const sender = req.customer.role === 'admin' ? 'admin' : 'customer'
  const message = addMessage({ conversationId: conv.id, sender, body })

  if (sender === 'admin') {
    createNotification(
      `customer:${conv.customer_id}`,
      'chat',
      'New message',
      req.customer.name,
      `conversation:${conv.id}`
    )
  } else {
    createNotification('admin', 'chat', 'New chat message', body.slice(0, 80), `conversation:${conv.id}`)
  }

  res.status(201).json({ message: rowToMessage(message) })
})

// GET /api/chat/unread-count — total unread across my conversations
router.get('/unread-count', requireCustomer, (req, res) => {
  const row = db
    .prepare(
      'SELECT COALESCE(SUM(unread_customer), 0) AS count FROM chat_conversations WHERE customer_id = ?'
    )
    .get(req.customer.id)
  res.json({ count: row.count })
})

// ---- Admin chat routes (API layer for PART 2) ----
router.get('/admin/conversations', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT cv.*, p.title AS product_title, p.images AS product_images, o.order_number, c.name AS customer_name
       FROM chat_conversations cv
       LEFT JOIN products p ON p.id = cv.product_id
       LEFT JOIN orders o ON o.id = cv.order_id
       LEFT JOIN customers c ON c.id = cv.customer_id
       ORDER BY COALESCE(cv.last_message_at, cv.created_at) DESC LIMIT 200`
    )
    .all()
  res.json({ items: rows.map(rowToConversation) })
})

export default router
