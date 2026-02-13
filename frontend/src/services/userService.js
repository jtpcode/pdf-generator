import authService from './authService'

const updateUser = async (userId, newName) => {
  const token = authService.getToken()

  if (!token) {
    throw new Error('Authentication required')
  }

  if (!newName) {
    throw new Error('Name is required')
  }

  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ newName })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update user information')
  }

  const updatedUser = await response.json()

  const storedUser = authService.getStoredUser()
  if (storedUser) {
    authService.saveUser({ ...storedUser, ...updatedUser })
  }

  return updatedUser
}

const changePassword = async (userId, currentPassword, newPassword) => {
  const token = authService.getToken()

  if (!token) {
    throw new Error('Authentication required')
  }

  if (!currentPassword || !newPassword) {
    throw new Error('Both current and new passwords are required')
  }

  const response = await fetch(`/api/users/${userId}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to change password')
  }

  return response.json()
}

export default {
  updateUser,
  changePassword
}
