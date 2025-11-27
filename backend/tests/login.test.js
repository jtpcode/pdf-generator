import { describe, test, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import app from '../index.js'
import { User, Session } from '../models/index.js'

const api = supertest(app)

describe('Login API', () => {
  beforeEach(async () => {
    await Session.destroy({ where: {} })
    await User.destroy({ where: {} })
  })

  test('returns token and stores session with valid credentials', async () => {
    // Reduced salt rounds for faster tests
    const password = await bcrypt.hash('password123', 1)
    const user = await User.create({
      username: 'testuser',
      name: 'Test User',
      passwordHash: password
    })

    const response = await api
      .post('/api/login')
      .send({ username: 'testuser', password: 'password123' })
      .expect(200)

    expect(response.body.username).toBe('testuser')
    expect(response.body.name).toBe('Test User')
    expect(response.body.token).toBeTruthy()

    const session = await Session.findOne({ where: { userId: user.id } })
    expect(session).not.toBeNull()

    const expectedHash = crypto.createHash('sha256').update(response.body.token).digest('hex')
    expect(session.tokenHash).toBe(expectedHash)
  })

  test('rejects non-existing user', async () => {
    const response = await api
      .post('/api/login')
      .send({ username: 'nonuser', password: 'password123' })
      .expect(401)

    expect(response.body.error).toBe('invalid username or password')
    const sessions = await Session.count()
    expect(sessions).toBe(0)
  })

  test('rejects invalid password', async () => {
    await User.create({
      username: 'testuser',
      name: 'Test User',
      passwordHash: await bcrypt.hash('password123', 1)
    })

    const response = await api
      .post('/api/login')
      .send({ username: 'testuser', password: 'wrongpassword' })
      .expect(401)

    expect(response.body.error).toBe('invalid username or password')
    const sessions = await Session.count()
    expect(sessions).toBe(0)
  })

  test('rejects disabled user', async () => {
    await User.create({
      username: 'testuser',
      name: 'Test User',
      passwordHash: await bcrypt.hash('password123', 1),
      disabled: true
    })

    const response = await api
      .post('/api/login')
      .send({ username: 'testuser', password: 'password123' })
      .expect(401)

    expect(response.body.error).toBe('invalid username or password')
    const sessions = await Session.count()
    expect(sessions).toBe(0)
  })
})