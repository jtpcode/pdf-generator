import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler } from './utils/middleware.js'
import { connectToDatabase } from './utils/db.js'
import usersRouter from './controllers/users.js'
import loginRouter from './controllers/login.js'
import logoutRouter from './controllers/logout.js'
import filesRouter from './controllers/files.js'
import testingRouter from './controllers/testing.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist')

await connectToDatabase()

// Middleware
app.use(helmet())
app.use(jsonParser)
app.use(staticFiles)
app.use(logger)

// Health check
app.get('/health', (req, res) => {
  res.send('OK')
})

// Routes
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/logout', logoutRouter)
app.use('/api/files', filesRouter)

// Testing routes - only in test mode
if (process.env.NODE_ENV === 'test') {
  app.use('/api/testing', testingRouter)
}

// Serve React app for all other routes
app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health' || path.extname(req.path)) {
    return next()
  }

  return res.sendFile(path.join(distDir, 'index.html'))
})

// Error handling middleware
app.use(unknownEndpoint)
app.use(errorHandler)

export default app