import { Container, Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import Navigation from './Navigation'

const Settings = ({ user, onLogout }) => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Navigation user={user} onLogout={onLogout} />

        <Typography variant="body1" color="text.secondary">
          Settings functionality coming soon...
        </Typography>
      </Box>
    </Container>
  )
}

Settings.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired
  }).isRequired,
  onLogout: PropTypes.func.isRequired
}

export default Settings
