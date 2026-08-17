import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import db, { now } from '../db.js'
import {
  createSession,
  destroySession,
  getSessionCustomer,
  setSessionCookie,
  clearSessionCookie,
  rowToCustomer,
  requireCustomer,
} from '../auth.js'
import { clean, sendError } from '../helpers.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email) {
  return EMAIL_RE.test(email)
}

function validatePassword(pw) {
  return typeof pw === 'string' && pw.length >= 8
}

// Link guest orders placed with this email to the newly registered account.
function linkGuestOrders(email, customerId) {
  db.prepare("UPDATE orders SET customer_id = ? WHERE customer_id IS NULL AND items LIKE '%\"email\":\"' || ? || '\"%'").run(
    customerId,
    email
  )
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const name = clean(req.body.name)
  const email = clean(req.body.email).toLowerCase()
  const phone = clean(req.body.phone)
  const password = req.body.password

  if (name.length < 2) return sendError(res, 400, 'Please provide your full name')
  if (!validateEmail(email)) return sendError(res, 400, 'Please provide a valid email address')
  if (phone && phone.length < 6) return sendError(res, 400, 'Please provide a valid phone number')
  if (!validatePassword(password)) return sendError(res, 400, 'Password must be at least 8 characters')

  const existing = db.prepare('SELECT id FROM customers WHERE email = ?').get(email)
  if (existing) return sendError(res, 409, 'An account with this email already exists')

  const hash = bcrypt.hashSync(password, 10)
  const cid = nanoid()
  const t = now()
  db.prepare(
    `INSERT INTO customers (id, name, email, phone, password_hash, role, status, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'customer', 'active', 0, ?, ?)`
  ).run(cid, name, email, phone, hash, t, t)

  linkGuestOrders(email, cid)

  const token = createSession(cid)
  setSessionCookie(res, token)
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(cid)
  res.status(201).json({ customer: rowToCustomer(customer) })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const email = clean(req.body.email).toLowerCase()
  const password = req.body.password
  if (!email || !password) return sendError(res, 400, 'Email and password are required')

  const customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(email)
  if (!customer || !bcrypt.compareSync(password, customer.password_hash)) {
    return sendError(res, 401, 'Incorrect email or password')
  }
  if (customer.status !== 'active') {
    return sendError(res, 403, 'This account has been disabled')
  }

  const token = createSession(customer.id)
  setSessionCookie(res, token)
  res.json({ customer: rowToCustomer(customer) })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.cookies?.md_session
  if (token) destroySession(token)
  clearSessionCookie(res)
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  const customer = getSessionCustomer(req)
  if (!customer) return res.json({ customer: null })
  res.json({ customer: rowToCustomer(customer) })
})

// PUT /api/auth/profile
router.put('/profile', requireCustomer, (req, res) => {
  const name = clean(req.body.name)
  const phone = clean(req.body.phone)
  if (name.length < 2) return sendError(res, 400, 'Please provide your full name')
  db.prepare('UPDATE customers SET name = ?, phone = ?, updated_at = ? WHERE id = ?').run(
    name,
    phone,
    now(),
    req.customer.id
  )
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.customer.id)
  res.json({ customer: rowToCustomer(customer) })
})

// PUT /api/auth/password
router.put('/password', requireCustomer, (req, res) => {
  const current = req.body.currentPassword
  const next = req.body.newPassword
  if (!validatePassword(next)) return sendError(res, 400, 'New password must be at least 8 characters')
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.customer.id)
  if (!bcrypt.compareSync(current, customer.password_hash)) {
    return sendError(res, 400, 'Current password is incorrect')
  }
  db.prepare('UPDATE customers SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    bcrypt.hashSync(next, 10),
    now(),
    req.customer.id
  )
  res.json({ ok: true })
})

// PUT /api/auth/address
router.put('/address', requireCustomer, (req, res) => {
  const addressLine1 = clean(req.body.addressLine1)
  const city = clean(req.body.city)
  const state = clean(req.body.state)
  const postalCode = clean(req.body.postalCode)
  const country = clean(req.body.country)
  const addressLine2 = clean(req.body.addressLine2)

  if (!addressLine1 || !city || !postalCode || !country) {
    return sendError(res, 400, 'Address line, city, postal code and country are required')
  }

  db.prepare(
    `UPDATE customers SET address_line1 = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, updated_at = ? WHERE id = ?`
  ).run(addressLine1, addressLine2, city, state, postalCode, country, now(), req.customer.id)
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.customer.id)
  res.json({ customer: rowToCustomer(customer) })
})

export default router
