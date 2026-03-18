export const validateUsername = (username) => {
  if (!username) return 'Username is required'
  if (username.length < 3 || username.length > 50) {
    return 'Username must be between 3 and 50 characters'
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, hyphens(-) and underscores(_)'
  }
  return null
}

export const validateName = (name) => {
  if (!name) return 'Name is required'
  if (name.length < 2 || name.length > 100) {
    return 'Name must be between 2 and 100 characters'
  }
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 12) {
    return 'Password must be at least 12 characters long'
  }
  if (password.length > 128) {
    return 'Password must be at most 128 characters long'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  if (!/[!@#$%^&*()_+={}[\];'"\\|,.<>/?-]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*()_+={}[];\':"\\|,.<>/?-)'
  }
  return null
}
