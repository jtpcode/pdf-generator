import { useState } from 'react'
import PropTypes from 'prop-types'
import { Container, TextField, Button, Box, Typography, Paper, Alert, CircularProgress, Link, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import authService from '../services/authService'

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

    if(username.length < 3 || username.length > 50) {
      setError('Username must be between 3 and 50 characters long')
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, hyphens(-) and underscores(_)')
      return
    }

    if(name.length < 1 || name.length > 100) {
      setError('Name must be between 1 and 100 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 12 || password.length > 128) {
      setError('Password must be between 12 and 128 characters long')
      return
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return
    }

    if (!/[!@#$%^&*()_+={}[\];'"\\|,.<>/?-]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&*()_+={}[];\':"\\|,.<>/?-)')
      return
    }

    setIsLoading(true)

    try {
      await authService.register(username, name, password)
      const userData = await authService.login(username, password)

      if (userData.token) {
        authService.saveUser(userData)
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
