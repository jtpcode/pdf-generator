import express from 'express'
import { User, Session } from '../models/index.js'

const testingRouter = express.Router()

// Reset database - only available in test/development mode
testingRouter.post('/reset', async (req, res) => {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Operation not allowed in production' })
  }

  try {
    await Session.destroy({ where: {} })
    await User.destroy({ where: {} })

    res.status(204).end()
  } catch (error) {
    console.error('Reset failed:', error)
    res.status(500).json({ error: 'Failed to reset database' })
  }
})

export default testingRouter