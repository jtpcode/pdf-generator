import express from 'express'
import { User, Session } from '../models/index.js'

const testingRouter = express.Router()

// Reset database - only available in test mode
testingRouter.post('/reset', async (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ error: 'Operation allowed only in testing environment' })
  }

  try {
    await Session.destroy({ where: {}, truncate: { cascade: true } })
    await User.destroy({ where: {}, truncate: { cascade: true } })

    res.status(204).end()
  } catch (error) {
    console.error('Reset failed:', error)
    res.status(500).json({ error: 'Failed to reset database' })
  }
})

export default testingRouter