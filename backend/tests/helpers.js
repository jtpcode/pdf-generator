import supertest from 'supertest'
import bcrypt from 'bcrypt'
import app from '../app.js'
import { User } from '../models/index.js'

const api = supertest(app)

const generateUniqueUsername = (base = 'testuser') => {
  return `${base}_${process.pid}_${Date.now()}`
}

const createUser = async (username = generateUniqueUsername(), name = 'Test User') => {
  const passwordHash = await bcrypt.hash('testpassword123', 1)
  return await User.create({
    username,
    name,
    passwordHash
  })
}

const loginUser = async (username = 'testuser') => {
  const response = await api
    .post('/api/login')
    .send({ username, password: 'testpassword123' })
    .expect(200)

  return response.body.token
}

const createAndLoginUser = async (username = generateUniqueUsername(), name = 'Test User') => {
  const user = await createUser(username, name)
  return { token: await loginUser(username), user }
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

export {
  api,
  generateUniqueUsername,
  createUser,
  loginUser,
  createAndLoginUser,
  uploadFile
}
