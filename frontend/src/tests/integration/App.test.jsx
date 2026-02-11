import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import authService from '../../services/authService'

vi.mock('../../services/authService')

vi.mock('../../components/Login', () => ({
  default: ({ onLogin, onSwitchToRegister }) => (
    <div>
      <h1>Login Mock</h1>
      <button onClick={() => onLogin({ username: 'testuser', token: 'test-token' })}>
        Mock Login
      </button>
      <button onClick={onSwitchToRegister}>Switch to Register</button>
    </div>
  )
}))

vi.mock('../../components/Register', () => ({
  default: ({ onRegisterSuccess, onSwitchToLogin }) => (
    <div>
      <h1>Register Mock</h1>
      <button onClick={() => onRegisterSuccess({ username: 'newuser', token: 'new-token' })}>
        Mock Register
      </button>
      <button onClick={onSwitchToLogin}>Switch to Login</button>
    </div>
  )
}))

vi.mock('../../components/Dashboard', () => ({
  default: ({ user, onLogout }) => (
    <div>
      <h1>Dashboard Mock</h1>
      <p>User: {user.username}</p>
      <button onClick={onLogout}>Mock Logout</button>
    </div>
  )
}))

vi.mock('../../components/Settings', () => ({
  default: ({ user, onLogout }) => (
    <div>
      <h1>Settings Mock</h1>
      <p>User: {user.username}</p>
      <button onClick={onLogout}>Mock Logout</button>
    </div>
  )
}))

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authService.getStoredUser.mockReturnValue(null)
    authService.logout.mockImplementation(() => {})
  })

  describe('Initial State - No Stored User', () => {
    it('renders Login component when no user is stored', () => {
      render(<App />)
      expect(screen.getByText('Login Mock')).toBeInTheDocument()
    })

    it('shows Register when switch to register is clicked', async () => {
      const user = userEvent.setup()
      render(<App />)

      const switchButton = screen.getByText('Switch to Register')
      await user.click(switchButton)

      expect(screen.getByText('Register Mock')).toBeInTheDocument()
      expect(screen.queryByText('Login Mock')).not.toBeInTheDocument()
    })

    it('switches back to Login from Register', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Switch to Register'))
      expect(screen.getByText('Register Mock')).toBeInTheDocument()

      await user.click(screen.getByText('Switch to Login'))
      expect(screen.getByText('Login Mock')).toBeInTheDocument()
    })
  })

  describe('Initial State - With Stored User', () => {
    it('renders Dashboard when user is stored in localStorage', () => {
      authService.getStoredUser.mockReturnValue({ username: 'storeduser', token: 'stored-token' })
      render(<App />)

      expect(screen.getByText('Dashboard Mock')).toBeInTheDocument()
      expect(screen.getByText('User: storeduser')).toBeInTheDocument()
    })

    it('handles invalid stored user data gracefully', () => {
      authService.getStoredUser.mockImplementation(() => {
        throw new Error('Invalid JSON')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<App />)

      expect(screen.getByText('Login Mock')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to retrieve stored user:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Authentication Flow', () => {
    it('updates user state when login succeeds', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Mock Login'))

      expect(screen.getByText('Dashboard Mock')).toBeInTheDocument()
      expect(screen.getByText('User: testuser')).toBeInTheDocument()
    })

    it('updates user state when registration succeeds', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Switch to Register'))
      await user.click(screen.getByText('Mock Register'))

      expect(screen.getByText('Dashboard Mock')).toBeInTheDocument()
      expect(screen.getByText('User: newuser')).toBeInTheDocument()
    })

    it('clears user state and calls authService.logout when logout is clicked', async () => {
      const user = userEvent.setup()
      authService.getStoredUser.mockReturnValue({ username: 'storeduser', token: 'stored-token' })
      render(<App />)

      expect(screen.getByText('Dashboard Mock')).toBeInTheDocument()

      await user.click(screen.getByText('Mock Logout'))

      expect(authService.logout).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Login Mock')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard Mock')).not.toBeInTheDocument()
    })

    it('resets showRegister state after successful login', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Switch to Register'))
      expect(screen.getByText('Register Mock')).toBeInTheDocument()

      await user.click(screen.getByText('Mock Register'))

      await user.click(screen.getByText('Mock Logout'))
      expect(screen.getByText('Login Mock')).toBeInTheDocument()
      expect(screen.queryByText('Register Mock')).not.toBeInTheDocument()
    })
  })

  describe('Routing', () => {
    it('redirects to /dashboard when user is authenticated and visits root', () => {
      authService.getStoredUser.mockReturnValue({ username: 'testuser', token: 'test-token' })

      window.history.pushState({}, '', '/')
      render(<App />)

      expect(window.location.pathname).toBe('/dashboard')
      expect(screen.getByText('Dashboard Mock')).toBeInTheDocument()
    })

    it('allows navigation to /settings when authenticated', () => {
      authService.getStoredUser.mockReturnValue({ username: 'testuser', token: 'test-token' })

      window.history.pushState({}, '', '/settings')
      render(<App />)

      expect(screen.getByText('Settings Mock')).toBeInTheDocument()
      expect(screen.getByText('User: testuser')).toBeInTheDocument()
    })

    it('redirects to dashboard for unknown routes when authenticated', () => {
      authService.getStoredUser.mockReturnValue({ username: 'testuser', token: 'test-token' })

      window.history.pushState({}, '', '/unknown-route')
      render(<App />)

      expect(window.location.pathname).toBe('/dashboard')
      expect(screen.getByText('Dashboard Mock')).toBeInTheDocument()
    })

    it('logout from Settings page returns to Login', async () => {
      const user = userEvent.setup()
      authService.getStoredUser.mockReturnValue({ username: 'testuser', token: 'test-token' })

      window.history.pushState({}, '', '/settings')
      render(<App />)

      expect(screen.getByText('Settings Mock')).toBeInTheDocument()

      await user.click(screen.getByText('Mock Logout'))

      expect(screen.getByText('Login Mock')).toBeInTheDocument()
      expect(authService.logout).toHaveBeenCalledTimes(1)
    })
  })
})
