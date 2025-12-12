import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { Router } from 'express'
import { User, Session } from '../models/index.js'
import { JWT_SECRET } from '../utils/config.js'
import { Op } from 'sequelize'

const router = Router()

router.post('/', async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({
    where: { username }
  })

  if (!user || user.disabled) {
    return res.status(401).json({
      error: 'invalid username or password'
    })
  }

  const passwordCorrect = await bcrypt.compare(password, user.passwordHash)

  if (!passwordCorrect) {
    return res.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    username: user.username,
    id: user.id,
  }

  const token = jwt.sign(userForToken, JWT_SECRET)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await Session.destroy({
    where: {
      userId: user.id,
      expiresAt: { [Op.lt]: new Date() }
    }
  })

  await Session.create({
    userId: user.id,
    tokenHash,
    expiresAt
  })

  res.status(200).send({
    token,
    username: user.username,
    name: user.name
  })
})

export default router