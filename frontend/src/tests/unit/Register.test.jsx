import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../../components/Register'
import authService from '../../services/authService'

vi.mock('../../services/authService', () => ({
  default: {
    register: vi.fn(),
    login: vi.fn(),
    saveUser: vi.fn(),
  }
}))

describe('Register Component', () => {
  const mockOnRegisterSuccess = vi.fn()
  const mockOnSwitchToLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form with all fields', () => {
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i, { selector: 'input' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('displays helper text when fields are focused', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    expect(screen.queryByText(/3-50 characters, letters, numbers, hyphens\(-\) and underscores\(_\) only/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/1-100 characters/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Min 12 chars: uppercase, lowercase, number, special char/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/must match password above/i)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText(/username/i))
    expect(screen.getByText(/3-50 characters, letters, numbers, hyphens\(-\) and underscores\(_\) only/i)).toBeInTheDocument()

    await user.click(screen.getByLabelText(/full name/i))
    expect(screen.queryByText(/3-50 characters, letters, numbers, hyphens\(-\) and underscores\(_\) only/i)).not.toBeInTheDocument()
    expect(screen.getByText(/1-100 characters/i)).toBeInTheDocument()

    await user.click(screen.getAllByLabelText(/password/i)[0])
    expect(screen.queryByText(/1-100 characters/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Min 12 chars: uppercase, lowercase, number, special char/i)).toBeInTheDocument()

    await user.click(screen.getByLabelText(/confirm password/i, { selector: 'input' }))
    expect(screen.queryByText(/Min 12 chars: uppercase, lowercase, number, special char/i)).not.toBeInTheDocument()
    expect(screen.getByText(/must match password above/i)).toBeInTheDocument()
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
      expect(screen.getByText(/password must be between 12 and 128 characters long/i)).toBeInTheDocument()
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
      expect(screen.getByText(/Password must be between 12 and 128 characters long/i)).toBeInTheDocument()
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
      expect(screen.getByText(/Username must be between 3 and 50 characters long/i)).toBeInTheDocument()
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
      expect(authService.saveUser).toHaveBeenCalledWith(mockUserData)
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

  it('shows loading state during registration', async () => {
    const user = userEvent.setup()
    let resolveRegister

    authService.register.mockImplementation(() => new Promise((resolve) => {
      resolveRegister = resolve
    }))

    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/creating account.../i)).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeDisabled()
      expect(screen.getByLabelText(/full name/i)).toBeDisabled()
    })

    resolveRegister({ username: 'testuser', name: 'Test User' })
  })

  it('shows link to switch to login page', () => {
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
    expect(screen.getByText(/login here/i)).toBeInTheDocument()
  })

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const loginLink = screen.getByText(/login here/i)
    await user.click(loginLink)

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1)
  })

  it('clears error message when resubmitting form', async () => {
    const user = userEvent.setup()
    authService.register.mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({ username: 'testuser', name: 'Test User' })
    authService.login.mockResolvedValue({ token: 'test-token', username: 'testuser', name: 'Test User' })

    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'ValidPassword123!')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/first error/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.queryByText(/first error/i)).not.toBeInTheDocument()
    })
  })

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const passwordField = screen.getAllByLabelText(/password/i)[0]
    expect(passwordField).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByLabelText('toggle password visibility')
    await user.click(toggleButton)

    expect(passwordField).toHaveAttribute('type', 'text')

    await user.click(toggleButton)

    expect(passwordField).toHaveAttribute('type', 'password')
  })

  it('toggles confirm password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const confirmPasswordField = screen.getByLabelText(/confirm password/i, { selector: 'input' })
    expect(confirmPasswordField).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByLabelText('toggle confirm password visibility')
    await user.click(toggleButton)

    expect(confirmPasswordField).toHaveAttribute('type', 'text')

    await user.click(toggleButton)

    expect(confirmPasswordField).toHaveAttribute('type', 'password')
  })

  it('password and confirm password visibility toggles work independently', async () => {
    const user = userEvent.setup()
    render(<Register onRegisterSuccess={mockOnRegisterSuccess} onSwitchToLogin={mockOnSwitchToLogin} />)

    const passwordField = screen.getAllByLabelText(/password/i, { selector: 'input' })[0]
    const confirmPasswordField = screen.getByLabelText(/confirm password/i, { selector: 'input' })
    const passwordToggle = screen.getByLabelText('toggle password visibility')
    const confirmPasswordToggle = screen.getByLabelText('toggle confirm password visibility')

    expect(passwordField).toHaveAttribute('type', 'password')
    expect(confirmPasswordField).toHaveAttribute('type', 'password')

    await user.click(passwordToggle)

    expect(passwordField).toHaveAttribute('type', 'text')
    expect(confirmPasswordField).toHaveAttribute('type', 'password')

    await user.click(confirmPasswordToggle)

    expect(passwordField).toHaveAttribute('type', 'text')
    expect(confirmPasswordField).toHaveAttribute('type', 'text')

    await user.click(passwordToggle)

    expect(passwordField).toHaveAttribute('type', 'password')
    expect(confirmPasswordField).toHaveAttribute('type', 'text')
  })
})