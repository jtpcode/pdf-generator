import { describe, test, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import { User } from '../models/index.js'

describe('User API', () => {
  beforeEach(async () => {
    await User.destroy({ where: {} })
  })

  test('creates new user with valid data', async () => {
    const newUser = {
      username: 'testuser',
      name: 'Test User',
      password: 'password123'
    }

    const response = await request(app)
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

    const response = await request(app)
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

    await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(201)

    const response = await request(app)
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

    const response = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Password must be at least 8 characters long')
  })
})