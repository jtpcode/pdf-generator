import express from 'express'
import { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler } from './utils/middleware.js'
import { PORT } from './utils/config.js'
import { connectToDatabase } from './utils/db.js'

const app = express()

// Middleware
app.use(helmet())
app.use(jsonParser)
app.use(staticFiles)
app.use(logger)

// Routes
app.get('/', (req, res) => {
  res.send('TESTING')
})

// Error handling middleware
app.use(unknownEndpoint)
app.use(errorHandler)

// Start the server
await connectToDatabase()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})