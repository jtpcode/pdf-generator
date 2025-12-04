import { Container, Box, Typography, Button } from '@mui/material'
import authService from '../services/authService'

const Welcome = ({ user, onLogout }) => {
  const handleLogout = () => {
    authService.logout()
    onLogout()
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Welcome!
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Logged in as: {user?.username}
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </Container>
  )
}

export default Welcome