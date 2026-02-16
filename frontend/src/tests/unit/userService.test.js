import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userService from '../../services/userService'
import authService from '../../services/authService'

vi.mock('../../services/authService', () => ({
  default: {
    getToken: vi.fn(),
    getStoredUser: vi.fn(),
    saveUser: vi.fn()
  }
}))

describe('userService', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('updateUser', () => {
    it('sends PUT request with name', async () => {
      const mockToken = 'test-token'
      const mockUpdatedUser = { id: 1, username: 'testuser', name: 'New Name' }

      authService.getToken.mockReturnValue(mockToken)
      authService.getStoredUser.mockReturnValue({ id: 1, username: 'testuser', name: 'Old Name', token: mockToken })

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockUpdatedUser
      })

      const result = await userService.updateUser(1, 'New Name')

      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ newName: 'New Name' })
      })
      expect(result).toEqual(mockUpdatedUser)
      expect(authService.saveUser).toHaveBeenCalled()
    })

    it('throws error when no token is available', async () => {
      authService.getToken.mockReturnValue(null)

      await expect(userService.updateUser(1, 'New Name'))
        .rejects.toThrow('Authentication required')
    })

    it('throws error when name is not provided', async () => {
      authService.getToken.mockReturnValue('test-token')

      await expect(userService.updateUser(1, ''))
        .rejects.toThrow('Name is required')
    })

    it('throws error with server error message when update fails', async () => {
      authService.getToken.mockReturnValue('test-token')

      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Name is invalid' })
      })

      await expect(userService.updateUser(1, 'Bad@Name!'))
        .rejects.toThrow('Name is invalid')
    })

    it('throws generic error when server returns no error message', async () => {
      authService.getToken.mockReturnValue('test-token')

      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({})
      })

      await expect(userService.updateUser(1, 'New Name'))
        .rejects.toThrow('Failed to update user information')
    })
  })

  describe('changePassword', () => {
    it('sends PUT request with passwords', async () => {
      const mockToken = 'test-token'

      authService.getToken.mockReturnValue(mockToken)

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Password updated successfully' })
      })

      const result = await userService.changePassword(1, 'OldPassword123!', 'NewPassword456@')

      expect(global.fetch).toHaveBeenCalledWith('/api/users/1/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456@'
        })
      })
      expect(result).toEqual({ message: 'Password updated successfully' })
    })

    it('throws error when no token is available', async () => {
      authService.getToken.mockReturnValue(null)

      await expect(userService.changePassword(1, 'old', 'new'))
        .rejects.toThrow('Authentication required')
    })

    it('throws error when current password is missing', async () => {
      authService.getToken.mockReturnValue('test-token')

      await expect(userService.changePassword(1, '', 'NewPassword123!'))
        .rejects.toThrow('Both current and new passwords are required')
    })

    it('throws error when new password is missing', async () => {
      authService.getToken.mockReturnValue('test-token')

      await expect(userService.changePassword(1, 'OldPassword123!', ''))
        .rejects.toThrow('Both current and new passwords are required')
    })

    it('throws error with server error message when change fails', async () => {
      authService.getToken.mockReturnValue('test-token')

      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Current password is incorrect' })
      })

      await expect(userService.changePassword(1, 'wrong', 'NewPass123!'))
        .rejects.toThrow('Current password is incorrect')
    })

    it('throws generic error when server returns no error message', async () => {
      authService.getToken.mockReturnValue('test-token')

      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({})
      })

      await expect(userService.changePassword(1, 'old', 'new'))
        .rejects.toThrow('Failed to change password')
    })
  })
})
