import PropTypes from 'prop-types'
import {
  Paper,
  Typography,
  List,
  Box,
  CircularProgress
} from '@mui/material'
import FileItem from './FileItem'

const FileList = ({ files, loading, onDelete, onGeneratePdf, onHtmlPreview }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fi-FI')
  }

  return (
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
            <FileItem
              key={file.id}
              file={file}
              onDelete={onDelete}
              onGeneratePdf={onGeneratePdf}
              onHtmlPreview={onHtmlPreview}
              loading={loading}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          ))}
        </List>
      )}
    </Paper>
  )
}

FileList.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      originalName: PropTypes.string.isRequired,
      fileSize: PropTypes.number.isRequired,
      createdAt: PropTypes.string.isRequired
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onGeneratePdf: PropTypes.func.isRequired,
  onHtmlPreview: PropTypes.func.isRequired
}

export default FileList
