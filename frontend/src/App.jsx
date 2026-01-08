import { useState } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Login from './components/Login'
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

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {user ? (
        <Welcome user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </ThemeProvider>
  )
}

export default App
