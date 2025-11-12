import express from 'express'

import { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler } from './utils/middleware.js'
import { PORT } from './utils/config.js'
import { connectToDatabase } from './utils/db.js'
import usersRouter from './controllers/users.js'

const app = express()

// Middleware
app.use(helmet())
app.use(jsonParser)
app.use(staticFiles)
app.use(logger)

// Routes
app.use('/api/users', usersRouter)

// Error handling middleware
app.use(unknownEndpoint)
app.use(errorHandler)

// Export app for testing
export default app

// Start the server only if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  await connectToDatabase()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}