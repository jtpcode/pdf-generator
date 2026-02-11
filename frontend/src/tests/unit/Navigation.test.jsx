import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navigation from '../../components/Navigation'
import { renderWithRouter } from './helpers'

describe('Navigation Component', () => {
  const mockUser = { username: 'testuser' }
  const mockOnLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation with title', () => {
    renderWithRouter(<Navigation user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByText('PDF Generator')).toBeInTheDocument()
  })

  it('displays username', () => {
    renderWithRouter(<Navigation user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByText(/Hello, testuser/i)).toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderWithRouter(<Navigation user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('calls onLogout when logout button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Navigation user={mockUser} onLogout={mockOnLogout} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockOnLogout).toHaveBeenCalledTimes(1)
  })

  it('renders Dashboard and Settings tabs', () => {
    renderWithRouter(<Navigation user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders tabs with correct navigation paths', () => {
    renderWithRouter(<Navigation user={mockUser} onLogout={mockOnLogout} />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    const settingsLink = screen.getByText('Settings').closest('a')

    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })

  it('renders with undefined user gracefully', () => {
    renderWithRouter(<Navigation user={undefined} onLogout={mockOnLogout} />)

    expect(screen.getByText(/Hello,/i)).toBeInTheDocument()
  })
})
