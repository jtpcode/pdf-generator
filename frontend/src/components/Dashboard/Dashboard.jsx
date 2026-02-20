import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Container,
  Box,
  Typography,
  Alert,
  Paper,
  FormControlLabel,
  Switch
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
  const [usePuppeteer, setUsePuppeteer] = useState(false)

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
      setTimeout(() => setError(null), 5000)
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
      setTimeout(() => setError(null), 5000)
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
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handlePdfGeneration = async (fileId) => {
    try {
      setLoading(true)
      setError(null)

      const pdfBlob = await fileService.generatePdf(fileId, usePuppeteer)

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
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleHtmlPreview = async (fileId) => {
    try {
      setLoading(true)
      setError(null)

      // Open window synchronously before the async fetch to avoid popup blocker
      const newWindow = window.open('about:blank', '_blank')
      if (!newWindow) {
        throw new Error('Failed to open preview window. Please check your popup blocker settings.')
      }

      const html = await fileService.getHtmlPreview(fileId)

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      newWindow.location.href = url

      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setSuccess('HTML preview opened in new window!')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
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

        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
          <FormControlLabel
            control={
              <Switch
                checked={usePuppeteer}
                onChange={(e) => {
                  setUsePuppeteer(e.target.checked)
                }}
                slotProps={{ input: { 'aria-label': 'PDFKit / HTML + Puppeteer generator selector' } }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color={!usePuppeteer ? 'primary' : 'text.secondary'} fontWeight={!usePuppeteer ? 'bold' : 'normal'}>
                  PDFKit
                </Typography>
                <Typography variant="body2">/</Typography>
                <Typography variant="body2" color={usePuppeteer ? 'primary' : 'text.secondary'} fontWeight={usePuppeteer ? 'bold' : 'normal'}>
                  HTML + Puppeteer
                </Typography>
              </Box>
            }
          />
        </Paper>

        <FileUpload onFileUpload={handleFileUpload} loading={loading} />

        <FileList
          files={files}
          loading={loading}
          onDelete={handleFileDelete}
          onGeneratePdf={handlePdfGeneration}
          onHtmlPreview={handleHtmlPreview}
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
