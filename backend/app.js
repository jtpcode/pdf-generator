import express from 'express'

import { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler, authRateLimiter, generalRateLimiter } from './utils/middleware.js'
import { connectToDatabase } from './utils/db.js'
import usersRouter from './controllers/users.js'
import loginRouter from './controllers/login.js'
import logoutRouter from './controllers/logout.js'
import filesRouter from './controllers/files.js'
import testingRouter from './controllers/testing.js'

const app = express()

await connectToDatabase()

// Middleware
app.use(helmet())
if (process.env.NODE_ENV !== 'test') {
  app.use(generalRateLimiter)
}
app.use(jsonParser)
app.use(staticFiles)
app.use(logger)

// Health check
app.get('/health', (req, res) => {
  res.send('OK')
})

// Routes
app.use('/api/users', process.env.NODE_ENV !== 'test' ? authRateLimiter : (_req, _res, next) => next(), usersRouter)
app.use('/api/login', process.env.NODE_ENV !== 'test' ? authRateLimiter : (_req, _res, next) => next(), loginRouter)
app.use('/api/logout', logoutRouter)
app.use('/api/files', filesRouter)

// Testing routes - only in test mode
if (process.env.NODE_ENV === 'test') {
  app.use('/api/testing', testingRouter)
}

// Error handling middleware
app.use(unknownEndpoint)
app.use(errorHandler)

export default app