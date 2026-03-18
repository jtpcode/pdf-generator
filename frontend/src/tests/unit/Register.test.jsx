import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../../components/Register'
import authService from '../../services/authService'

vi.mock('../../services/authService', () => ({
  default: {
    register: vi.fn(),
    login: vi.fn(),
    saveAuthData: vi.fn(),
  }
}))

describe('Register Component', () => {
  const mockOnRegisterSuccess = vi.fn()
  const mockOnSwitchToLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when name is too short (1 character)', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'A')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Name must be between 2 and 100 characters/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when name is too long (101 characters)', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const longName = 'a'.repeat(101)
    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), longName)
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Name must be between 2 and 100 characters/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'DifferentPass1!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'short')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'short')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 12 characters long/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when password is too long', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const longPassword = 'a'.repeat(129)
    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], longPassword)
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), longPassword)

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Password must be at most 128 characters long/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  }, 10000)

  it('shows error when username is too short', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'ab')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Username must be between 3 and 50 characters/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  }, 10000)

  it('shows error when username is too long', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const longUsername = 'a'.repeat(51)
    await user.type(screen.getByLabelText(/username/i), longUsername)
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Username must be between 3 and 50 characters/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when username contains invalid characters', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'user@invalid')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Username can only contain letters, numbers, hyphens\(-\) and underscores\(_\)/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('successfully registers and logs in user', async () => {
    const user = userEvent.setup()
    const mockUserData = { token: 'test-token', username: 'testuser', name: 'Test User' }

    authService.register.mockResolvedValue({ username: 'testuser', name: 'Test User' })
    authService.login.mockResolvedValue(mockUserData)

    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith('testuser', 'Test User', 'ValidPassword123!')
      expect(authService.login).toHaveBeenCalledWith('testuser', 'ValidPassword123!')
      expect(authService.saveAuthData).toHaveBeenCalledWith(mockUserData)
      expect(mockOnRegisterSuccess).toHaveBeenCalledWith(mockUserData)
    })
  })

  it('shows error when password is missing lowercase letter', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'VALIDPASSWORD123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'VALIDPASSWORD123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one lowercase letter/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when password is missing uppercase letter', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'validpassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'validpassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when password is missing number', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one number/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error when password is missing special character', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one special character/i)).toBeInTheDocument()
    })

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows error message when registration fails', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Login failed'

    authService.register.mockRejectedValue(new Error(errorMessage))

    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'existinguser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
  })

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const loginLink = screen.getByText(/login here/i)
    await user.click(loginLink)

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1)
  })
})