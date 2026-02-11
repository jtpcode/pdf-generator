import { useLocation, Link } from 'react-router-dom'
import { Box, Tabs, Tab, Button, Typography } from '@mui/material'
import PropTypes from 'prop-types'

const Navigation = ({ user, onLogout }) => {
  const location = useLocation()

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" component="h3">
          PDF Generator
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Hello, {user?.username}
          </Typography>
          <Button variant="outlined" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={location.pathname} aria-label="navigation tabs">
          <Tab label="Dashboard" value="/dashboard" component={Link} to="/dashboard" />
          <Tab label="Settings" value="/settings" component={Link} to="/settings" />
        </Tabs>
      </Box>
    </>
  )
}

Navigation.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired
  }),
  onLogout: PropTypes.func.isRequired
}

export default Navigation
