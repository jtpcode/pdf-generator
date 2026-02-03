import { describe, test, expect, afterAll, beforeEach } from 'vitest'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { User, Session, File } from '../../models/index.js'
import { sequelize } from '../../utils/db.js'
import {
  api,
  generateUniqueUsername,
  createUser,
  loginUser,
  createAndLoginUser,
  uploadFile
} from '../helpers.js'

beforeEach(async () => {
  await api.post('/api/testing/resetDb')
}, 15000)

afterAll(async () => {
  await api.post('/api/testing/deleteTestUploads')
  await sequelize.close()
}, 15000)

describe('User API', () => {
  test('creates new user with valid data', async () => {
    const username = generateUniqueUsername()
    const newUser = {
      username,
      name: 'Test User',
      password: 'validpassword123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)

    expect(response.body.username).toBe(username)
    expect(response.body.name).toBe('Test User')
    expect(response.body.passwordHash).toBeUndefined()
  })

  test('rejects user with short username', async () => {
    const newUser = {
      username: 'ab',
      name: 'Test User',
      password: 'validpassword123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Username must be between 3 and 50 characters')
  })

  test('rejects user with empty username', async () => {
    const newUser = {
      username: '',
      name: 'Test User',
      password: 'validpassword123'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
  })

  test('rejects user with username containing special characters', async () => {
    const newUser = {
      username: 'test<script>alert(1)</script>',
      name: 'Test User',
      password: 'validpassword123'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
  })

  test('rejects user with duplicate username', async () => {
    const username = generateUniqueUsername()
    const newUser = {
      username,
      name: 'Test User',
      password: 'validpassword123'
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
      password: 'short'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Password must be at least 12 characters long')
  })

  test('rejects user with too long password', async () => {
    const newUser = {
      username: generateUniqueUsername(),
      name: 'Test User',
      password: 'a'.repeat(129)
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Password must be at most 128 characters long')
  })

  test('rejects user with empty name', async () => {
    const newUser = {
      username: generateUniqueUsername(),
      name: '',
      password: 'validpassword123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Name is required')
  })

  test('rejects user with too long name', async () => {
    const newUser = {
      username: generateUniqueUsername(),
      name: 'a'.repeat(101),
      password: 'validpassword123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Name must be between 1 and 100 characters')
  })

  test('rejects user with non-string name', async () => {
    const newUser = {
      username: generateUniqueUsername(),
      name: 123,
      password: 'validpassword123'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Name is required')
  })

  test('rejects user with non-string password', async () => {
    const newUser = {
      username: generateUniqueUsername(),
      name: 'Test User',
      password: 12345678901234
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Password is required')
  })

  test('rejects user with empty password', async () => {
    const newUser = {
      username: generateUniqueUsername(),
      name: 'Test User',
      password: ''
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(response.body.error).toBe('Password is required')
  })
})

describe('Login API', () => {
  test('returns token and stores session with valid credentials', async () => {
    const username = generateUniqueUsername()
    const user = await createUser(username)

    const response = await api
      .post('/api/login')
      .send({ username, password: 'testpassword123' })
      .expect(200)

    expect(response.body.username).toBe(username)
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
      .send({ username: 'nonuser', password: 'testpassword123' })
      .expect(401)

    expect(response.body.error).toBe('invalid username or password')
    const sessions = await Session.count()
    expect(sessions).toBe(0)
  })

  test('rejects invalid password', async () => {
    const username = generateUniqueUsername()
    await createUser(username)

    const response = await api
      .post('/api/login')
      .send({ username, password: 'wrongpassword' })
      .expect(401)

    expect(response.body.error).toBe('invalid username or password')
    const sessions = await Session.count()
    expect(sessions).toBe(0)
  })

  test('rejects disabled user', async () => {
    const username = generateUniqueUsername()
    await User.create({
      username,
      name: 'Test User',
      passwordHash: await bcrypt.hash('testpassword123', 1),
      disabled: true
    })

    const response = await api
      .post('/api/login')
      .send({ username, password: 'testpassword123' })
      .expect(401)

    expect(response.body.error).toBe('invalid username or password')
    const sessions = await Session.count()
    expect(sessions).toBe(0)
  })
})

describe('Logout API', () => {
  test('destroys session with valid token', async () => {
    const username = generateUniqueUsername()
    const user = await createUser(username)
    const token = await loginUser(username)

    const sessionBefore = await Session.findOne({ where: { userId: user.id } })
    expect(sessionBefore).not.toBeNull()

    await api
      .delete('/api/logout')
      .set('Authorization', `bearer ${token}`)
      .expect(204)

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
    const { token, user } = await createAndLoginUser()

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
      const { token } = await createAndLoginUser()

      const response = await api
        .get('/api/files')
        .set('Authorization', `bearer ${token}`)
        .expect(200)

      expect(response.body).toEqual([])
    })

    test('returns user files in descending order by creation date', async () => {
      const { token, user } = await createAndLoginUser()

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
      await new Promise(resolve => setTimeout(resolve, 50))

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
    }, 15000)

    test('only returns files belonging to authenticated user', async () => {
      const username1 = generateUniqueUsername('user1')
      const username2 = generateUniqueUsername('user2')
      const user1 = await createUser(username1, 'Test User 1')
      const user2 = await createUser(username2, 'Test User 2')

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

      const token = await loginUser(username1)

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
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.status).toBe(201)

      expect(response.body.originalName).toBe('test.xlsx')
      expect(response.body.fileSize).toBeGreaterThan(0)
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    test('uploads .xls file successfully', async () => {
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        'test.xls',
        'application/vnd.ms-excel'
      )
      expect(response.status).toBe(201)

      expect(response.body.originalName).toBe('test.xls')
      expect(response.body.fileSize).toBeGreaterThan(0)
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    test('uploads .png file successfully', async () => {
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        'test.png',
        'image/png'
      )
      expect(response.status).toBe(201)

      expect(response.body.originalName).toBe('test.png')
      expect(response.body.fileSize).toBeGreaterThan(0)
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    test('rejects non-Excel file', async () => {
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        'test.pdf',
        'application/pdf'
      )
      expect(response.status).toBe(500)
    })

    test('handles file with empty filename', async () => {
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        '',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.status).toBe(400)
    })

    test('rejects request without file', async () => {
      const { token } = await createAndLoginUser()

      const response = await api
        .post('/api/files')
        .set('Authorization', `bearer ${token}`)
        .expect(400)

      expect(response.body.error).toBe('No file uploaded')
    })

    test('rejects request without token', async () => {
      const response = await uploadFile(
        null,
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'token missing' })
    })

    test('rejects request with invalid token', async () => {
      const response = await uploadFile(
        'invalidtoken123',
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'token invalid' })
    })
  })
})

describe('DELETE /api/files/:id', () => {
  test('deletes own file successfully', async () => {
    const { token } = await createAndLoginUser()

    const uploadResponse = await uploadFile(
      token,
      'test.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    const fileId = uploadResponse.body.id

    await api
      .delete(`/api/files/${fileId}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    const getResponse = await api
      .get('/api/files')
      .set('Authorization', `bearer ${token}`)
      .expect(200)

    expect(getResponse.body).toHaveLength(0)
  })

  test('returns 404 when deleting non-existent file', async () => {
    const { token } = await createAndLoginUser()

    const response = await api
      .delete('/api/files/99999')
      .set('Authorization', `bearer ${token}`)
      .expect(404)

    expect(response.body.error).toBe('File not found')
  })

  test('returns 403 when trying to delete another user\'s file', async () => {
    const { token: token1 } = await createAndLoginUser(
      generateUniqueUsername('user1'),
      'Test User 1'
    )
    const { token: token2 } = await createAndLoginUser(
      generateUniqueUsername('user2'),
      'Test User 2'
    )

    const uploadResponse = await uploadFile(
      token1,
      'test.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    const fileId = uploadResponse.body.id

    const response = await api
      .delete(`/api/files/${fileId}`)
      .set('Authorization', `bearer ${token2}`)
      .expect(403)

    expect(response.body.error).toBe('Access denied')
  })

  test('returns 401 when not authenticated', async () => {
    await api
      .delete('/api/files/1')
      .expect(401)
      .expect({ error: 'token missing' })
  })
})

describe('PDF Generation API', () => {
  test('generates PDF successfully for valid Excel file', async () => {
    const { token } = await createAndLoginUser()

    const uploadResponse = await uploadFile(
      token,
      'test.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    const fileId = uploadResponse.body.id

    const response = await api
      .get(`/api/files/${fileId}/pdf`)
      .set('Authorization', `bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /pdf/)

    expect(response.header['content-disposition']).toMatch(/inline/)
    expect(response.header['content-disposition']).toMatch(/filename="Product Name\.pdf"/)
    expect(response.body).toBeDefined()
  })

  test('returns 404 for non-existent file', async () => {
    const { token } = await createAndLoginUser()

    const response = await api
      .get('/api/files/99999/pdf')
      .set('Authorization', `bearer ${token}`)
      .expect(404)

    expect(response.body.error).toBe('File not found')
  })

  test('returns 403 for other user\'s file', async () => {
    const { token: token1 } = await createAndLoginUser(
      generateUniqueUsername('user1'),
      'Test User 1'
    )
    const { token: token2 } = await createAndLoginUser(
      generateUniqueUsername('user2'),
      'Test User 2'
    )

    const uploadResponse = await uploadFile(
      token1,
      'test.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    const fileId = uploadResponse.body.id

    const response = await api
      .get(`/api/files/${fileId}/pdf`)
      .set('Authorization', `bearer ${token2}`)
      .expect(403)

    expect(response.body.error).toBe('Access denied')
  })

  test('returns 401 without authentication token', async () => {
    await api
      .get('/api/files/1/pdf')
      .expect(401)
      .expect({ error: 'token missing' })
  })

  test('returns 400 for invalid file ID', async () => {
    const { token } = await createAndLoginUser()

    const response = await api
      .get('/api/files/invalid/pdf')
      .set('Authorization', `bearer ${token}`)
      .expect(400)

    expect(response.body.error).toBe('Invalid file ID')
  })

  test('returns 400 for corrupted Excel file', async () => {
    const { token } = await createAndLoginUser()

    const corruptedBuffer = Buffer.from('PK\x03\x04' + 'corrupted Excel data')

    const uploadResponse = await api
      .post('/api/files')
      .attach('file', corruptedBuffer, {
        filename: 'corrupted.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      .set('Authorization', `bearer ${token}`)
      .expect(201)

    const fileId = uploadResponse.body.id

    const response = await api
      .get(`/api/files/${fileId}/pdf`)
      .set('Authorization', `bearer ${token}`)
      .expect(400)

    expect(response.body.error).toBe('Failed to parse Excel file. File may be corrupted.')
  })
})
