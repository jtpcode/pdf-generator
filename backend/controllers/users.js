import bcrypt from 'bcrypt'
import { Router } from 'express'
import { User } from '../models/index.js'

const router = Router()

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return 'Username is required'
  }
  if (username.length < 3 || username.length > 50) {
    return 'Username must be between 3 and 50 characters'
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, hyphens and underscores'
  }
  return undefined
}

const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return 'Name is required'
  }
  if (name.length < 1 || name.length > 100) {
    return 'Name must be between 1 and 100 characters'
  }
  return undefined
}

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required'
  }
  if (password.length < 12) {
    return 'Password must be at least 12 characters long'
  }
  if (password.length > 128) {
    return 'Password must be at most 128 characters long'
  }
  return undefined
}

router.post('/', async (req, res) => {
  const { username, name, password } = req.body

  const usernameError = validateUsername(username)
  if (usernameError) {
    return res.status(400).json({ error: usernameError })
  }

  const nameError = validateName(name)
  if (nameError) {
    return res.status(400).json({ error: nameError })
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return res.status(400).json({ error: passwordError })
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

export default router