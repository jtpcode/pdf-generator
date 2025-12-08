import express from 'express'

import { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler } from './utils/middleware.js'
import { connectToDatabase } from './utils/db.js'
import usersRouter from './controllers/users.js'
import loginRouter from './controllers/login.js'
import testingRouter from './controllers/testing.js'

const app = express()

await connectToDatabase()

// Middleware
app.use(helmet())
app.use(jsonParser)
app.use(staticFiles)
app.use(logger)

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('OK')
})

// Routes
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

// Testing routes - only in test mode
if (process.env.NODE_ENV === 'test') {
  app.use('/api/testing', testingRouter)
}

// Error handling middleware
app.use(unknownEndpoint)
app.use(errorHandler)

// Export app for testing
export default app