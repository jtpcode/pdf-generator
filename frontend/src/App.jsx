import { useState } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Login from './components/Login'
import Register from './components/Register'
import Welcome from './components/Welcome'
import authService from './services/authService'

const theme = createTheme()

const App = () => {
  const [user, setUser] = useState(() => {
    try {
      return authService.getStoredUser()
    } catch (error) {
      console.error('Failed to retrieve stored user:', error)
      return null
    }
  })
  const [showRegister, setShowRegister] = useState(false)

  const handleLogin = (userData) => {
    setUser(userData)
    setShowRegister(false)
  }

  const handleRegisterSuccess = (userData) => {
    setUser(userData)
    setShowRegister(false)
  }

  const handleLogout = () => {
    setUser(null)
    setShowRegister(false)
  }

  const handleSwitchToRegister = () => {
    setShowRegister(true)
  }

  const handleSwitchToLogin = () => {
    setShowRegister(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {user ? (
        <Welcome user={user} onLogout={handleLogout} />
      ) : showRegister ? (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      ) : (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
    </ThemeProvider>
  )
}

export default App
