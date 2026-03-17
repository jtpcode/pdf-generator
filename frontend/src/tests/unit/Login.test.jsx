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

  it('calls authService.login, authService.saveAuthData and onLogin with correct credentials on form submit', async () => {
    const user = userEvent.setup()
    const mockUserData = { username: 'testuser', token: 'test-token' }
    authService.login.mockResolvedValue(mockUserData)
    authService.saveAuthData.mockImplementation(() => {})

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass123')
    await user.click(loginButton)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('testuser', 'testpass123')
      expect(authService.saveAuthData).toHaveBeenCalledWith(mockUserData)
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

    expect(authService.saveAuthData).not.toHaveBeenCalled()
    expect(mockOnLogin).not.toHaveBeenCalled()
  })

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />)

    const registerLink = screen.getByText(/register here/i)
    await user.click(registerLink)

    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1)
  })
})