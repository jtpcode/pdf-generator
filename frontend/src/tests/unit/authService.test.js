import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import authService from '../../services/authService'

describe('authService', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('register', () => {
    it('sends POST request with correct data', async () => {
      const mockResponse = { username: 'testuser', token: 'test-token' }
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await authService.register('testuser', 'Test User', 'TestPass123!')

      expect(global.fetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', name: 'Test User', password: 'TestPass123!' })
      })
      expect(result).toEqual(mockResponse)
    })

    it('throws error when username is missing', async () => {
      await expect(authService.register('', 'Test User', 'password'))
        .rejects.toThrow('All fields are required')
    })

    it('throws error when name is missing', async () => {
      await expect(authService.register('testuser', '', 'password'))
        .rejects.toThrow('All fields are required')
    })

    it('throws error when password is missing', async () => {
      await expect(authService.register('testuser', 'Test User', ''))
        .rejects.toThrow('All fields are required')
    })

    it('throws error when username is not a string', async () => {
      await expect(authService.register(123, 'Test User', 'password'))
        .rejects.toThrow('Invalid input format')
    })

    it('throws error when name is not a string', async () => {
      await expect(authService.register('testuser', 123, 'password'))
        .rejects.toThrow('Invalid input format')
    })

    it('throws error when password is not a string', async () => {
      await expect(authService.register('testuser', 'Test User', 123))
        .rejects.toThrow('Invalid input format')
    })

    it('throws error with server error message when registration fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Username already exists' })
      })

      await expect(authService.register('testuser', 'Test User', 'password'))
        .rejects.toThrow('Username already exists')
    })

    it('throws generic error when server returns no error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({})
      })

      await expect(authService.register('testuser', 'Test User', 'password'))
        .rejects.toThrow('Registration failed')
    })
  })

  describe('login', () => {
    it('sends POST request with correct credentials', async () => {
      const mockResponse = { username: 'testuser', token: 'test-token' }
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await authService.login('testuser', 'password123')

      expect(global.fetch).toHaveBeenCalledWith('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password123' })
      })
      expect(result).toEqual(mockResponse)
    })

    it('throws error when username is missing', async () => {
      await expect(authService.login('', 'password'))
        .rejects.toThrow('Username and password are required')
    })

    it('throws error when password is missing', async () => {
      await expect(authService.login('testuser', ''))
        .rejects.toThrow('Username and password are required')
    })

    it('throws error when username is not a string', async () => {
      await expect(authService.login(123, 'password'))
        .rejects.toThrow('Invalid credentials format')
    })

    it('throws error when password is not a string', async () => {
      await expect(authService.login('testuser', 123))
        .rejects.toThrow('Invalid credentials format')
    })

    it('throws error with server error message when login fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      })

      await expect(authService.login('testuser', 'wrongpass'))
        .rejects.toThrow('Invalid credentials')
    })

    it('throws generic error when server returns no error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({})
      })

      await expect(authService.login('testuser', 'password'))
        .rejects.toThrow('Login failed')
    })
  })

  describe('logout', () => {
    it('sends DELETE request with token when token exists', async () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ username: 'testuser' }))

      global.fetch.mockResolvedValue({ ok: true })

      await authService.logout()

      expect(global.fetch).toHaveBeenCalledWith('/api/logout', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      })
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('clears localStorage even when request fails', async () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ username: 'testuser' }))

      global.fetch.mockRejectedValue(new Error('Network error'))

      await authService.logout()

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('clears localStorage when no token exists', async () => {
      localStorage.setItem('user', JSON.stringify({ username: 'testuser' }))

      await authService.logout()

      expect(global.fetch).not.toHaveBeenCalled()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('getStoredUser', () => {
    it('returns parsed user data from localStorage', () => {
      const userData = { username: 'testuser', token: 'test-token' }
      localStorage.setItem('user', JSON.stringify(userData))

      const result = authService.getStoredUser()

      expect(result).toEqual(userData)
    })

    it('returns null when no user is stored', () => {
      const result = authService.getStoredUser()

      expect(result).toBeNull()
    })
  })

  describe('getToken', () => {
    it('returns token from localStorage', () => {
      localStorage.setItem('token', 'test-token')

      const result = authService.getToken()

      expect(result).toBe('test-token')
    })

    it('returns null when no token is stored', () => {
      const result = authService.getToken()

      expect(result).toBeNull()
    })
  })

  describe('saveUser', () => {
    it('saves token and user data to localStorage', () => {
      const userData = { username: 'testuser', token: 'test-token' }

      authService.saveUser(userData)

      expect(localStorage.getItem('token')).toBe('test-token')
      expect(localStorage.getItem('user')).toBe(JSON.stringify(userData))
    })
  })
})
