const register = async (username, name, password) => {
  if (!username || !name || !password) {
    throw new Error('All fields are required')
  }

  if (typeof username !== 'string' || typeof name !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid input format')
  }

  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, name, password }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Registration failed')
  }

  return response.json()
}

const login = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required')
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid credentials format')
  }

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
    } catch {
      // Ignore - local cleanup happens regardless
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

export default { register, login, logout, getStoredUser, getToken, saveUser }