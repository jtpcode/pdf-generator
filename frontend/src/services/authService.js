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

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const getStoredUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

const saveUser = (userData) => {
  localStorage.setItem('token', userData.token)
  localStorage.setItem('user', JSON.stringify(userData))
}

export default { login, logout, getStoredUser, saveUser }