import express from 'express'
import { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler } from './utils/middleware.js'

const app = express()

app.use(helmet())
app.use(jsonParser)
app.use(staticFiles)
app.use(logger)

// Routes
app.get('/', (req, res) => {
  res.send('TESTING')
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})