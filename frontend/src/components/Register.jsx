import { useState } from 'react'
import PropTypes from 'prop-types'
import { Container, TextField, Button, Box, Typography, Paper, Alert, CircularProgress, Link, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import authService from '../services/authService'
import { validateUsername, validateName, validatePassword } from '../utils/validation'

const Register = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [usernameOnFocus, setUsernameOnFocus] = useState(false)
  const [nameOnFocus, setNameOnFocus] = useState(false)
  const [passwordOnFocus, setPasswordOnFocus] = useState(false)
  const [confirmPasswordOnFocus, setConfirmPasswordOnFocus] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    const usernameError = validateUsername(username)
    if (usernameError) {
      setError(usernameError)
      return
    }

    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setIsLoading(true)

    try {
      await authService.register(username, name, password)
      const userData = await authService.login(username, password)

      if (userData.token) {
        authService.saveAuthData(userData)
        onRegisterSuccess(userData)
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setUsernameOnFocus(true)}
              onBlur={() => setUsernameOnFocus(false)}
              disabled={isLoading}
              helperText={usernameOnFocus ? '3-50 characters, letters, numbers, hyphens(-) and underscores(_) only' : ''}
              required
            />
            <TextField
              fullWidth
              label="Full Name"
              variant="outlined"
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setNameOnFocus(true)}
              onBlur={() => setNameOnFocus(false)}
              disabled={isLoading}
              helperText={nameOnFocus ? '1-100 characters' : ''}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordOnFocus(true)}
              onBlur={() => setPasswordOnFocus(false)}
              disabled={isLoading}
              helperText={passwordOnFocus ? 'Min 12 chars: uppercase, lowercase, number, special char (!@#$%...)' : ''}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmPasswordOnFocus(true)}
              onBlur={() => setConfirmPasswordOnFocus(false)}
              disabled={isLoading}
              helperText={confirmPasswordOnFocus ? 'Must match password above' : ''}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
              disabled={isLoading}
              onMouseDown={(e) => e.preventDefault()}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'inherit' }} />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link
                  component="span"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault()
                    onSwitchToLogin()
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{ cursor: 'pointer' }}
                >
                  Login here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

Register.propTypes = {
  onRegisterSuccess: PropTypes.func.isRequired,
  onSwitchToLogin: PropTypes.func.isRequired,
}

export default Register
