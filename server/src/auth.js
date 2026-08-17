import { nanoid } from 'nanoid'
import db, { now } from './db.js'

const SESSION_COOKIE = 'md_session'
const SESSION_TTL_DAYS = 30

export function createSession(customerId) {
  const token = nanoid(48)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  db.prepare(
    'INSERT INTO sessions (id, customer_id, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(nanoid(), customerId, token, now(), expiresAt)
  return token
}

export function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function getSessionCustomer(req) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) return null
  const row = db
    .prepare(
      `SELECT c.* FROM sessions s JOIN customers c ON c.id = s.customer_id
       WHERE s.token = ? AND s.expires_at > ? AND c.status = 'active'`
    )
    .get(token, now())
  return row || null
}

export function setSessionCookie(res, token) {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}

export function rowToCustomer(row) {
  if (!row) return null
  const { password_hash, ...rest } = row
  return {
    id: rest.id,
    name: rest.name,
    email: rest.email,
    phone: rest.phone,
    role: rest.role,
    status: rest.status,
    emailVerified: !!rest.email_verified,
    addressLine1: rest.address_line1,
    addressLine2: rest.address_line2,
    city: rest.city,
    state: rest.state,
    postalCode: rest.postal_code,
    country: rest.country,
    createdAt: rest.created_at,
    updatedAt: rest.updated_at,
  }
}

export function requireCustomer(req, res, next) {
  const customer = getSessionCustomer(req)
  if (!customer) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  req.customer = customer
  next()
}

export function requireAdmin(req, res, next) {
  const customer = getSessionCustomer(req)
  if (!customer) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  if (customer.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  req.customer = customer
  req.admin = customer
  next()
}
