import bcrypt from 'bcrypt'
import { Router } from 'express'
import { User } from '../models/index.js'
import { tokenExtractor } from '../utils/middleware.js'

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
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  if (!/[!@#$%^&*()_+={}[\];'"\\|,.<>/?-]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*()_+={}[];\':"\\|,.<>/?-)'
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

router.put('/:id', tokenExtractor, async (req, res) => {
  const userId = parseInt(req.params.id)
  const { newName } = req.body

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only update your own information' })
  }

  const user = await User.findByPk(userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const nameError = validateName(newName)
  if (nameError) {
    return res.status(400).json({ error: nameError })
  }

  user.name = newName
  await user.save()

  const { passwordHash: _, ...userWithoutPassword } = user.toJSON()
  res.json(userWithoutPassword)
})

router.put('/:id/password', tokenExtractor, async (req, res) => {
  const userId = parseInt(req.params.id)
  const { currentPassword, newPassword } = req.body

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only change your own password' })
  }

  const user = await User.findByPk(userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required' })
  }

  const passwordCorrect = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!passwordCorrect) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const passwordError = validatePassword(newPassword)
  if (passwordError) {
    return res.status(400).json({ error: passwordError })
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash)
  if (isSamePassword) {
    return res.status(400).json({ error: 'New password must be different from current password' })
  }

  const saltRounds = 10
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds)
  await user.save()

  res.json({ message: 'Password updated successfully' })
})

export default router