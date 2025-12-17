import { describe, test, expect, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import app from '../../app.js'
import { User, Session, File } from '../../models/index.js'
import { sequelize } from '../../utils/db.js'

const api = supertest(app)

beforeEach(async () => {
  // Reset database before each test
  await api.post('/api/testing/resetDb')
})

afterAll(async () => {
  // Clean up uploads after all tests
  await api.post('/api/testing/deleteTestUploads')
  await sequelize.close()
})

// Helper functions
const createUser = async (username = 'testuser', name = 'Test User') => {
  const passwordHash = await bcrypt.hash('password123', 1)
  return await User.create({
    username,
    name,
    passwordHash
  })
}

const loginUser = async (username = 'testuser') => {
  const response = await api
    .post('/api/login')
    .send({ username, password: 'password123' })
    .expect(200)

  return response.body.token
}

const createAndLoginUser = async (username = 'testuser', name = 'Test User') => {
  await createUser(username, name)
  return await loginUser(username)
}

const uploadFile = (token, filename, contentType, content = 'mock file content') => {
  const buffer = Buffer.from(content)

  const request = api
    .post('/api/files')
    .attach('file', buffer, {
      filename,
      contentType
    })

  if (token) {
    request.set('Authorization', `bearer ${token}`)
  }

  return request
}

describe('User API', () => {
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
  test('returns token and stores session with valid credentials', async () => {
    const user = await createUser()

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
    await createUser()

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

describe('Logout API', () => {
  test('destroys session with valid token', async () => {
    const user = await createUser()
    const token = await loginUser()

    // Verify session exists
    const sessionBefore = await Session.findOne({ where: { userId: user.id } })
    expect(sessionBefore).not.toBeNull()

    // Logout
    await api
      .delete('/api/logout')
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    // Verify session is destroyed
    const sessionAfter = await Session.findOne({ where: { userId: user.id } })
    expect(sessionAfter).toBeNull()
  })

  test('rejects logout without token', async () => {
    await api
      .delete('/api/logout')
      .expect(401)
      .expect({ error: 'token missing' })
  })

  test('rejects logout with invalid token', async () => {
    await api
      .delete('/api/logout')
      .set('Authorization', 'bearer invalidtoken123')
      .expect(401)
      .expect({ error: 'token invalid' })
  })

  test('rejects logout with expired/non-existent session', async () => {
    const user = await createUser()
    const token = await loginUser()

    // Manually delete the session
    await Session.destroy({ where: { userId: user.id } })

    await api
      .delete('/api/logout')
      .set('Authorization', `bearer ${token}`)
      .expect(401)
      .expect({ error: 'token expired or invalid' })
  })
})

describe('File API', () => {
  describe('GET /api/files', () => {
    test('returns empty array when user has no files', async () => {
      const token = await createAndLoginUser()

      const response = await api
        .get('/api/files')
        .set('Authorization', `bearer ${token}`)
        .expect(200)

      expect(response.body).toEqual([])
    })

    test('returns user files in descending order by creation date', async () => {
      const user = await createUser()
      const token = await loginUser()

      // Create test files with different timestamps
      await File.create({
        filename: 'file1.xlsx',
        originalName: 'First-File.xlsx',
        filePath: '/path/to/file1.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 1024,
        userId: user.id
      })

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      await File.create({
        filename: 'file2.xlsx',
        originalName: 'Second-File.xlsx',
        filePath: '/path/to/file2.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 2048,
        userId: user.id
      })

      const response = await api
        .get('/api/files')
        .set('Authorization', `bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body[0].originalName).toBe('Second-File.xlsx')
      expect(response.body[1].originalName).toBe('First-File.xlsx')
      expect(response.body[0].fileSize).toBe(2048)
      expect(response.body[1].fileSize).toBe(1024)
    })

    test('only returns files belonging to authenticated user', async () => {
      const user1 = await createUser('testuser1', 'Test User 1')
      const user2 = await createUser('testuser2', 'Test User 2')

      // Create files for both users
      await File.create({
        filename: 'user1file.xlsx',
        originalName: 'User-1-File.xlsx',
        filePath: '/path/to/user1file.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 1024,
        userId: user1.id
      })

      await File.create({
        filename: 'user2file.xlsx',
        originalName: 'User-2-File.xlsx',
        filePath: '/path/to/user2file.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 2048,
        userId: user2.id
      })

      // Login as user1
      const token = await loginUser('testuser1')

      // Get files for user1
      const response = await api
        .get('/api/files')
        .set('Authorization', `bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].originalName).toBe('User-1-File.xlsx')
    })

    test('rejects request without token', async () => {
      await api
        .get('/api/files')
        .expect(401)
        .expect({ error: 'token missing' })
    })

    test('rejects request with invalid token', async () => {
      await api
        .get('/api/files')
        .set('Authorization', 'bearer invalidtoken123')
        .expect(401)
        .expect({ error: 'token invalid' })
    })
  })

  describe('POST /api/files', () => {
    test('uploads .xlsx file successfully', async () => {
      const token = await createAndLoginUser()

      const response = await uploadFile(
        token,
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ).expect(201)

      expect(response.body.originalName).toBe('test.xlsx')
      expect(response.body.fileSize).toBeGreaterThan(0)
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    test('uploads .xls file successfully', async () => {
      const token = await createAndLoginUser()

      const response = await uploadFile(
        token,
        'test.xls',
        'application/vnd.ms-excel'
      ).expect(201)

      expect(response.body.originalName).toBe('test.xls')
      expect(response.body.fileSize).toBeGreaterThan(0)
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    test('rejects non-Excel file', async () => {
      const token = await createAndLoginUser()

      await uploadFile(
        token,
        'test.pdf',
        'application/pdf'
      ).expect(400)
    })

    test('rejects request without file', async () => {
      const token = await createAndLoginUser()

      const response = await api
        .post('/api/files')
        .set('Authorization', `bearer ${token}`)
        .expect(400)

      expect(response.body.error).toBe('No file uploaded')
    })

    test('rejects request without token', async () => {
      await uploadFile(
        null,
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ).expect(401)
        .expect({ error: 'token missing' })
    })

    test('rejects request with invalid token', async () => {
      await uploadFile(
        'invalidtoken123',
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ).expect(401)
        .expect({ error: 'token invalid' })
    })
  })
})