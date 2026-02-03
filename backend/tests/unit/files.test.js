import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { File } from '../../models/index.js'
import { sequelize } from '../../utils/db.js'
import { UPLOADS_DIR } from '../../utils/config.js'
import {
  api,
  createAndLoginUser,
  uploadFile
} from '../helpers.js'

beforeEach(async () => {
  vi.restoreAllMocks()
  await api.post('/api/testing/resetDb')
}, 15000)

afterAll(async () => {
  await api.post('/api/testing/deleteTestUploads')
  await sequelize.close()
}, 15000)

describe('File validation security', () => {
  describe('isValidFilename edge cases', () => {
    test('rejects whitespace-only filename', async () => {
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        '   ',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      expect([400, 500]).toContain(response.status)
    })

    test('rejects filename with only dots', async () => {
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        '...',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      expect([400, 500]).toContain(response.status)
    })

    test('accepts valid .png filename', async () => {
      const { token } = await createAndLoginUser()

      const response = await uploadFile(
        token,
        'test.png',
        'image/png'
      )

      expect(response.status).toBe(201)
      expect(response.body.originalName).toBe('test.png')
    })
  })

  describe('Error handling and cleanup', () => {
    test('cleans up file if database save fails', async () => {
      const { token, user } = await createAndLoginUser()

      const createSpy = vi.spyOn(File, 'create')
      createSpy.mockRejectedValueOnce(new Error('Database error'))

      const uploadsDir = path.join(process.cwd(), UPLOADS_DIR, String(user.id))

      // This is testing code, so it's acceptable to use non-literal paths here
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const filesBefore = await fs.readdir(uploadsDir).catch(() => [])

      const response = await uploadFile(
        token,
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.status).toBe(500)

      // This is testing code, so it's acceptable to use non-literal paths here
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const filesAfter = await fs.readdir(uploadsDir).catch(() => [])

      expect(filesAfter.length).toBe(filesBefore.length)
    })

    test('handles file cleanup failure after database error gracefully', async () => {
      const { token } = await createAndLoginUser()

      const createSpy = vi.spyOn(File, 'create')
      createSpy.mockRejectedValueOnce(new Error('Database error'))

      const unlinkSpy = vi.spyOn(fs, 'unlink')
      unlinkSpy.mockRejectedValueOnce(new Error('Unlink failed'))

      const response = await uploadFile(
        token,
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.status).toBe(500)
    })

    test('handles multer destination error gracefully', async () => {
      const { token } = await createAndLoginUser()

      const mkdirSpy = vi.spyOn(fs, 'mkdir')
      mkdirSpy.mockRejectedValueOnce(new Error('Permission denied'))

      const response = await uploadFile(
        token,
        'test.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.status).toBe(500)
    })
  })
})
