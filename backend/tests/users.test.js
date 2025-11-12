import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import { connectToDatabase, sequelize } from '../utils/db.js'
import { User } from '../models/index.js'

describe('User API', () => {
  beforeAll(async () => {
    await connectToDatabase()
    await sequelize.sync({ force: true })
  })

  beforeEach(async () => {
    await User.destroy({ where: {} })
  })

  afterAll(async () => {
    await sequelize.close()
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