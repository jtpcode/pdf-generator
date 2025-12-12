import { Router } from 'express'
import { tokenExtractor } from '../utils/middleware.js'

const router = Router()

router.delete('/', tokenExtractor, async (req, res) => {
  await req.session.destroy()

  res.status(204).end()
})

export default router