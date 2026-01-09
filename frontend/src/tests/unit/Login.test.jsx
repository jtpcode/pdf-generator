import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../../components/Login'
import authService from '../../services/authService'

vi.mock('../../services/authService')

describe('Login Component', () => {
  const mockOnLogin = vi.fn()
  const mockOnSwitchToRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all elements', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    expect(screen.getByText('PDF Generator Login')).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('updates username input when user types', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    await user.type(usernameInput, 'testuser')

    expect(usernameInput).toHaveValue('testuser')
  })

  it('updates password input when user types', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'testpass123')

    expect(passwordInput).toHaveValue('testpass123')
  })

  it('calls authService.login, authService.saveUser and onLogin with correct credentials on form submit', async () => {
    const user = userEvent.setup()
    const mockUserData = { username: 'testuser', token: 'test-token' }
    authService.login.mockResolvedValue(mockUserData)
    authService.saveUser.mockImplementation(() => {})

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass123')
    await user.click(loginButton)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('testuser', 'testpass123')
      expect(authService.saveUser).toHaveBeenCalledWith(mockUserData)
      expect(mockOnLogin).toHaveBeenCalledWith(mockUserData)
    })
  })

  it('displays error message when login fails', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid credentials'
    authService.login.mockRejectedValue(new Error(errorMessage))

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'wronguser')
    await user.type(passwordInput, 'wrongpass')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('displays generic error message when error has no message', async () => {
    const user = userEvent.setup()
    authService.login.mockRejectedValue(new Error())

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('clears error message on new login attempt', async () => {
    const user = userEvent.setup()
    authService.login.mockRejectedValueOnce(new Error('First error'))

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    // First failed login
    await user.type(usernameInput, 'user1')
    await user.type(passwordInput, 'pass1')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Clear inputs and try again
    authService.login.mockResolvedValue({ username: 'user2', token: 'token' })
    await user.clear(usernameInput)
    await user.clear(passwordInput)
    await user.type(usernameInput, 'user2')
    await user.type(passwordInput, 'pass2')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })

  it('does not call onLogin if token is missing', async () => {
    const user = userEvent.setup()
    const mockUserData = { username: 'testuser' } // No token
    authService.login.mockResolvedValue(mockUserData)

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    await user.click(loginButton)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled()
    })

    expect(authService.saveUser).not.toHaveBeenCalled()
    expect(mockOnLogin).not.toHaveBeenCalled()
  })

  it('has required attribute on username and password fields', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(usernameInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('password field has correct type attribute', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows loading state during login', async () => {
    const user = userEvent.setup()
    // Mock login to never resolve to simulate loading state
    authService.login.mockImplementation(() => new Promise(() => {}))

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass123')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Logging in...')).toBeInTheDocument()
    })
  })

  it('disables inputs and button during login', async () => {
    const user = userEvent.setup()
    authService.login.mockImplementation(() => new Promise(() => {}))

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass123')
    await user.click(loginButton)

    await waitFor(() => {
      expect(usernameInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(loginButton).toBeDisabled()
    })
  })

  it('re-enables inputs after failed login', async () => {
    const user = userEvent.setup()
    authService.login.mockRejectedValue(new Error('Login failed'))

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass123')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument()
    })

    expect(usernameInput).not.toBeDisabled()
    expect(passwordInput).not.toBeDisabled()
    expect(loginButton).not.toBeDisabled()
  })

  it('shows link to switch to register page', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register here/i })).toBeInTheDocument()
  })

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const registerLink = screen.getByRole('button', { name: /register here/i })
    await user.click(registerLink)

    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1)
  })
})