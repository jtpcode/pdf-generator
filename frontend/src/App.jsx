import { useState } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
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

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setShowRegister(false)
  }

  const handleLogout = () => {
    setUser(null)
    setShowRegister(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : showRegister ? (
        <Register
          onRegisterSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      ) : (
        <Login
          onLogin={handleAuthSuccess}
          onSwitchToRegister={() => setShowRegister(true)}
        />
      )}
    </ThemeProvider>
  )
}

export default App
