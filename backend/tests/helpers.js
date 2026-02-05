import supertest from 'supertest'
import bcrypt from 'bcrypt'
import ExcelJS from 'exceljs'
import app from '../app.js'
import { User } from '../models/index.js'

const api = supertest(app)

const generateUniqueUsername = (base = 'testuser') => {
  return `${base}_${process.pid}_${Date.now()}`
}

const createUser = async (username = generateUniqueUsername(), name = 'Test User') => {
  const passwordHash = await bcrypt.hash('TestPassword123!', 1)
  return await User.create({
    username,
    name,
    passwordHash
  })
}

const loginUser = async (username = 'testuser') => {
  const response = await api
    .post('/api/login')
    .send({ username, password: 'TestPassword123!' })
    .expect(200)

  return response.body.token
}

const createAndLoginUser = async (username = generateUniqueUsername(), name = 'Test User') => {
  const user = await createUser(username, name)
  return { token: await loginUser(username), user }
}

const createValidExcelBuffer = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')

  worksheet.addRow(['Name', 'Age', 'City'])
  worksheet.addRow(['John', 30, 'London'])
  worksheet.addRow(['Jane', 25, 'Paris'])

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

const createValidPngBuffer = () => {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )
}

const uploadFile = async (token, filename, contentType, content = 'mock file content') => {
  let buffer

  if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    contentType === 'application/vnd.ms-excel') {
    buffer = await createValidExcelBuffer()
  } else if (contentType === 'image/png') {
    buffer = createValidPngBuffer()
  } else {
    buffer = Buffer.from(content)
  }

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
  uploadFile,
  createValidExcelBuffer,
  createValidPngBuffer
}
