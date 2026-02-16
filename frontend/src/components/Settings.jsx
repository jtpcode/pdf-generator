import { useState } from 'react'
import { Container, Box, Typography, Paper, TextField, Button, Alert, Divider, CircularProgress, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import PropTypes from 'prop-types'
import Navigation from './Navigation'
import userService from '../services/userService'

const Settings = ({ user, onLogout, onUserUpdate }) => {
  const [name, setName] = useState(user.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)

    try {
      const updatedUser = await userService.updateUser(user.id, name)
      setProfileSuccess('Profile updated successfully')
      setTimeout(() => setProfileSuccess(''), 5000)
      onUserUpdate({ ...user, ...updatedUser })
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile')
      setTimeout(() => setProfileError(''), 5000)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      setTimeout(() => setPasswordError(''), 5000)
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      setTimeout(() => setPasswordError(''), 5000)
      return
    }

    setPasswordLoading(true)

    try {
      await userService.changePassword(user.id, currentPassword, newPassword)
      setPasswordSuccess('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(''), 5000)
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password')
      setTimeout(() => setPasswordError(''), 5000)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Navigation user={user} onLogout={onLogout} />

        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
          Settings
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>

          {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
          {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}

          <Box component="form" onSubmit={handleProfileUpdate}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={user.username}
              disabled
              helperText="Username cannot be changed"
            />
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={profileLoading}
              required
              helperText="Your full name (1-100 characters)"
            />
            <Button
              variant="contained"
              type="submit"
              sx={{ mt: 2 }}
              disabled={profileLoading}
            >
              {profileLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'inherit' }} />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>

          {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
          {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}

          <Box component="form" onSubmit={handlePasswordChange}>
            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={passwordLoading}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle current password visibility"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        disabled={passwordLoading}
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Divider sx={{ my: 2 }} />
            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={passwordLoading}
              required
              helperText="At least 12 characters with uppercase, lowercase, number and special character"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle new password visibility"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        disabled={passwordLoading}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={passwordLoading}
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
                        disabled={passwordLoading}
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
              variant="contained"
              type="submit"
              sx={{ mt: 2 }}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'inherit' }} />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

Settings.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    name: PropTypes.string,
    token: PropTypes.string.isRequired
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
  onUserUpdate: PropTypes.func.isRequired
}

export default Settings
