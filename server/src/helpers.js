import { nanoid } from 'nanoid'
import db, { now } from './db.js'

export function parseJson(v, fallback = null) {
  if (v == null) return fallback
  try {
    return JSON.parse(v)
  } catch {
    return fallback
  }
}

export function clean(value, def = '') {
  return value == null ? def : String(value).trim()
}

export function clampInt(value, def, min, max) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return def
  return Math.min(max, Math.max(min, n))
}

export function sendError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra })
}

export function createNotification(recipient, type, title, message, relatedEntity = null) {
  db.prepare(
    'INSERT INTO notifications (id, recipient, type, title, message, related_entity, read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
  ).run(nanoid(), recipient, type, title, message ?? null, relatedEntity ?? null, now())
}

export function ensureConversation({ customerId, productId = null, orderId = null, subject = null }) {
  let conversation = null
  if (orderId) {
    conversation = db
      .prepare('SELECT * FROM chat_conversations WHERE order_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(orderId)
  }
  if (!conversation && productId) {
    conversation = db
      .prepare(
        'SELECT * FROM chat_conversations WHERE customer_id = ? AND product_id = ? AND order_id IS NULL ORDER BY created_at DESC LIMIT 1'
      )
      .get(customerId, productId)
  }
  if (!conversation) {
    const cid = nanoid()
    db.prepare(
      `INSERT INTO chat_conversations (id, customer_id, product_id, order_id, subject, status, last_message_at, unread_customer, unread_admin, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'open', NULL, 0, 0, ?, ?)`
    ).run(cid, customerId, productId ?? null, orderId ?? null, subject ?? null, now(), now())
    conversation = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(cid)
  }
  return conversation
}

export function addMessage({ conversationId, sender, body }) {
  const mid = nanoid()
  const t = now()
  db.prepare(
    'INSERT INTO chat_messages (id, conversation_id, sender, body, read, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(mid, conversationId, sender, body, t)
  if (sender === 'admin') {
    db.prepare(
      'UPDATE chat_conversations SET unread_customer = unread_customer + 1, last_message_at = ?, updated_at = ? WHERE id = ?'
    ).run(t, t, conversationId)
  } else {
    db.prepare(
      'UPDATE chat_conversations SET unread_admin = unread_admin + 1, last_message_at = ?, updated_at = ? WHERE id = ?'
    ).run(t, t, conversationId)
  }
  return db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(mid)
}

export function rowToMessage(row) {
  if (!row) return null
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    body: row.body,
    read: !!row.read,
    createdAt: row.created_at,
  }
}

export function rowToConversation(row) {
  if (!row) return null
  return {
    id: row.id,
    customerId: row.customer_id,
    productId: row.product_id,
    orderId: row.order_id,
    subject: row.subject,
    status: row.status,
    lastMessageAt: row.last_message_at,
    unreadCustomer: row.unread_customer,
    unreadAdmin: row.unread_admin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productTitle: row.product_title ?? null,
    productImage: row.product_image ?? null,
    orderNumber: row.order_number ?? null,
    customerName: row.customer_name ?? null,
  }
}

export function rowToOrder(row) {
  if (!row) return null
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    status: row.status,
    items: parseJson(row.items, []),
    selectedVariations: parseJson(row.selected_variations, []),
    quantity: row.quantity,
    subtotal: row.subtotal,
    discount: row.discount,
    customizationCharge: row.customization_charge,
    shippingCharge: row.shipping_charge,
    finalAmount: row.final_amount,
    customerNotes: row.customer_notes,
    adminNotes: row.admin_notes,
    address: parseJson(row.address, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
    paidAt: row.paid_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
  }
}

export const ORDER_STATUSES = [
  'PENDING_CONFIRMATION',
  'DISCUSSION',
  'CONFIRMED',
  'PAYMENT_PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
]
