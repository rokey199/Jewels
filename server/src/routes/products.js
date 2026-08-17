import { Router } from 'express'
import db from '../db.js'
import { rowToProduct } from '../seed.js'
import { clean, clampInt, sendError } from '../helpers.js'

const router = Router()

function buildProductQuery(params) {
  const where = [`p.status = 'active'`]
  const args = []

  if (params.q) {
    where.push(`(p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ? OR p.sku LIKE ?)`)
    const like = `%${params.q}%`
    args.push(like, like, like, like)
  }
  if (params.category) {
    where.push(`c.slug = ?`)
    args.push(params.category)
  }
  if (params.categoryType && params.categoryType !== 'all') {
    where.push(`c.type = ?`)
    args.push(params.categoryType)
  }
  if (params.featured === '1' || params.featured === 'true') {
    where.push('p.featured = 1')
  }
  if (params.availability && params.availability !== 'all') {
    where.push('p.availability = ?')
    args.push(params.availability)
  }
  const min = parseFloat(params.priceMin)
  if (!Number.isNaN(min) && min > 0) {
    where.push('p.price >= ?')
    args.push(min)
  }
  const max = parseFloat(params.priceMax)
  if (!Number.isNaN(max) && max > 0) {
    where.push('p.price <= ?')
    args.push(max)
  }

  const sort = params.sort || 'featured'
  const orderBy = {
    featured: 'p.featured DESC, p.display_order ASC, p.popularity DESC',
    newest: 'p.created_at DESC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    name_asc: 'p.title ASC',
    popularity: 'p.popularity DESC',
  }[sort] || 'p.featured DESC, p.popularity DESC'

  return { where: where.join(' AND '), args, orderBy }
}

// GET /api/products
router.get('/', (req, res) => {
  const page = clampInt(req.query.page, 1, 1, 10000)
  const limit = clampInt(req.query.limit, 12, 1, 48)
  const offset = (page - 1) * limit

  const { where, args, orderBy } = buildProductQuery(req.query)

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where}`
    )
    .get(...args)

  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...args, limit, offset)

  const total = totalRow.c
  res.json({
    items: rows.map(rowToProduct),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    limit,
  })
})

// GET /api/products/:slug
router.get('/:slug', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ?`
    )
    .get(req.params.slug)

  if (!row || row.status !== 'active') {
    return sendError(res, 404, 'Product not found')
  }

  const product = rowToProduct(row)

  const reviews = db
    .prepare(
      `SELECT r.*, c.name AS customer_name
       FROM reviews r LEFT JOIN customers c ON c.id = r.customer_id
       WHERE r.product_id = ? AND r.status = 'APPROVED'
       ORDER BY r.created_at DESC LIMIT 50`
    )
    .all(row.id)

  const ratingSummary = db
    .prepare(
      `SELECT COUNT(*) AS count, COALESCE(SUM(rating),0) AS total FROM reviews WHERE product_id = ? AND status = 'APPROVED'`
    )
    .get(row.id)
  const avgRating = ratingSummary.count > 0 ? Math.round((ratingSummary.total / ratingSummary.count) * 10) / 10 : 0

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const cnt = db
      .prepare(
        `SELECT COUNT(*) AS c FROM reviews WHERE product_id = ? AND status = 'APPROVED' AND rating = ?`
      )
      .get(row.id, star).c
    return { star, count: cnt, percent: ratingSummary.count > 0 ? Math.round((cnt / ratingSummary.count) * 100) : 0 }
  })

  const related = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'active' AND p.category_id = ? AND p.id != ?
       ORDER BY p.featured DESC, p.popularity DESC LIMIT 4`
    )
    .all(row.category_id, row.id)
    .map(rowToProduct)

  const similar = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'active' AND p.id != ? AND (p.tags LIKE ? OR p.price BETWEEN ? AND ?)
       ORDER BY ABS(p.price - ?) ASC LIMIT 4`
    )
    .all(
      row.id,
      `%${product.tags?.[0] || ''}%`,
      row.price * 0.6,
      row.price * 1.5,
      row.price
    )
    .map(rowToProduct)

  res.json({
    product,
    reviews: reviews.map((r) => ({
      id: r.id,
      productId: r.product_id,
      orderId: r.order_id,
      rating: r.rating,
      reviewText: r.review_text,
      status: r.status,
      verifiedPurchase: !!r.verified_purchase,
      customerName: r.customer_name || 'Verified Customer',
      createdAt: r.created_at,
    })),
    ratingSummary: { count: ratingSummary.count, average: avgRating },
    ratingDistribution: distribution,
    related,
    similar,
  })
})

export default router
