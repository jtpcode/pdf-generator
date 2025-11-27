import { describe, test, expect } from 'vitest'
import { User } from '../../models/index.js'

describe('User Model Validations', () => {
  test('validates username length', async () => {
    const user = User.build({
      username: 'short',
      name: 'Test',
      passwordHash: 'hash'
    })

    await expect(user.validate()).rejects.toThrow()
  })

  test('accepts valid username', async () => {
    const user = User.build({
      username: 'validuser',
      name: 'Test',
      passwordHash: 'hash'
    })

    await expect(user.validate()).resolves.toBeDefined()
  })

  test('disabled defaults to false', () => {
    const user = User.build({
      username: 'testuser',
      name: 'Test',
      passwordHash: 'hash'
    })

    expect(user.disabled).toBe(false)
  })
})