import { Router } from 'express'
import db from '../db.js'
import { rowToCategory } from '../seed.js'
import { clean, sendError } from '../helpers.js'

const router = Router()

// GET /api/categories
router.get('/', (req, res) => {
  const type = clean(req.query.type) // 'normal' | 'display' | 'all' | ''
  const featured = req.query.featured === '1' || req.query.featured === 'true'

  let where = `c.status = 'active'`
  const params = []
  if (type && type !== 'all') {
    where += ' AND c.type = ?'
    params.push(type)
  }
  if (featured) {
    where += ' AND c.featured = 1'
  }

  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') AS product_count
       FROM categories c WHERE ${where} ORDER BY c.display_order ASC, c.name ASC`
    )
    .all(...params)

  res.json({ items: rows.map(rowToCategory) })
})

// GET /api/categories/:slug
router.get('/:slug', (req, res) => {
  const row = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') AS product_count
       FROM categories c WHERE c.slug = ?`
    )
    .get(req.params.slug)
  if (!row || row.status !== 'active') {
    return sendError(res, 404, 'Category not found')
  }
  res.json(rowToCategory(row))
})

export default router
