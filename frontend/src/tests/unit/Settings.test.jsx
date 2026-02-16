import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from '../../components/Settings'
import userService from '../../services/userService'
import { renderWithRouter } from './helpers.jsx'

vi.mock('../../services/userService')
vi.mock('../../components/Navigation', () => ({
  default: ({ onLogout }) => (
    <div>
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}))

describe('Settings Component', () => {
  const mockOnLogout = vi.fn()
  const mockOnUserUpdate = vi.fn()
  const mockUser = {
    id: 1,
    username: 'testuser',
    name: 'Test User',
    token: 'test-token'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders settings heading', () => {
    renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('renders profile information section', () => {
    renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

    expect(screen.getByRole('heading', { name: 'Profile Information' })).toBeInTheDocument()
    const textboxes = screen.getAllByRole('textbox')
    expect(textboxes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders change password section', () => {
    renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument()
    const passwordFields = screen.getAllByLabelText(/Password/i)
    expect(passwordFields.length).toBe(3)
  })

  it('displays current user information in form fields', () => {
    renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveValue('testuser')
    expect(inputs[0]).toBeDisabled()
    expect(inputs[1]).toHaveValue('Test User')
  })

  describe('Profile Update', () => {
    it('updates profile successfully', async () => {
      const user = userEvent.setup()
      const updatedUser = { id: 1, username: 'testuser', name: 'New Name' }
      userService.updateUser.mockResolvedValue(updatedUser)

      renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

      const inputs = screen.getAllByRole('textbox')
      const nameField = inputs[1]
      const updateButton = screen.getByRole('button', { name: /Update Profile/i })

      await user.clear(nameField)
      await user.type(nameField, 'New Name')
      await user.click(updateButton)

      await waitFor(() => {
        expect(userService.updateUser).toHaveBeenCalledWith(1, 'New Name')
      })

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument()
      })

      expect(mockOnUserUpdate).toHaveBeenCalledWith({
        ...mockUser,
        ...updatedUser
      })
    })

    it('shows error when profile update fails', async () => {
      const user = userEvent.setup()
      userService.updateUser.mockRejectedValue(new Error('Name is too long'))

      renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

      const inputs = screen.getAllByRole('textbox')
      const nameField = inputs[1]
      const updateButton = screen.getByRole('button', { name: /Update Profile/i })

      await user.clear(nameField)
      await user.type(nameField, 'Some Name')
      await user.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText('Name is too long')).toBeInTheDocument()
      })

      expect(mockOnUserUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Password Change', () => {
    it('changes password successfully', async () => {
      const user = userEvent.setup()
      userService.changePassword.mockResolvedValue({ message: 'Password changed successfully' })

      renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

      const passwordFields = screen.getAllByLabelText(/Password/i)
      const currentPasswordField = passwordFields[0]
      const newPasswordField = passwordFields[1]
      const confirmPasswordField = passwordFields[2]
      const changeButton = screen.getByRole('button', { name: /Change Password/i })

      await user.type(currentPasswordField, 'OldPassword123!')
      await user.type(newPasswordField, 'NewPassword456@')
      await user.type(confirmPasswordField, 'NewPassword456@')
      await user.click(changeButton)

      await waitFor(() => {
        expect(userService.changePassword).toHaveBeenCalledWith(
          1,
          'OldPassword123!',
          'NewPassword456@'
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully')).toBeInTheDocument()
      })

      expect(currentPasswordField).toHaveValue('')
      expect(newPasswordField).toHaveValue('')
      expect(confirmPasswordField).toHaveValue('')
    })

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup()

      renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

      const passwordFields = screen.getAllByLabelText(/Password/i)
      const currentPasswordField = passwordFields[0]
      const newPasswordField = passwordFields[1]
      const confirmPasswordField = passwordFields[2]
      const changeButton = screen.getByRole('button', { name: /Change Password/i })

      await user.type(currentPasswordField, 'OldPassword123!')
      await user.type(newPasswordField, 'NewPassword456@')
      await user.type(confirmPasswordField, 'DifferentPassword789#')
      await user.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('New passwords do not match')).toBeInTheDocument()
      })

      expect(userService.changePassword).not.toHaveBeenCalled()
    })

    it('shows error when password change fails', async () => {
      const user = userEvent.setup()
      userService.changePassword.mockRejectedValue(new Error('Current password is incorrect'))

      renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

      const passwordFields = screen.getAllByLabelText(/Password/i)
      const currentPasswordField = passwordFields[0]
      const newPasswordField = passwordFields[1]
      const confirmPasswordField = passwordFields[2]
      const changeButton = screen.getByRole('button', { name: /Change Password/i })

      await user.type(currentPasswordField, 'WrongPassword123!')
      await user.type(newPasswordField, 'NewPassword456@')
      await user.type(confirmPasswordField, 'NewPassword456@')
      await user.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument()
      })
    })

    it('shows error when new password is same as current password', async () => {
      const user = userEvent.setup()

      renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

      const passwordFields = screen.getAllByLabelText(/Password/i)
      const currentPasswordField = passwordFields[0]
      const newPasswordField = passwordFields[1]
      const confirmPasswordField = passwordFields[2]
      const changeButton = screen.getByRole('button', { name: /Change Password/i })

      await user.type(currentPasswordField, 'SamePassword123!')
      await user.type(newPasswordField, 'SamePassword123!')
      await user.type(confirmPasswordField, 'SamePassword123!')
      await user.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('New password must be different from current password')).toBeInTheDocument()
      })

      expect(userService.changePassword).not.toHaveBeenCalled()
    })
  })

  it('calls onLogout when logout button is clicked', async () => {
    const user = userEvent.setup()

    renderWithRouter(<Settings user={mockUser} onLogout={mockOnLogout} onUserUpdate={mockOnUserUpdate} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })
  })
})
