const login = async (username, password) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Login failed')
  }

  return response.json()
}

const logout = async () => {
  const token = localStorage.getItem('token')

  if (token) {
    try {
      await fetch('/api/logout', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }
  }

  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const getStoredUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

const getToken = () => {
  return localStorage.getItem('token')
}

const saveUser = (userData) => {
  localStorage.setItem('token', userData.token)
  localStorage.setItem('user', JSON.stringify(userData))
}

export default { login, logout, getStoredUser, getToken, saveUser }