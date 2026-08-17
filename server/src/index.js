import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import chatRoutes from './routes/chat.js'
import reviewRoutes from './routes/reviews.js'
import notificationRoutes from './routes/notifications.js'
import settingsRoutes from './routes/settings.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.use('/api/images', express.static(path.join(__dirname, '..', 'public', 'images'), { maxAge: '7d' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'maison-doree-api', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings', settingsRoutes)

// Serve built client in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('API error:', err)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Maison Dorée API listening on http://localhost:${PORT}`)
})
