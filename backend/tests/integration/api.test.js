import { describe, test, expect, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import app from '../../app.js'
import { User, Session } from '../../models/index.js'
import { sequelize } from '../../utils/db.js'

const api = supertest(app)

afterAll(async () => {
  await sequelize.close()
})

describe('User API', () => {
  beforeEach(async () => {
    // Reset database
    await api.post('/api/testing/reset')
  })

  test('creates new user with valid data', async () => {
    const newUser = {
      username: 'testuser',
      name: 'Test User',
      password: 'password123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)

    expect(response.body.username).toBe('testuser')
    expect(response.body.name).toBe('Test User')
    expect(response.body.passwordHash).toBeUndefined()
  })

  test('rejects user with short username', async () => {
    const newUser = {
      username: 'short',
      name: 'Test User',
      password: 'password123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Validation len on username failed')
  })

  test('rejects user with duplicate username', async () => {
    const newUser = {
      username: 'testuser',
      name: 'Test User',
      password: 'password123'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('username must be unique')
  })

  test('rejects user with short password', async () => {
    const newUser = {
      username: 'testuser',
      name: 'Test User',
      password: '123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Password must be at least 8 characters long')
  })
})

describe('Login API', () => {
  beforeEach(async () => {
    // Reset database
    await api.post('/api/testing/reset')
  })

  test('returns token and stores session with valid credentials', async () => {
    // Reduced salt rounds for faster tests
    const password = await bcrypt.hash('password123', 5)
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
      passwordHash: await bcrypt.hash('password123', 5)
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
      passwordHash: await bcrypt.hash('password123', 5),
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