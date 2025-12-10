import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Welcome from '../../components/Welcome'
import authService from '../../services/authService'

vi.mock('../../services/authService')

describe('Welcome Component', () => {
  const mockOnLogout = vi.fn()
  const mockUser = { username: 'testuser' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome message', () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByText('Welcome!')).toBeInTheDocument()
  })

  it('displays username correctly', () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByText(/Logged in as: testuser/i)).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    expect(logoutButton).toBeInTheDocument()
  })

  it('calls authService.logout and onLogout when logout button is clicked', async () => {
    const user = userEvent.setup()
    authService.logout.mockImplementation(() => {})

    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(mockOnLogout).toHaveBeenCalledTimes(1)
  })

  it('handles undefined user gracefully', () => {
    render(<Welcome user={undefined} onLogout={mockOnLogout} />)

    expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument()
  })

  it('handles null user gracefully', () => {
    render(<Welcome user={null} onLogout={mockOnLogout} />)

    expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument()
  })

  it('handles user without username property', () => {
    const userWithoutUsername = {}
    render(<Welcome user={userWithoutUsername} onLogout={mockOnLogout} />)

    expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument()
  })

  it('logout button is clickable and not disabled', () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    expect(logoutButton).not.toBeDisabled()
  })
})