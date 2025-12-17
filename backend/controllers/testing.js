import express from 'express'
import { User, Session, File } from '../models/index.js'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { UPLOADS_DIR } from '../utils/config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const testingRouter = express.Router()

// Reset database - only available in test mode
testingRouter.post('/resetDb', async (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ error: 'Operation allowed only in testing environment' })
  }

  try {
    await File.destroy({ where: {}, truncate: { cascade: true } })
    await Session.destroy({ where: {}, truncate: { cascade: true } })
    await User.destroy({ where: {}, truncate: { cascade: true } })

    res.status(204).end()
  } catch (error) {
    console.error('Database reset failed:', error)
    res.status(500).json({ error: 'Failed to reset database' })
  }
})

// Delete test uploads - only available in test mode
testingRouter.post('/deleteTestUploads', async (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ error: 'Operation allowed only in testing environment' })
  }

  try {
    const uploadsDir = path.join(__dirname, '..', UPLOADS_DIR)
    await fs.rm(uploadsDir, { recursive: true, force: true })
    // SAFE: UPLOADS_DIR is controlled via config and not user input
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.mkdir(uploadsDir, { recursive: true })

    res.status(204).end()
  } catch (error) {
    console.error('Failed to clean uploads directory:', error)
    res.status(500).json({ error: 'Failed to delete test uploads' })
  }
})

export default testingRouter