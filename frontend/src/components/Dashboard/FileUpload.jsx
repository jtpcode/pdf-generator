import PropTypes from 'prop-types'
import {
  Paper,
  Typography,
  Button
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

const FileUpload = ({ onFileUpload, loading }) => {
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h5" gutterBottom>
        Upload File
      </Typography>
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
        disabled={loading}
      >
        Choose File
        <input
          type="file"
          hidden
          onChange={onFileUpload}
        />
      </Button>
    </Paper>
  )
}

FileUpload.propTypes = {
  onFileUpload: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
}

export default FileUpload
