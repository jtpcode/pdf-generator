import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
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
    authService.logout()
    setUser(null)
    setShowRegister(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {user ? (
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
            <Route path="/settings" element={<Settings user={user} onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
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
      </Router>
    </ThemeProvider>
  )
}

export default App
