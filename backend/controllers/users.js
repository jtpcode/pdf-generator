import bcrypt from 'bcrypt'
import { Router } from 'express'
import { User } from '../models/index.js'

const router = Router()

// router.get('/', async (req, res) => {
//   const users = await User.findAll({
//     attributes: { exclude: ['passwordHash'] },
//   })

//   res.json(users)
// })

router.post('/', async (req, res) => {
  const { username, name, password } = req.body

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = await User.create({
    username,
    name,
    passwordHash,
  })

  const { passwordHash: _, ...userWithoutPassword } = user.toJSON()
  res.status(201).json(userWithoutPassword)
})

// router.get('/:id', async (req, res) => {
//   const user = await User.findByPk(req.params.id, {
//     attributes: ['name', 'username'],
//   })
//   if (!user) {
//     return res.status(404).json({ error: 'User not found' })
//   }
//   res.json(user)
// })

export default router