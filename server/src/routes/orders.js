import { Router } from 'express'
import { nanoid } from 'nanoid'
import db, { now } from '../db.js'
import { requireCustomer } from '../auth.js'
import {
  clean,
  parseJson,
  sendError,
  rowToOrder,
  rowToConversation,
  ensureConversation,
  addMessage,
  createNotification,
} from '../helpers.js'

const router = Router()

function generateOrderNumber() {
  const n = nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, '')
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `MD-${ymd}-${n}`
}

function findVariationOption(product, name, value) {
  const group = (product.variations || []).find((v) => v.name === name)
  if (!group) return null
  return group.options.find((o) => o.value === value) || null
}

// POST /api/orders — create an order request (BUY NOW)
router.post('/', requireCustomer, (req, res) => {
  const productId = clean(req.body.productId)
  const quantity = parseInt(req.body.quantity, 10)
  const variationsRaw = Array.isArray(req.body.variations) ? req.body.variations : []
  const notes = clean(req.body.customerNotes)

  const addressLine1 = clean(req.body.addressLine1)
  const addressLine2 = clean(req.body.addressLine2)
  const city = clean(req.body.city)
  const state = clean(req.body.state)
  const postalCode = clean(req.body.postalCode)
  const country = clean(req.body.country)

  if (!productId) return sendError(res, 400, 'Please select a product')
  if (!quantity || quantity < 1 || quantity > 99) return sendError(res, 400, 'Please enter a valid quantity')
  if (!addressLine1 || !city || !postalCode || !country) {
    return sendError(res, 400, 'Please complete the delivery address (street, city, postal code and country)')
  }

  const productRow = db.prepare("SELECT * FROM products WHERE id = ? OR slug = ?").get(productId, productId)
  if (!productRow || productRow.status !== 'active') {
    return sendError(res, 404, 'Product not found')
  }

  const product = {
    ...productRow,
    variations: parseJson(productRow.variations, []),
    images: parseJson(productRow.images, []),
  }

  const customer = req.customer
  const name = clean(req.body.name) || customer.name
  const email = clean(req.body.email) || customer.email
  const phone = clean(req.body.phone) || customer.phone
  if (!name) return sendError(res, 400, 'Please provide your name')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(res, 400, 'Please provide a valid email')
  if (!phone) return sendError(res, 400, 'Please provide a phone number')

  // Validate variations against the product's definition
  const selectedVariations = []
  let variationTotal = 0
  for (const v of variationsRaw) {
    const vname = clean(v.name)
    const vvalue = clean(v.value)
    if (!vname || !vvalue) return sendError(res, 400, 'Invalid variation selection')
    const option = findVariationOption(product, vname, vvalue)
    if (!option) return sendError(res, 400, `Unavailable option "${vvalue}" for ${vname}`)
    if (option.inStock === false) return sendError(res, 400, `"${vvalue}" is currently unavailable`)
    selectedVariations.push({ name: vname, value: vvalue, priceDelta: option.priceDelta || 0 })
    variationTotal += option.priceDelta || 0
  }

  // Server-side price computation — client totals are never trusted.
  const basePrice = product.price
  const mrp = product.mrp
  const unitPrice = basePrice + variationTotal
  const discountAmount = mrp && mrp > unitPrice ? Math.round((mrp - unitPrice) * 100) / 100 : 0

  const subtotal = Math.round(basePrice * quantity * 100) / 100
  const customizationCharge = Math.round(Math.max(0, variationTotal) * quantity * 100) / 100
  const discount = Math.round(discountAmount * quantity * 100) / 100
  const shippingCharge = 0
  const finalAmount = Math.round((subtotal + customizationCharge - discount + shippingCharge) * 100) / 100

  const oid = nanoid()
  const t = now()
  const orderNumber = generateOrderNumber()

  const items = [
    {
      productId: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      image: (product.images || [])[0] || null,
      unitPrice: basePrice,
      quantity,
      priceDelta: variationTotal,
    },
  ]

  const address = {
    name,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
  }

  db.prepare(
    `INSERT INTO orders (id, order_number, customer_id, status, items, selected_variations, quantity, subtotal, discount, customization_charge, shipping_charge, final_amount, customer_notes, admin_notes, address, created_at, updated_at)
     VALUES (?, ?, ?, 'PENDING_CONFIRMATION', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`
  ).run(
    oid,
    orderNumber,
    customer.id,
    JSON.stringify(items),
    JSON.stringify(selectedVariations),
    quantity,
    subtotal,
    discount,
    customizationCharge,
    shippingCharge,
    finalAmount,
    notes,
    JSON.stringify(address),
    t,
    t
  )

  const conversation = ensureConversation({
    customerId: customer.id,
    productId: product.id,
    orderId: oid,
    subject: `Order ${orderNumber} · ${product.title}`,
  })

  addMessage({
    conversationId: conversation.id,
    sender: 'system',
    body: 'The order request has been received. If you would like any design changes, customization, size changes or other modifications, you can discuss them with our team through chat.',
  })

  createNotification('admin', 'order', 'New order request', `Order ${orderNumber} for ${product.title}`, `order:${oid}`)
  createNotification(
    `customer:${customer.id}`,
    'order',
    'Order request received',
    `Your order ${orderNumber} has been received. We will be in touch to confirm the details.`,
    `order:${oid}`
  )

  const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(oid)
  res.status(201).json({
    order: rowToOrder(orderRow),
    conversation: rowToConversation(conversation),
  })
})

// GET /api/orders/mine
router.get('/mine', requireCustomer, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC')
    .all(req.customer.id)
  const items = rows.map((r) => {
    const order = rowToOrder(r)
    const conv = db
      .prepare('SELECT * FROM chat_conversations WHERE order_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(r.id)
    return { ...order, conversation: conv ? rowToConversation(conv) : null }
  })
  res.json({ items })
})

// GET /api/orders/:id
router.get('/:id', requireCustomer, (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!row) return sendError(res, 404, 'Order not found')
  if (row.customer_id !== req.customer.id && req.customer.role !== 'admin') {
    return sendError(res, 403, 'You do not have access to this order')
  }
  const conv = db
    .prepare('SELECT * FROM chat_conversations WHERE order_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(row.id)
  res.json({
    order: rowToOrder(row),
    conversation: conv ? rowToConversation(conv) : null,
  })
})

export default router
