import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Container,
  Box,
  Typography,
  Alert
} from '@mui/material'
import fileService from '../../services/fileService'
import FileUpload from './FileUpload'
import FileList from './FileList'
import Navigation from '../Navigation'

const Dashboard = ({ user, onLogout }) => {
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
    const file = event.target.files[0]
    if (!file) return

    if (files.length >= 3) {
      setError('File limit reached. You can only upload up to 3 files.')
      setTimeout(() => setError(null), 5000)
      return
    }

    if (files.some(f => f.originalName === file.name)) {
      setError('A file with the same name already exists.')
      setTimeout(() => setError(null), 5000)
      return
    }

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png'
    ]
    const allowedExtensions = ['.xls', '.xlsx', '.png']

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      setError('Only Excel files (.xls, .xlsx) and PNG images (.png) are allowed')
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

  const handleFileDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await fileService.deleteFile(fileId)
      setSuccess('File deleted successfully!')
      await fetchFiles()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePdfGeneration = async (fileId) => {
    try {
      setLoading(true)
      setError(null)

      const pdfBlob = await fileService.generatePdf(fileId)

      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'Product Name.pdf'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccess('PDF generated successfully!')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Navigation user={user} onLogout={onLogout} />

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

        <FileUpload onFileUpload={handleFileUpload} loading={loading} />

        <FileList
          files={files}
          loading={loading}
          onDelete={handleFileDelete}
          onGeneratePdf={handlePdfGeneration}
        />
      </Box>
    </Container>
  )
}

Dashboard.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired
  }),
  onLogout: PropTypes.func.isRequired
}

export default Dashboard
