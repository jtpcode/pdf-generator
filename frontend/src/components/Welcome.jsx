import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import authService from '../services/authService'
import fileService from '../services/fileService'

const Welcome = ({ user, onLogout }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const fileList = await fileService.getAllFiles()
      setFiles(fileList)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    if (files.length >= 3) {
      setError('File limit reached. You can only upload up to 3 files.')
      setTimeout(() => setError(null), 5000)
      return
    }

    const file = event.target.files[0]
    if (!file) return

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const allowedExtensions = ['.xls', '.xlsx']

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    // Validate both MIME type and extension to prevent MIME type spoofing
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      setError('Only Excel files (.xls, .xlsx) are allowed')
      setTimeout(() => setError(null), 5000)
      return
    }

    try {
      setLoading(true)
      setError(null)
      await fileService.uploadFile(file)
      setSuccess('File uploaded successfully!')
      await fetchFiles()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const handleLogout = () => {
    authService.logout()
    onLogout()
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fi-FI')
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" component="h3">
            Welcome!
          </Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Typography variant="body1" sx={{ mb: 4 }}>
          Logged in as: {user?.username}
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" component="h5" gutterBottom>
            Upload Excel File
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
              onChange={handleFileUpload}
            />
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h5" gutterBottom>
            Your Files
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : files.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No files uploaded yet
            </Typography>
          ) : (
            <List>
              {files.map((file) => (
                <ListItem key={file.id} divider>
                  <ListItemText
                    primary={file.originalName}
                    secondary={`${formatFileSize(file.fileSize)} • ${formatDate(file.createdAt)}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  )
}

export default Welcome