import { Router } from 'express'
import db, { getSetting, setSetting } from '../db.js'
import { requireAdmin } from '../auth.js'
import { sendError } from '../helpers.js'

const router = Router()

const PUBLIC_KEYS = [
  'SHOWROOM_3D_ENABLED',
  'SITE_NAME',
  'SITE_TAGLINE',
  'SUPPORT_EMAIL',
  'SUPPORT_PHONE',
]

// GET /api/settings/public
router.get('/public', (req, res) => {
  const settings = {}
  for (const key of PUBLIC_KEYS) {
    settings[key] = getSetting(key, key.startsWith('SHOWROOM') ? false : null)
  }
  res.json({ settings })
})

// GET /api/settings — full settings (admin only)
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const settings = {}
  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value)
    } catch {
      settings[row.key] = row.value
    }
  }
  res.json({ settings })
})

// PUT /api/settings — update settings (admin only, PART 2)
router.put('/', requireAdmin, (req, res) => {
  const body = req.body?.settings
  if (!body || typeof body !== 'object') return sendError(res, 400, 'Invalid settings payload')
  for (const [key, value] of Object.entries(body)) {
    setSetting(key, value)
  }
  res.json({ ok: true })
})

export default router
