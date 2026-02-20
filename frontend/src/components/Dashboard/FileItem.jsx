import PropTypes from 'prop-types'
import {
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Tooltip
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import VisibilityIcon from '@mui/icons-material/Visibility'

const FileItem = ({ file, onDelete, onGeneratePdf, onHtmlPreview, loading, formatFileSize, formatDate }) => {
  const isExcelFile = file.originalName.toLowerCase().endsWith('.xls') ||
                     file.originalName.toLowerCase().endsWith('.xlsx')

  return (
    <ListItem
      divider
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isExcelFile && (
            <>
              <Tooltip title="Preview HTML template">
                <IconButton
                  edge="end"
                  aria-label="preview html"
                  onClick={() => onHtmlPreview(file.id)}
                  disabled={loading}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Generate PDF">
                <IconButton
                  edge="end"
                  aria-label="generate pdf"
                  onClick={() => onGeneratePdf(file.id)}
                  disabled={loading}
                >
                  <PictureAsPdfIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => onDelete(file.id, file.originalName)}
            disabled={loading}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      }
    >
      <ListItemText
        primary={file.originalName}
        secondary={`${formatFileSize(file.fileSize)} • ${formatDate(file.createdAt)}`}
      />
    </ListItem>
  )
}

FileItem.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.number.isRequired,
    originalName: PropTypes.string.isRequired,
    fileSize: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onGeneratePdf: PropTypes.func.isRequired,
  onHtmlPreview: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  formatFileSize: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired
}

export default FileItem
