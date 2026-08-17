import { Router } from 'express'
import { nanoid } from 'nanoid'
import db, { now } from '../db.js'
import { requireCustomer, requireAdmin } from '../auth.js'
import { clean, sendError } from '../helpers.js'

const router = Router()

// POST /api/reviews — submit a review for an ordered product
router.post('/', requireCustomer, (req, res) => {
  const productId = clean(req.body.productId)
  const orderId = clean(req.body.orderId) || null
  const rating = parseInt(req.body.rating, 10)
  const reviewText = clean(req.body.reviewText)

  if (!productId) return sendError(res, 400, 'Please select a product')
  if (!rating || rating < 1 || rating > 5) return sendError(res, 400, 'Please select a rating between 1 and 5')
  if (reviewText.length < 5) return sendError(res, 400, 'Please write a short review (at least 5 characters)')
  if (reviewText.length > 3000) return sendError(res, 400, 'Review is too long')

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
  if (!product) return sendError(res, 404, 'Product not found')

  const existing = db
    .prepare('SELECT * FROM reviews WHERE customer_id = ? AND product_id = ?')
    .get(req.customer.id, productId)
  if (existing) return sendError(res, 409, 'You have already reviewed this product')

  let verifiedPurchase = 0
  if (orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (
      order &&
      order.customer_id === req.customer.id &&
      ['DELIVERED', 'COMPLETED', 'PAID', 'PROCESSING', 'SHIPPED', 'CONFIRMED'].includes(order.status)
    ) {
      const items = JSON.parse(order.items || '[]')
      if (items.some((i) => i.productId === productId)) verifiedPurchase = 1
    }
  }

  const rid = nanoid()
  const t = now()
  db.prepare(
    `INSERT INTO reviews (id, customer_id, product_id, order_id, rating, review_text, status, verified_purchase, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`
  ).run(rid, req.customer.id, productId, orderId, rating, reviewText, verifiedPurchase, t, t)

  res.status(201).json({
    review: {
      id: rid,
      productId,
      orderId,
      rating,
      reviewText,
      status: 'PENDING',
      verifiedPurchase: !!verifiedPurchase,
      createdAt: t,
    },
  })
})

// GET /api/reviews/mine — my submitted reviews
router.get('/mine', requireCustomer, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, p.title AS product_title, p.slug AS product_slug, p.images AS product_images
       FROM reviews r LEFT JOIN products p ON p.id = r.product_id
       WHERE r.customer_id = ? ORDER BY r.created_at DESC`
    )
    .all(req.customer.id)
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productTitle: r.product_title,
      productSlug: r.product_slug,
      productImage: r.product_images ? JSON.parse(r.product_images)[0] ?? null : null,
      orderId: r.order_id,
      rating: r.rating,
      reviewText: r.review_text,
      status: r.status,
      verifiedPurchase: !!r.verified_purchase,
      createdAt: r.created_at,
    })),
  })
})

// GET /api/reviews/admin — pending reviews for moderation (PART 2 admin)
router.get('/admin', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, c.name AS customer_name, p.title AS product_title
       FROM reviews r
       LEFT JOIN customers c ON c.id = r.customer_id
       LEFT JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC LIMIT 200`
    )
    .all()
  res.json({ items: rows })
})

export default router
